const express = require("express");

const {
    loginUser,
    googleAuth,
    googleCallback,
    createGoogleAccount,
    verifyPhoneOTP,
    loginWithPhoneOTP
} = require("../controllers/authController");

const router = express.Router();


/* =========================================
   EMAIL / PASSWORD LOGIN
========================================= */

router.post(
    "/login",
    loginUser
);


/* =========================================
   PHONE OTP LOGIN
========================================= */

router.post(
    "/phone-login",
    loginWithPhoneOTP
);


/* =========================================
   PHONE OTP ACCESS TOKEN VERIFICATION
========================================= */

router.post(
    "/otp/verify",
    verifyPhoneOTP
);


/* =========================================
   GOOGLE LOGIN
========================================= */

router.get(
    "/google",
    googleAuth
);


/* =========================================
   GOOGLE CALLBACK
========================================= */

router.get(
    "/google/callback",
    googleCallback
);


/* =========================================
   CREATE GOOGLE ACCOUNT
========================================= */

router.post(
    "/google/create",
    createGoogleAccount
);


module.exports = router;