const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware.js");
const { createAccountController, getUserAccountController } = require("../controllers/account.controller.js");

// POST /api/accounts , to create the account 
router.post("/", authMiddleware.authMiddleware, createAccountController);

// GET /api/accounts/ - get all the accounts of the logged in user , its a protected route
router.get("/", authMiddleware.authMiddleware,getUserAccountController);

module.exports = router;
