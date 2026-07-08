const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware.js");
const { createAccountController } = require("../controllers/account.controller.js");

// POST /api/accounts/create
router.post("/", authMiddleware, createAccountController);

module.exports = router;
