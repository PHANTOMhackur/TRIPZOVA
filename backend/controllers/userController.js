const bcrypt = require("bcryptjs");
const User = require("../models/User");

const registerUser = async (req, res) => {
    try {

        const {
            firstName,
            lastName,
            email,
            password,
            phone,
            city,
            address,
            role
        } = req.body;


        /* =========================================
           BASIC VALIDATION
        ========================================= */

        if (
            !firstName ||
            !lastName ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }


        /* =========================================
           VALIDATE ROLE
        ========================================= */

        const requestedRole =
            role === "partner"
                ? "partner"
                : "customer";


        /* =========================================
           PARTNER VALIDATION
        ========================================= */

        if (requestedRole === "partner") {

            if (
                !phone ||
                !city ||
                !address
            ) {
                return res.status(400).json({
                    message:
                        "Phone, city and address are required for partner registration"
                });
            }
        }


        /* =========================================
           CHECK EXISTING EMAIL
        ========================================= */

        const existingUser =
            await User.findOne({
                email: email.toLowerCase()
            });

        if (existingUser) {

            return res.status(409).json({
                message: "Email is already registered"
            });

        }


        /* =========================================
           HASH PASSWORD
        ========================================= */

        const hashedPassword =
            await bcrypt.hash(password, 10);


        /* =========================================
           CREATE USER
        ========================================= */

        const userData = {

            firstName:
                firstName.trim(),

            lastName:
                lastName.trim(),

            email:
                email.toLowerCase().trim(),

            password:
                hashedPassword,

            role:
                requestedRole
        };


        /* =========================================
           PARTNER DATA
        ========================================= */

        if (requestedRole === "partner") {

            userData.phone =
                phone.trim();

            userData.city =
                city.trim();

            userData.address =
                address.trim();

            userData.partnerStatus =
                "pending";

        }


        /* =========================================
           CREATE DATABASE RECORD
        ========================================= */

        const user =
            await User.create(userData);


        /* =========================================
           RESPONSE
        ========================================= */

        res.status(201).json({

            message:
                requestedRole === "partner"
                    ? "Partner application submitted successfully"
                    : "Account created successfully",

            user: {

                id: user._id,

                firstName:
                    user.firstName,

                lastName:
                    user.lastName,

                email:
                    user.email,

                phone:
                    user.phone || null,

                city:
                    user.city || null,

                address:
                    user.address || null,

                role:
                    user.role,

                partnerStatus:
                    user.partnerStatus

            }

        });

    }

    catch (error) {

        console.error(
            "Registration error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });

    }
};


module.exports = {
    registerUser
};