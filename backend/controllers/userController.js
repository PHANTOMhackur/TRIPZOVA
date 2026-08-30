const bcrypt = require("bcryptjs");
const User = require("../models/User");

const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Check required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        // Check existing email
        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create customer
        const user = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "customer"
        });

        res.status(201).json({
            message: "Account created successfully",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Registration error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    registerUser
};