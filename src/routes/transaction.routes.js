const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware.js");
const { createTransaction } = require("../controllers/transaction.controller.js");

// POST /api/transactions
router.post("/", authMiddleware, createTransaction);

module.exports = router;
