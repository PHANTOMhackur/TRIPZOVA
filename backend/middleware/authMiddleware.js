const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Authentication token missing."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId).select(
            "-password -resetPasswordToken -resetPasswordExpires"
        );

        if (!user) {
            return res.status(401).json({
                message: "User account not found."
            });
        }

        if (user.accountStatus === "suspended") {
            return res.status(403).json({
                message:
                    "Your account has been suspended. Please contact TRIPZOVA support."
            });
        }

        if (user.accountStatus === "blocked") {
            return res.status(403).json({
                message:
                    "Your account has been blocked. Please contact TRIPZOVA support."
            });
        }

        if (user.accountStatus !== "active") {
            return res.status(403).json({
                message: "Your account is not active."
            });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error("Authentication error:", error.message);

        return res.status(401).json({
            message: "Invalid or expired authentication token."
        });
    }
}

module.exports = authMiddleware;