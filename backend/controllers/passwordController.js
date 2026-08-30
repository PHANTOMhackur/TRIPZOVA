const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase()
        });

        // Don't reveal whether the email exists
        if (!user) {
            return res.status(200).json({
                message:
                    "If an account exists for this email, a password reset link has been sent."
            });
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Store hashed token in database
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Token valid for 15 minutes
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires =
            new Date(Date.now() + 15 * 60 * 1000);

        await user.save();

        // Temporary development reset link
        const resetLink =
            `http://localhost:5000/reset-password.html?token=${resetToken}`;

        console.log("PASSWORD RESET LINK:");
        console.log(resetLink);

        return res.status(200).json({
            message:
                "If an account exists for this email, a password reset link has been sent."
        });

    } catch (error) {
        console.error("Forgot password error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                message: "Reset token and new password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        // Hash the token received from the reset link
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Find user with valid, non-expired token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: {
                $gt: new Date()
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Reset link is invalid or has expired"
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;

        // Invalidate reset token
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        res.status(200).json({
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error("Reset password error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    forgotPassword,
    resetPassword
};