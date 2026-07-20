const accountModel = require("../models/account.model.js");

async function createAccountController(req, res) {
    try {
        const { currency, accountType } = req.body || {};
        

        const newAccount = await accountModel.create({
            user: req.user._id,
            currency,
            accountType,
            status: "ACTIVE"
        });

        return res.status(201).json({
            message: "Account created successfully",
            status: "success",
            account: {
                id: newAccount._id,
                currency: newAccount.currency,
                status: newAccount.status
            }
        });

    } catch (error) {
        console.log("Account creation error:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: "failed",
            error: error.message
        });
    }
}

async function getUserAccountController(req, res) {
    try {
        const accounts = await accountModel.find({ user: req.user._id });

        // Fetch balance for each account from the ledger
        const accountsWithBalance = await Promise.all(
            accounts.map(async (account) => {
                const balance = await account.getBalance();
                return {
                    id: account._id,
                    currency: account.currency,
                    status: account.status,
                    balance,
                    createdAt: account.createdAt
                };
            })
        );

        return res.status(200).json({
            message: "Accounts fetched successfully",
            status: "success",
            accounts: accountsWithBalance
        });

    } catch (error) {
        console.log("Get accounts error:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: "failed",
            error: error.message
        });
    }
}

async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id  // ensures the account belongs to the logged-in user
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found",
                status: "failed"
            });
        }

        const balance = await account.getBalance();

        return res.status(200).json({
            message: "Balance fetched successfully",
            status: "success",
            account: {
                id: account._id,
                currency: account.currency,
                status: account.status,
                balance
            }
        });

    } catch (error) {
        console.log("Get balance error:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: "failed",
            error: error.message
        });
    }
}

module.exports = { createAccountController, getUserAccountController, getAccountBalanceController };
