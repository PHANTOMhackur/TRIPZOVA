const express = require("express");

const {
    verifyPhoneOTP
} = require("../controllers/otpController");

const router = express.Router();


/* =========================================
   VERIFY MSG91 PHONE
========================================= */

router.post(
    "/verify",
    verifyPhoneOTP
);


module.exports = router;