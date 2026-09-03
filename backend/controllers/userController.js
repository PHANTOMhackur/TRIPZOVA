const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { verifyMSG91AccessToken, getVerifiedPhoneFromMSG91 } = require("./authController");


/* =====================================================
   CREATE JWT
===================================================== */

const createToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};


/* =====================================================
   FORMAT USER
===================================================== */

const formatUser = (user) => {
    return {
        id: user._id,

        firstName: user.firstName,

        lastName: user.lastName,

        email: user.email,

        phone: user.phone || null,

        phoneVerified:
            user.phoneVerified || false,

        city: user.city || null,

        address: user.address || null,

        role: user.role,

        partnerStatus:
            user.partnerStatus || "not_applicable",

        authProvider:
            user.authProvider || "local"
    };
};


/* =====================================================
   NORMALIZE INDIAN PHONE
=====================================================

   Accepted:

   9876543210
   919876543210
   +919876543210
   +91 9876543210

   Stored as:

   919876543210

===================================================== */

const normalizeIndianPhone = (phone) => {

    if (!phone) {
        return "";
    }

    let value = String(phone)
        .trim()
        .replace(/\s+/g, "")
        .replace(/-/g, "")
        .replace(/\(/g, "")
        .replace(/\)/g, "");


    /* Remove + */

    if (value.startsWith("+")) {
        value = value.substring(1);
    }


    /* 10 digit */

    if (/^[6-9]\d{9}$/.test(value)) {
        return "91" + value;
    }


    /* 91 + 10 digit */

    if (/^91[6-9]\d{9}$/.test(value)) {
        return value;
    }


    return "";
};


/* =====================================================
   REGISTER USER
   PHONE OTP REQUIRED
===================================================== */

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
            role,
            msg91AccessToken
        } = req.body;


        /* =========================================
           BASIC VALIDATION
        ========================================= */

        if (
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !phone
        ) {

            return res.status(400).json({
                message:
                    "First name, last name, email, password and phone number are required."
            });

        }


        /* =========================================
           CLEAN BASIC DATA
        ========================================= */

        const cleanFirstName =
            String(firstName).trim();

        const cleanLastName =
            String(lastName).trim();

        const cleanEmail =
            String(email)
                .trim()
                .toLowerCase();


        /* =========================================
           VALIDATE NAME
        ========================================= */

        if (
            cleanFirstName.length < 2 ||
            cleanLastName.length < 2
        ) {

            return res.status(400).json({
                message:
                    "Please enter a valid first and last name."
            });

        }


        /* =========================================
           VALIDATE EMAIL
        ========================================= */

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {

            return res.status(400).json({
                message:
                    "Please enter a valid email address."
            });

        }


        /* =========================================
           VALIDATE PASSWORD
        ========================================= */

        if (String(password).length < 6) {

            return res.status(400).json({
                message:
                    "Password must be at least 6 characters."
            });

        }


        /* =========================================
           NORMALIZE PHONE
        ========================================= */

        const cleanPhone =
            normalizeIndianPhone(phone);


        if (!cleanPhone) {

            return res.status(400).json({
                message:
                    "Please enter a valid Indian mobile number."
            });

        }


        console.log(
            "Registration phone:",
            cleanPhone
        );


        /* =========================================
           MSG91 ACCESS TOKEN REQUIRED
        ========================================= */

        if (!msg91AccessToken) {

            return res.status(400).json({
                message:
                    "Phone verification token is missing. Please verify your phone number again."
            });

        }


        /* =========================================
           VERIFY MSG91 ACCESS TOKEN
        ========================================= */

        let msg91Data;

        try {

            msg91Data =
                await verifyMSG91AccessToken(
                    msg91AccessToken
                );

            console.log(
                    "FULL MSG91 DATA:",
                    JSON.stringify(msg91Data, null, 2)
                );

        }

        catch (error) {

            console.error(
                "MSG91 registration verification error:",
                error.message
            );

            /* =====================================
               TEMP DEBUG:
               Include the real MSG91 failure reason
               in the response while you diagnose this.
               REMOVE the debug field before going live
               (don't leak provider errors to users).
            ===================================== */

            return res.status(401).json({
                message:
                    "Phone verification failed. Please verify your phone number again.",
                debug:
                    error.message
            });

        }


        /* =========================================
           GET VERIFIED PHONE FROM MSG91
        ========================================= */

        let verifiedPhone =
            getVerifiedPhoneFromMSG91(msg91Data);


        if (!verifiedPhone) {

            console.error(
                "MSG91 response did not contain phone:",
                msg91Data
            );

            return res.status(401).json({
                message:
                    "Unable to confirm your verified phone number."
            });

        }


        /* =========================================
           NORMALIZE VERIFIED MSG91 PHONE
           (getVerifiedPhoneFromMSG91 already
           normalizes, but re-normalize defensively
           to keep the format consistent with
           cleanPhone below)
        ========================================= */

        verifiedPhone =
            normalizeIndianPhone(
                verifiedPhone
            );


        if (!verifiedPhone) {

            return res.status(401).json({
                message:
                    "The phone number returned by MSG91 is invalid."
            });

        }


        console.log(
            "Submitted phone:",
            cleanPhone
        );

        console.log(
            "MSG91 verified phone:",
            verifiedPhone
        );


        /* =========================================
           MAKE SURE SAME PHONE WAS VERIFIED
        ========================================= */

        if (cleanPhone !== verifiedPhone) {

            return res.status(401).json({
                message:
                    "The verified phone number does not match the phone number used for registration."
            });

        }


        /* =========================================
           ROLE
        ========================================= */

        let requestedRole = "customer";


        if (role === "traveller") {

            requestedRole = "traveller";

        }

        else if (role === "partner") {

            requestedRole = "partner";

        }


        /* =========================================
           PARTNER VALIDATION
        ========================================= */

        let cleanCity = "";
        let cleanAddress = "";


        if (requestedRole === "partner") {

            if (
                !city ||
                !String(city).trim() ||
                !address ||
                !String(address).trim()
            ) {

                return res.status(400).json({
                    message:
                        "City and address are required for partner registration."
                });

            }


            cleanCity =
                String(city).trim();

            cleanAddress =
                String(address).trim();

        }


        /* =========================================
           CHECK EMAIL
        ========================================= */

        const existingEmail =
            await User.findOne({
                email: cleanEmail
            });


        if (existingEmail) {

            return res.status(409).json({
                message:
                    "Email is already registered."
            });

        }


        /* =========================================
           CHECK PHONE
        ========================================= */

        const existingPhone =
            await User.findOne({
                phone: verifiedPhone
            });


        if (existingPhone) {

            return res.status(409).json({
                message:
                    "This phone number is already registered."
            });

        }


        /* =========================================
           HASH PASSWORD
        ========================================= */

        const hashedPassword =
            await bcrypt.hash(
                String(password),
                10
            );


        /* =========================================
           CREATE USER DATA
        ========================================= */

        const userData = {

            firstName:
                cleanFirstName,

            lastName:
                cleanLastName,

            email:
                cleanEmail,

            password:
                hashedPassword,

            /* IMPORTANT:
               Store without +
               919876543210
            */

            phone:
                verifiedPhone,

            /* OTP verified */

            phoneVerified:
                true,

            authProvider:
                "local",

            role:
                requestedRole,

            accountStatus:
                "active",

            partnerStatus:
                requestedRole === "partner"
                    ? "pending"
                    : "not_applicable"
        };


        /* =========================================
           PARTNER INFORMATION
        ========================================= */

        if (
            requestedRole === "partner"
        ) {

            userData.city =
                cleanCity;

            userData.address =
                cleanAddress;

        }


        /* =========================================
           CREATE DATABASE USER
        ========================================= */

        const user =
            await User.create(
                userData
            );


        console.log(
            "TRIPZOVA user created:",
            user.email
        );


        /* =========================================
           CREATE JWT
        ========================================= */

        const token =
            createToken(user);


        /* =========================================
           RESPONSE
        ========================================= */

        return res.status(201).json({

            message:
                requestedRole === "partner"
                    ? "Partner application submitted successfully. Your application is now under review."
                    : "Account created successfully.",

            token,

            user:
                formatUser(user)

        });

    }

    catch (error) {

        console.error(
            "Registration error:",
            error
        );


        /* =========================================
           DUPLICATE KEY
        ========================================= */

        if (
            error.code === 11000
        ) {

            const duplicateField =
                Object.keys(
                    error.keyPattern || {}
                );


            if (
                duplicateField.includes(
                    "email"
                )
            ) {

                return res.status(409).json({
                    message:
                        "Email is already registered."
                });

            }


            if (
                duplicateField.includes(
                    "phone"
                )
            ) {

                return res.status(409).json({
                    message:
                        "This phone number is already registered."
                });

            }


            return res.status(409).json({
                message:
                    "An account with this information already exists."
            });

        }


        /* =========================================
           SERVER ERROR
        ========================================= */

        return res.status(500).json({
            message:
                "Server error. Please try again."
        });

    }

};


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

    registerUser

};