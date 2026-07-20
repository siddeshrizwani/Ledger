const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware.js");
const { createAccountController, getUserAccountController, getAccountBalanceController } = require("../controllers/account.controller.js");

// POST /api/accounts , to create the account 
router.post("/", authMiddleware.authMiddleware, createAccountController);

// GET /api/accounts/ - get all the accounts of the logged in user , its a protected route
router.get("/", authMiddleware.authMiddleware, getUserAccountController);

// GET /api/accounts/balance/:accountId - get balance of a specific account
router.get("/balance/:accountId", authMiddleware.authMiddleware, getAccountBalanceController);

module.exports = router;
