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

module.exports = { createAccountController };
