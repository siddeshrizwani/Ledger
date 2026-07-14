const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware.js");
const { createTransaction, createInitialFundsTransaction } = require("../controllers/transaction.controller.js");

// POST /api/transactions
router.post("/", authMiddleware.authMiddleware, createTransaction);

/**
 * POST /api/transactions/system/initial-funds
 * Only the system user can transfer initial funds from the system account.
 */
router.post(
    "/system/initial-funds",
    authMiddleware.authMiddleware,
    authMiddleware.authSystemUserMiddleware,
    createInitialFundsTransaction
);

module.exports = router;
