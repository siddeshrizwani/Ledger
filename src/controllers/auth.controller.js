// in this we will import the user model then we will create a user registration controller -- function 
// we will get data - email password in this controller for registering the user

const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const { sendRegistrationEmail } = require("../services/email.service.js");
/**
 * - user register controller
 * - POST /api/auth/register
 */
async function userRegisterController(req, res) {
    try {
        // for the below line to work we need to use a middleware in app.js so that we can enable to load data from req object
        const { email, password, name } = req.body;

        // Debug: log received data
        console.log("Received registration data:", { email, password: password ? '***' : undefined, name });

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({
                message: "All fields are required",
                status: "failed"
            });
        }

        // Trim email manually before validation
        const trimmedEmail = email.trim();

        // Check if user already exists
        const isExists = await userModel.findOne({ email: trimmedEmail });

        if (isExists) {
            return res.status(422).json({
                message: "User already exists with email.",
                status: "failed"
            });
        }

        // Create new user
        const newUser = await userModel.create({
            email: trimmedEmail,
            password,
            name
        });
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.cookie("token", token);

        sendRegistrationEmail(newUser.email, newUser.name).catch(err => {
            console.log("Failed to send email:", err.message);
        });

        //Status code 201 Created is used because it explicitly confirms that the request succeeded and resulted in the successful creation of a new resource (the user) on the server.
        // Return success response (without password)
        return res.status(201).json({
            message: "User registered successfully",
            status: "success",
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: "failed",
            error: error.message
        });
    }
}

/**
 * - user login controller
 * - POST /api/auth/login
 */
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
                status: "failed"
            });
        }

        // Find user with password field (since select: false in model)
        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
                status: "failed"
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password",
                status: "failed"
            });
        }

        // Return success response (without password)
        return res.status(200).json({
            message: "Login successful",
            status: "success",
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: "failed",
            error: error.message
        });
    }
}

module.exports = { 
    userRegisterController,
    userLoginController
};