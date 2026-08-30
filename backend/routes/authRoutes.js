const express = require("express");

const {
    loginUser,
    googleAuth,
    googleCallback
} = require("../controllers/authController");

const router = express.Router();


/* =========================================
   NORMAL LOGIN
========================================= */

router.post("/login", loginUser);


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


module.exports = router;