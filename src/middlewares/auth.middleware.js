const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model.js");

async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Access denied. No token provided",
                status: "failed"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: "Invalid token. User not found",
                status: "failed"
            });
        }

        req.user = user;
        next();

    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid token",
                status: "failed"
            });
        }

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired",
                status: "failed"
            });
        }

        return res.status(500).json({
            message: "Internal server error",
            status: "failed",
            error: error.message
        });
    }
}

/**
 * Ensures the authenticated user is the internal system/reserve user.
 * Must run AFTER authMiddleware (which populates req.user).
 * systemUser is select:false, so it is re-fetched explicitly here.
 */
async function authSystemUserMiddleware(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
                status: "failed"
            });
        }

        const user = await userModel
            .findById(req.user._id)
            .select("+systemUser");

        if (!user || !user.systemUser) {
            return res.status(403).json({
                message: "Access denied. System user only",
                status: "failed"
            });
        }

        next();

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            status: "failed",
            error: error.message
        });
    }
}

module.exports = { authMiddleware, authSystemUserMiddleware };
