const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const passport = require("../config/passport");


/* =====================================================
   CREATE TRIPZOVA JWT
===================================================== */

const createToken = (user) => {

    if (!process.env.JWT_SECRET) {

        throw new Error(
            "JWT_SECRET is not configured"
        );

    }

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
   FORMAT USER RESPONSE
===================================================== */

const formatUser = (user) => {

    return {

        id: user._id,

        firstName:
            user.firstName,

        lastName:
            user.lastName,

        email:
            user.email,

        phone:
            user.phone || null,

        phoneVerified:
            user.phoneVerified || false,

        city:
            user.city || null,

        address:
            user.address || null,

        role:
            user.role,

        partnerStatus:
            user.partnerStatus ||
            "not_applicable",

        authProvider:
            user.authProvider ||
            "local"

    };

};


/* =====================================================
   NORMALIZE PHONE NUMBER
===================================================== */

/*
    Accepted:

    9876543210
    +919876543210
    919876543210
    +91 9876543210

    Stored / compared as:

    919876543210
*/

const normalizePhone = (phone) => {

    let value =
        String(phone || "")
            .trim()
            .replace(/\D/g, "");

    if (
        value.startsWith("91") &&
        value.length === 12
    ) {

        return value;

    }

    if (
        value.length === 10
    ) {

        return "91" + value;

    }

    return value;

};


/* =====================================================
   VALIDATE INDIAN PHONE
===================================================== */

const isValidIndianPhone = (phone) => {

    return /^91[6-9]\d{9}$/.test(
        phone
    );

};


/* =====================================================
   CHECK ACCOUNT STATUS
===================================================== */

const checkAccountStatus = (user) => {

    if (!user) {

        return {

            allowed: false,

            status: 404,

            message:
                "User not found."

        };

    }


    if (
        user.accountStatus !==
        "active"
    ) {

        return {

            allowed: false,

            status: 403,

            message:
                "Your account is not active."

        };

    }


    /*
       Partner accounts must be approved.
    */

    if (
        user.role === "partner"
    ) {

        if (
            user.partnerStatus ===
            "pending"
        ) {

            return {

                allowed: false,

                status: 403,

                message:
                    "Your partner application is still under review."

            };

        }


        if (
            user.partnerStatus ===
            "rejected"
        ) {

            return {

                allowed: false,

                status: 403,

                message:
                    "Your partner application was rejected."

            };

        }


        if (
            user.partnerStatus !==
            "approved"
        ) {

            return {

                allowed: false,

                status: 403,

                message:
                    "Your partner account has not been approved yet."

            };

        }

    }


    return {

        allowed: true

    };

};


/* =====================================================
   NORMAL EMAIL / PASSWORD LOGIN
===================================================== */

const loginUser = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        /* ---------------------------------------------
           REQUIRED
        --------------------------------------------- */

        if (
            !email ||
            !password ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {

            return res.status(400).json({

                message:
                    "Email and password are required."

            });

        }


        /* ---------------------------------------------
           FIND USER
        --------------------------------------------- */

        const user =
            await User.findOne({

                email:
                    email
                        .toLowerCase()
                        .trim()

            });


        if (!user) {

            return res.status(401).json({

                message:
                    "Invalid email or password."

            });

        }


        /* ---------------------------------------------
           ACCOUNT STATUS
        --------------------------------------------- */

        const accountCheck =
            checkAccountStatus(user);


        if (
            !accountCheck.allowed
        ) {

            return res.status(
                accountCheck.status
            ).json({

                message:
                    accountCheck.message

            });

        }


        /* ---------------------------------------------
           PASSWORD CHECK
        --------------------------------------------- */

        if (!user.password) {

            return res.status(400).json({

                message:
                    "This account does not use password login. Please continue with Google."

            });

        }


        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                message:
                    "Invalid email or password."

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


        /* ---------------------------------------------
           CREATE JWT
        --------------------------------------------- */

        const token =
            createToken(user);


        /* ---------------------------------------------
           RESPONSE
        --------------------------------------------- */

        return res.status(200).json({

            message:
                "Login successful.",

            token,

            user:
                formatUser(user)

        });

    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({

            message:
                "Server error."

        });

    }

};


/* =====================================================
   GOOGLE AUTH START
===================================================== */

const googleAuth =
    passport.authenticate(
        "google",
        {
            scope: [
                "profile",
                "email"
            ]
        }
    );


/* =====================================================
   GOOGLE CALLBACK
===================================================== */

const googleCallback =
    (req, res, next) => {

        passport.authenticate(
            "google",

            async (
                error,
                user
            ) => {

                try {

                    /* ---------------------------------
                       GOOGLE ERROR
                    --------------------------------- */

                    if (error) {

                        console.error(
                            "Google authentication error:",
                            error
                        );

                        return res.redirect(
                            "/login.html?error=google_auth_failed"
                        );

                    }


                    /* ---------------------------------
                       NO USER
                    --------------------------------- */

                    if (!user) {

                        return res.redirect(
                            "/login.html?error=google_auth_failed"
                        );

                    }


                    /* ---------------------------------
                       NEW GOOGLE USER
                    --------------------------------- */

                    if (
                        user.isNewGoogleUser
                    ) {

                        const googleUserData =
                            encodeURIComponent(

                                JSON.stringify({

                                    googleId:
                                        user.googleId,

                                    email:
                                        user.email,

                                    firstName:
                                        user.firstName,

                                    lastName:
                                        user.lastName

                                })

                            );


                        return res.redirect(

                            `/google-account-type.html?data=${googleUserData}`

                        );

                    }


                    /* ---------------------------------
                       ACCOUNT STATUS
                    --------------------------------- */

                    const accountCheck =
                        checkAccountStatus(user);


                    if (
                        !accountCheck.allowed
                    ) {

                        if (
                            user.role ===
                            "partner"
                        ) {

                            return res.redirect(

                                `/login.html?error=partner_${user.partnerStatus}`

                            );

                        }


                        return res.redirect(
                            "/login.html?error=account_inactive"
                        );

                    }


                    /* ---------------------------------
                       CREATE JWT
                    --------------------------------- */

                    const token =
                        createToken(user);


                    /* ---------------------------------
                       USER DATA
                    --------------------------------- */

                    const userData =
                        encodeURIComponent(

                            JSON.stringify(
                                formatUser(user)
                            )

                        );


                    /* ---------------------------------
                       SUCCESS
                    --------------------------------- */

                    return res.redirect(

                        `/google-success.html?token=${encodeURIComponent(token)}&user=${userData}`

                    );

                }

                catch (error) {

                    console.error(
                        "Google callback error:",
                        error
                    );

                    return res.redirect(
                        "/login.html?error=google_auth_failed"
                    );

                }

            }

        )(req, res, next);

    };


/* =====================================================
   VERIFY MSG91 ACCESS TOKEN
===================================================== */

/*
    MSG91 OTP Widget flow:

    Send OTP
         ↓
    Verify OTP
         ↓
    MSG91 access token
         ↓
    Backend verifies access token
         ↓
    Verified phone number

    IMPORTANT:

    MSG91 Authkey stays ONLY on the backend.
    Never put MSG91 Authkey in frontend JavaScript.
*/

const verifyMSG91AccessToken =
    async (accessToken) => {

        if (!accessToken) {

            throw new Error(
                "MSG91 access token is required"
            );

        }


        /* ---------------------------------------------
           LOAD MSG91 AUTHKEY
        --------------------------------------------- */

        const authKey =
            String(
                process.env.MSG91_AUTHKEY || ""
            ).trim();


        if (!authKey) {

            throw new Error(
                "MSG91_AUTHKEY is not configured"
            );

        }


        /* ---------------------------------------------
           CLEAN ACCESS TOKEN
        --------------------------------------------- */

        const cleanAccessToken =
            String(
                accessToken
            ).trim();


        if (!cleanAccessToken) {

            throw new Error(
                "MSG91 access token is empty"
            );

        }


        /* ---------------------------------------------
           LOGGING
        --------------------------------------------- */

        console.log(
            "MSG91 access-token verification started"
        );

        console.log(
            "MSG91 Authkey loaded:",
            authKey.length > 0
                ? "YES"
                : "NO"
        );

        console.log(
            "MSG91 Authkey length:",
            authKey.length
        );

        console.log(
            "MSG91 access token received:",
            cleanAccessToken.length > 0
                ? "YES"
                : "NO"
        );

        console.log(
            "MSG91 access token length:",
            cleanAccessToken.length
        );


        /* ---------------------------------------------
           REQUEST BODY
        --------------------------------------------- */

        const requestBody = {

            authkey:
                authKey,

            "access-token":
                cleanAccessToken

        };


        console.log(
            "MSG91 request format:",
            "application/json"
        );

        console.log(
            "MSG91 request fields:",
            "authkey=YES",
            "access-token=YES"
        );


        let response;


        /* ---------------------------------------------
           CALL MSG91
        --------------------------------------------- */

        try {

            response =
                await fetch(
                    "https://control.msg91.com/api/v5/widget/verifyAccessToken",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                requestBody
                            )

                    }
                );

        }

        catch (error) {

            console.error(
                "MSG91 access-token network error:",
                error
            );

            throw new Error(
                "Unable to connect to MSG91."
            );

        }


        /* ---------------------------------------------
           READ RESPONSE
        --------------------------------------------- */

        const responseText =
            await response.text();


        let data = null;


        /* ---------------------------------------------
           PARSE JSON
        --------------------------------------------- */

        try {

            data =
                JSON.parse(
                    responseText
                );

        }

        catch (error) {

            console.error(
                "MSG91 returned non-JSON response:"
            );

            console.error(
                responseText
            );

            throw new Error(
                "Invalid response received from MSG91."
            );

        }


        /* ---------------------------------------------
           LOG RESPONSE
        --------------------------------------------- */

        console.log(
            "MSG91 access token HTTP status:",
            response.status
        );

        console.log(
            "MSG91 access token response:",
            data
        );


        /* ---------------------------------------------
           DETECT FAILURE
        --------------------------------------------- */

        const authenticationFailed =
            data &&
            (

                data.type === "error" ||

                data.message ===
                    "AuthenticationFailure" ||

                data.success === false ||

                data.code === 201 ||

                data.code === "201" ||

                data.hasError === true ||

                data.status === "fail"

            );


        /* ---------------------------------------------
           REJECT FAILED VERIFICATION
        --------------------------------------------- */

        if (
            !response.ok ||
            !data ||
            authenticationFailed
        ) {

            console.error(
                "MSG91 access-token verification was rejected."
            );

            throw new Error(

                data?.message ||
                "MSG91 access token verification failed"

            );

        }


        /* ---------------------------------------------
           SUCCESS
        --------------------------------------------- */

        console.log(
            "MSG91 access-token verification successful."
        );


        return data;

    };


/* =====================================================
   GET PHONE FROM MSG91 RESPONSE
===================================================== */

/*
    IMPORTANT FIX

    Your actual MSG91 response is:

    {
        message: "919879065786",
        type: "success"
    }

    Therefore "message" must also be checked.

    Previously the function only checked:

    identifier
    mobile
    phone
    mobileNumber
    phoneNumber

    So MSG91 verification succeeded but TRIPZOVA
    could not find the verified phone.

    This function now handles the actual response.
*/

const getVerifiedPhoneFromMSG91 =
    (msg91Data) => {

        if (!msg91Data) {

            return "";

        }


        let identifier = null;


        /* ---------------------------------------------
           NESTED DATA
        --------------------------------------------- */

        if (
            msg91Data.data &&
            typeof msg91Data.data ===
                "object"
        ) {

            identifier =

                msg91Data.data.identifier ||

                msg91Data.data.mobile ||

                msg91Data.data.phone ||

                msg91Data.data.mobileNumber ||

                msg91Data.data.phoneNumber ||

                null;

        }


        /* ---------------------------------------------
           DIRECT STRUCTURE
        --------------------------------------------- */

        if (!identifier) {

            identifier =

                msg91Data.identifier ||

                msg91Data.mobile ||

                msg91Data.phone ||

                msg91Data.mobileNumber ||

                msg91Data.phoneNumber ||

                null;

        }


        /* ---------------------------------------------
           USER STRUCTURE
        --------------------------------------------- */

        if (
            !identifier &&
            msg91Data.user &&
            typeof msg91Data.user ===
                "object"
        ) {

            identifier =

                msg91Data.user.identifier ||

                msg91Data.user.mobile ||

                msg91Data.user.phone ||

                msg91Data.user.mobileNumber ||

                msg91Data.user.phoneNumber ||

                null;

        }


        /* ---------------------------------------------
           MSG91 ACTUAL RESPONSE
        --------------------------------------------- */

        if (
            !identifier &&
            typeof msg91Data.message ===
                "string"
        ) {

            const messageValue =
                msg91Data.message.trim();


            /*
               Your MSG91 response:

               {
                   message: "919879065786",
                   type: "success"
               }

               If message itself is a valid phone
               number, use it.
            */

            const normalizedMessage =
                normalizePhone(
                    messageValue
                );


            if (
                isValidIndianPhone(
                    normalizedMessage
                )
            ) {

                identifier =
                    normalizedMessage;

            }

        }


        /* ---------------------------------------------
           NOTHING FOUND
        --------------------------------------------- */

        if (!identifier) {

            console.error(
                "MSG91 response did not contain phone:",
                msg91Data
            );

            return "";

        }


        /* ---------------------------------------------
           NORMALIZE
        --------------------------------------------- */

        const normalizedPhone =
            normalizePhone(
                identifier
            );


        /* ---------------------------------------------
           FINAL VALIDATION
        --------------------------------------------- */

        if (
            !isValidIndianPhone(
                normalizedPhone
            )
        ) {

            console.error(
                "MSG91 returned invalid phone:",
                identifier
            );

            return "";

        }


        console.log(
            "MSG91 verified phone:",
            normalizedPhone
        );


        return normalizedPhone;

    };


/* =====================================================
   VERIFY PHONE OTP
===================================================== */

/*
    POST:

    /api/auth/otp/verify

    Body:

    {
        accessToken: "MSG91_ACCESS_TOKEN"
    }

    This endpoint verifies the MSG91 token.
    It does NOT create a TRIPZOVA account.
*/

const verifyPhoneOTP =
    async (req, res) => {

        try {

            const {
                accessToken
            } = req.body;


            /* -----------------------------------------
               REQUIRED
            ----------------------------------------- */

            if (!accessToken) {

                return res.status(400).json({

                    message:
                        "MSG91 access token is required."

                });

            }


            /* -----------------------------------------
               VERIFY MSG91
            ----------------------------------------- */

            let msg91Data;


            try {

                msg91Data =
                    await verifyMSG91AccessToken(
                        accessToken
                    );

            }

            catch (error) {

                console.error(
                    "MSG91 OTP verification error:",
                    error.message
                );

                return res.status(401).json({

                    message:
                        "Phone verification failed. Please verify the OTP again."

                });

            }


            /* -----------------------------------------
               GET VERIFIED PHONE
            ----------------------------------------- */

            const verifiedPhone =
                getVerifiedPhoneFromMSG91(
                    msg91Data
                );


            /* -----------------------------------------
               RESPONSE
            ----------------------------------------- */

            return res.status(200).json({

                success:
                    true,

                message:
                    "Phone number verified successfully.",

                phone:
                    verifiedPhone || null

            });

        }

        catch (error) {

            console.error(
                "Phone OTP verification error:",
                error
            );

            return res.status(500).json({

                message:
                    "Phone verification server error."

            });

        }

    };


/* =====================================================
   LOGIN WITH PHONE OTP
===================================================== */

const loginWithPhoneOTP =
    async (req, res) => {

        try {

            const {
                phone,
                msg91AccessToken
            } = req.body;


            /* -----------------------------------------
               REQUIRED
            ----------------------------------------- */

            if (
                !phone ||
                !msg91AccessToken
            ) {

                return res.status(400).json({

                    message:
                        "Phone number and OTP verification are required."

                });

            }


            /* -----------------------------------------
               NORMALIZE PHONE
            ----------------------------------------- */

            const normalizedPhone =
                normalizePhone(phone);


            /* -----------------------------------------
               VALIDATE PHONE
            ----------------------------------------- */

            if (
                !isValidIndianPhone(
                    normalizedPhone
                )
            ) {

                return res.status(400).json({

                    message:
                        "Please enter a valid Indian mobile number."

                });

            }


            /* -----------------------------------------
               VERIFY MSG91 TOKEN
            ----------------------------------------- */

            let msg91Data;


            try {

                msg91Data =
                    await verifyMSG91AccessToken(
                        msg91AccessToken
                    );

            }

            catch (error) {

                console.error(
                    "MSG91 phone login verification error:",
                    error.message
                );

                return res.status(401).json({

                    message:
                        "Phone verification failed. Please verify the OTP again."

                });

            }


            /* -----------------------------------------
               GET VERIFIED PHONE
            ----------------------------------------- */

            const verifiedPhone =
                getVerifiedPhoneFromMSG91(
                    msg91Data
                );


            if (!verifiedPhone) {

                return res.status(401).json({

                    message:
                        "Unable to confirm the verified phone number."

                });

            }


            /* -----------------------------------------
               PHONE MATCH
            ----------------------------------------- */

            if (
                verifiedPhone !==
                normalizedPhone
            ) {

                return res.status(401).json({

                    message:
                        "The verified phone number does not match the login number."

                });

            }


            /* -----------------------------------------
               FIND USER
            ----------------------------------------- */

            const user =
                await User.findOne({

                    phone:
                        normalizedPhone

                });


            /* -----------------------------------------
               ACCOUNT NOT FOUND
            ----------------------------------------- */

            if (!user) {

                return res.status(404).json({

                    message:
                        "No TRIPZOVA account was found with this mobile number. Please create an account first."

                });

            }


            /* -----------------------------------------
               PHONE VERIFIED
            ----------------------------------------- */

            if (
                user.phoneVerified !== true
            ) {

                return res.status(403).json({

                    message:
                        "This mobile number is not verified on your TRIPZOVA account."

                });

            }


            /* -----------------------------------------
               ACCOUNT STATUS
            ----------------------------------------- */

            const accountCheck =
                checkAccountStatus(user);


            if (
                !accountCheck.allowed
            ) {

                return res.status(
                    accountCheck.status
                ).json({

                    message:
                        accountCheck.message

                });

            }


            /* -----------------------------------------
               CREATE JWT
            ----------------------------------------- */

            const token =
                createToken(user);


            /* -----------------------------------------
               RESPONSE
            ----------------------------------------- */

            return res.status(200).json({

                message:
                    "Login successful.",

                token,

                user:
                    formatUser(user)

            });

        }

        catch (error) {

            console.error(
                "Phone OTP login error:",
                error
            );

            return res.status(500).json({

                message:
                    "Server error."

            });

        }

    };


/* =====================================================
   CREATE GOOGLE ACCOUNT
===================================================== */

const createGoogleAccount =
    async (req, res) => {

        try {

            const {

                googleId,

                email,

                firstName,

                lastName,

                phone,

                city,

                address,

                role,

                msg91AccessToken

            } = req.body;


            /* -----------------------------------------
               REQUIRED
            ----------------------------------------- */

            if (
                !googleId ||
                !email ||
                !firstName ||
                !lastName ||
                !phone ||
                !role ||
                !msg91AccessToken
            ) {

                return res.status(400).json({

                    message:
                        "Please complete all required information and verify your phone number."

                });

            }


            /* -----------------------------------------
               ROLE
            ----------------------------------------- */

            if (
                role !== "traveller" &&
                role !== "partner"
            ) {

                return res.status(400).json({

                    message:
                        "Invalid account type."

                });

            }


            /* -----------------------------------------
               PARTNER REQUIRED DATA
            ----------------------------------------- */

            if (
                role === "partner" &&
                (
                    !city ||
                    !address
                )
            ) {

                return res.status(400).json({

                    message:
                        "Phone, city and address are required for partner registration."

                });

            }


            /* -----------------------------------------
               NORMALIZE PHONE
            ----------------------------------------- */

            const normalizedPhone =
                normalizePhone(phone);


            if (
                !isValidIndianPhone(
                    normalizedPhone
                )
            ) {

                return res.status(400).json({

                    message:
                        "Please enter a valid Indian mobile number."

                });

            }


            /* -----------------------------------------
               VERIFY MSG91
            ----------------------------------------- */

            let msg91Data;


            try {

                msg91Data =
                    await verifyMSG91AccessToken(
                        msg91AccessToken
                    );

            }

            catch (error) {

                console.error(
                    "Google phone verification failed:",
                    error.message
                );

                return res.status(401).json({

                    message:
                        "Phone verification failed. Please verify your phone again."

                });

            }


            /* -----------------------------------------
               GET VERIFIED PHONE
            ----------------------------------------- */

            const verifiedPhone =
                getVerifiedPhoneFromMSG91(
                    msg91Data
                );


            if (!verifiedPhone) {

                return res.status(401).json({

                    message:
                        "Unable to confirm the verified phone number."

                });

            }


            /* -----------------------------------------
               PHONE MATCH
            ----------------------------------------- */

            if (
                verifiedPhone !==
                normalizedPhone
            ) {

                return res.status(401).json({

                    message:
                        "The verified phone number does not match the phone number entered."

                });

            }


            /* -----------------------------------------
               CHECK EMAIL
            ----------------------------------------- */

            const cleanEmail =
                email
                    .toLowerCase()
                    .trim();


            const existingUser =
                await User.findOne({

                    email:
                        cleanEmail

                });


            if (existingUser) {

                return res.status(409).json({

                    message:
                        "Email is already registered."

                });

            }


            /* -----------------------------------------
               CHECK PHONE
            ----------------------------------------- */

            const existingPhone =
                await User.findOne({

                    phone:
                        verifiedPhone

                });


            if (existingPhone) {

                return res.status(409).json({

                    message:
                        "This phone number is already registered."

                });

            }


            /* -----------------------------------------
               CREATE GOOGLE USER
            ----------------------------------------- */

            const user =
                await User.create({

                    firstName:
                        firstName.trim(),

                    lastName:
                        lastName.trim(),

                    email:
                        cleanEmail,

                    googleId:
                        googleId,

                    phone:
                        verifiedPhone,

                    phoneVerified:
                        true,

                    city:
                        city
                            ? city.trim()
                            : "",

                    address:
                        address
                            ? address.trim()
                            : "",

                    authProvider:
                        "google",

                    role:
                        role,

                    partnerStatus:
                        role === "partner"
                            ? "pending"
                            : "not_applicable",

                    accountStatus:
                        "active"

                });


            /* -----------------------------------------
               JWT
            ----------------------------------------- */

            const token =
                createToken(user);


            /* -----------------------------------------
               RESPONSE
            ----------------------------------------- */

            return res.status(201).json({

                message:

                    role === "partner"

                        ? "Partner application submitted successfully."

                        : "Traveller account created successfully.",

                token,

                user:
                    formatUser(user)

            });

        }

        catch (error) {

            console.error(
                "Google account creation error:",
                error
            );


            /* -----------------------------------------
               DUPLICATE MONGODB
            ----------------------------------------- */

            if (
                error.code === 11000
            ) {

                if (
                    error.keyPattern &&
                    error.keyPattern.email
                ) {

                    return res.status(409).json({

                        message:
                            "Email is already registered."

                    });

                }


                if (
                    error.keyPattern &&
                    error.keyPattern.phone
                ) {

                    return res.status(409).json({

                        message:
                            "This phone number is already registered."

                    });

                }

            }


            return res.status(500).json({

                message:
                    "Server error."

            });

        }

    };


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

    loginUser,

    googleAuth,

    googleCallback,

    createGoogleAccount,

    verifyMSG91AccessToken,

    getVerifiedPhoneFromMSG91,

    verifyPhoneOTP,

    loginWithPhoneOTP

};