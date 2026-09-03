const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function adminMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authorization token required."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from .env");

            return res.status(500).json({
                message: "Server authentication configuration is missing."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.userId) {
            return res.status(401).json({
                message: "Invalid authentication token."
            });
        }

        const user = await User.findById(decoded.userId).select(
            "-password -resetPasswordToken -resetPasswordExpires"
        );

        if (!user) {
            return res.status(401).json({
                message: "Admin user not found."
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Admin access required."
            });
        }

        if (user.accountStatus !== "active") {
            return res.status(403).json({
                message: "Admin account is not active."
            });
        }

        req.admin = user;

        next();

    } catch (error) {
        console.error("Admin middleware error:", error.message);

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                message: "Invalid or expired authentication token."
            });
        }

        return res.status(500).json({
            message: "Admin authentication failed."
        });
    }
}

module.exports = adminMiddleware;