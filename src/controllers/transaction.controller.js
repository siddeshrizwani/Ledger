const mongoose = require("mongoose");
const transactionModel = require("../models/transaction.model.js");
const accountModel = require("../models/account.model.js");
const ledgerModel = require("../models/ledger.model.js");
const { sendTransactionEmail, sendTransactionFailureEmail } = require("../services/email.service.js");

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 *   1. Validate request
 *   2. Validate idempotency key
 *   3. Check account status
 *   4. Derive sender balance from ledger
 *   5. Create transaction (PENDING)
 *   6. Create DEBIT ledger entry
 *   7. Create CREDIT ledger entry
 *   8. Mark transaction COMPLETED
 *   9. Commit MongoDB session
 *   10. Send email notification
 */

async function createTransaction(req, res) {

    let session;

    try {
        const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

        /**
         * 1. Validate request
         */
        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "FromAccount, toAccount, amount and idempotencyKey are required"
            });
        }

        const fromUserAccount = await accountModel.findOne({
            _id: fromAccount,
        });

        const toUserAccount = await accountModel.findOne({
            _id: toAccount,
        });

        if (!fromUserAccount || !toUserAccount) {
            return res.status(400).json({
                message: "Invalid fromAccount or toAccount"
            });
        }

        /**
         * 2. Validate idempotency key
         */

        const isTransactionAlreadyExists = await transactionModel.findOne({
            idempotencyKey: idempotencyKey
        });

        if (isTransactionAlreadyExists) {
            if (isTransactionAlreadyExists.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction already processed",
                    transaction: isTransactionAlreadyExists
                });
            }

            if (isTransactionAlreadyExists.status === "PENDING") {
                return res.status(202).json({
                    message: "Transaction already initiated and is currently being processed. The amount is on its way to the receiver — please do not retry.",
                    status: "pending",
                    transactionId: isTransactionAlreadyExists._id
                });
            }

            if (isTransactionAlreadyExists.status === "FAILED") {
                return res.status(500).json({
                    message: "Transaction processing failed, please retry"
                });
            }

            if (isTransactionAlreadyExists.status === "REVERSED") {
                return res.status(500).json({
                    message: "Transaction was reversed, please retry"
                });
            }
        }

        /**
         * 3. Check account status
         */

        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Both accounts must be ACTIVE"
            });
        }

        /**
         * 4. Derive sender balance from ledger
         */

        const balance = await fromUserAccount.getBalance();

        if (balance < amount) {
            return res.status(400).json({
                message: "Insufficient balance",
                currentBalance: balance
            });
        }
        
        
        /**
         * 5. Create transaction (PENDING)
         */

        session = await mongoose.startSession();
        session.startTransaction();

        const newTransaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0];

        /**
         * 6. Create DEBIT ledger entry
         */

        await ledgerModel.create([{
            account: fromAccount,
            amount,
            transaction: newTransaction._id,
            type: "DEBIT"
        }], { session });

        /**
         * Simulate real-world processing delay (e.g. inter-bank transfer).
         * Money has left the sender (DEBIT written) but hasn't reached the
         * receiver yet. Any duplicate request in this 5-second window will
         * be caught by the idempotency check (status: PENDING) and blocked.
         */
        await new Promise(resolve => setTimeout(resolve, 5000));

        /**
         * 7. Create CREDIT ledger entry
         */

        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: newTransaction._id,
            type: "CREDIT"
        }], { session });

        /**
         * 8. Mark transaction COMPLETED
         */

        await transactionModel.findOneAndUpdate(
            { _id: newTransaction._id },
            { status: "COMPLETED" },
            { session }
        );

        /**
         * 9. Commit MongoDB session
         */
        await session.commitTransaction();

        /**
         * 10. Send email notification
         */

        sendTransactionEmail(req.user.email, req.user.name, {
            amount: newTransaction.amount,
            fromAccount: newTransaction.fromAccount,
            toAccount: newTransaction.toAccount,
            status: newTransaction.status
        }).catch(err => console.log("Email error:", err.message));

        return res.status(201).json({
            message: "Transaction completed successfully",
            status: "success",
            transaction: {
                id: newTransaction._id,
                fromAccount: newTransaction.fromAccount,
                toAccount: newTransaction.toAccount,
                amount: newTransaction.amount,
                status: newTransaction.status
            }
        });

    } catch (error) {
        if (session && session.inTransaction()) {
            await session.abortTransaction();
        }
        console.log("Transaction error:", error);

        // Notify the user their transaction failed (best-effort, non-blocking)
        if (req.user?.email) {
            sendTransactionFailureEmail(req.user.email, req.user.name, {
                amount: req.body?.amount,
                fromAccount: req.body?.fromAccount,
                toAccount: req.body?.toAccount,
                reason: error.message
            }).catch(err => console.log("Failure email error:", err.message));
        }

        return res.status(500).json({
            message: "Internal server error",
            status: "failed",
            error: error.message
        });
    } finally {
        if (session) {
            session.endSession();
        }
    }
}

/**
 * - Create an initial-funds transaction (system user only)
 * Transfers money FROM the system/reserve account TO a target account.
 * Produces a DEBIT on the system account and a CREDIT on the destination.
 * The authenticated user is guaranteed to be the system user by
 * authSystemUserMiddleware, and their account is used as the source.
 *
 * THE INITIAL-FUNDS FLOW:
 *   1. Validate request
 *   2. Resolve system (source) and destination accounts
 *   3. Validate idempotency key
 *   4. Check account status
 *   5. Create transaction (PENDING)
 *   6. Create DEBIT ledger entry (system account)
 *   7. Create CREDIT ledger entry (destination account)
 *   8. Mark transaction COMPLETED
 *   9. Commit MongoDB session
 *   10. Send email notification
 */

async function createInitialFundsTransaction(req, res) {

    let session;

    try {
        const { toAccount, amount, idempotencyKey } = req.body;

        /**
         * 1. Validate request
         */
        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "toAccount, amount and idempotencyKey are required"
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero"
            });
        }

        /**
         * 2. Resolve system (source) and destination accounts
         * The authenticated system user owns exactly one system account,
         * which acts as the source of the initial funds.
         */
        const systemAccount = await accountModel.findOne({
            user: req.user._id
        });

        if (!systemAccount) {
            return res.status(400).json({
                message: "System account not found"
            });
        }

        const toUserAccount = await accountModel.findOne({
            _id: toAccount
        });

        if (!toUserAccount) {
            return res.status(400).json({
                message: "Invalid toAccount"
            });
        }

        /**
         * 3. Validate idempotency key
         */
        const isTransactionAlreadyExists = await transactionModel.findOne({
            idempotencyKey: idempotencyKey
        });

        if (isTransactionAlreadyExists) {
            if (isTransactionAlreadyExists.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Initial funds already processed",
                    transaction: isTransactionAlreadyExists
                });
            }

            if (isTransactionAlreadyExists.status === "PENDING") {
                return res.status(202).json({
                    message: "Transaction already initiated and is currently being processed. The amount is on its way to the receiver — please do not retry.",
                    status: "pending",
                    transactionId: isTransactionAlreadyExists._id
                });
            }

            if (isTransactionAlreadyExists.status === "FAILED") {
                return res.status(500).json({
                    message: "Initial funds processing failed, please retry"
                });
            }

            if (isTransactionAlreadyExists.status === "REVERSED") {
                return res.status(500).json({
                    message: "Initial funds transaction was reversed, please retry"
                });
            }
        }

        /**
         * 4. Check account status
         */
        if (systemAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Both accounts must be ACTIVE"
            });
        }

        /**
         * 5. Create transaction (PENDING)
         */
        session = await mongoose.startSession();
        session.startTransaction();

        const newTransaction = (await transactionModel.create([{
            fromAccount: systemAccount._id,
            toAccount: toUserAccount._id,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0];

        /**
         * 6. Create DEBIT ledger entry (system account)
         */
        await ledgerModel.create([{
            account: systemAccount._id,
            amount,
            transaction: newTransaction._id,
            type: "DEBIT"
        }], { session });

        /**
         * 7. Create CREDIT ledger entry (destination account)
         */
        await ledgerModel.create([{
            account: toUserAccount._id,
            amount,
            transaction: newTransaction._id,
            type: "CREDIT"
        }], { session });

        /**
         * 8. Mark transaction COMPLETED
         */
        await transactionModel.findOneAndUpdate(
            { _id: newTransaction._id },
            { status: "COMPLETED" },
            { session }
        );

        /**
         * 9. Commit MongoDB session
         */
        await session.commitTransaction();

        /**
         * 10. Send email notification
         */
        sendTransactionEmail(req.user.email, req.user.name, {
            amount: newTransaction.amount,
            fromAccount: newTransaction.fromAccount,
            toAccount: newTransaction.toAccount,
            status: newTransaction.status
        }).catch(err => console.log("Email error:", err.message));

        return res.status(201).json({
            message: "Initial funds transferred successfully",
            status: "success",
            transaction: {
                id: newTransaction._id,
                fromAccount: newTransaction.fromAccount,
                toAccount: newTransaction.toAccount,
                amount: newTransaction.amount,
                status: newTransaction.status
            }
        });

    } catch (error) {
        if (session && session.inTransaction()) {
            await session.abortTransaction();
        }
        console.log("Initial funds error:", error);

        // Notify the system user the initial-funds transfer failed (best-effort)
        if (req.user?.email) {
            sendTransactionFailureEmail(req.user.email, req.user.name, {
                amount: req.body?.amount,
                fromAccount: "SYSTEM",
                toAccount: req.body?.toAccount,
                reason: error.message
            }).catch(err => console.log("Failure email error:", err.message));
        }

        return res.status(500).json({
            message: "Internal server error",
            status: "failed",
            error: error.message
        });
    } finally {
        if (session) {
            session.endSession();
        }
    }
}

module.exports = { createTransaction, createInitialFundsTransaction };
