const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


/* =========================================
   NORMAL EMAIL/PASSWORD LOGIN
========================================= */

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }


        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });


        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        /* ACCOUNT STATUS */

        if (user.accountStatus !== "active") {

            return res.status(403).json({
                message: "Your account is not active."
            });

        }


        /* PARTNER STATUS */

        if (user.role === "partner") {

            if (user.partnerStatus === "pending") {

                return res.status(403).json({
                    message:
                        "Your partner application is still under review."
                });

            }


            if (user.partnerStatus === "rejected") {

                return res.status(403).json({
                    message:
                        "Your partner application was rejected."
                });

            }


            if (user.partnerStatus !== "approved") {

                return res.status(403).json({
                    message:
                        "Your partner account has not been approved yet."
                });

            }

        }


        /* PASSWORD */

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        /* JWT */

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );


        res.status(200).json({

            message: "Login successful",

            token,

            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone || null,
                city: user.city || null,
                address: user.address || null,
                role: user.role,
                partnerStatus:
                    user.partnerStatus || null
            }

        });

    }

    catch (error) {

        console.error(
            "Login error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });

    }

};


/* =========================================
   GOOGLE AUTH START
========================================= */

const passport = require("../config/passport");

const googleAuth = passport.authenticate(
    "google",
    {
        scope: [
            "profile",
            "email"
        ]
    }
);


/* =========================================
   GOOGLE CALLBACK
========================================= */

const googleCallback = (req, res, next) => {

    passport.authenticate(
        "google",
        async (error, user) => {

            try {

                if (error) {
                    console.error(
                        "Google authentication error:",
                        error.message
                    );

                    return res.redirect(
                        "/login.html?error=google_auth_failed"
                    );
                }


                if (!user) {

                    return res.redirect(
                        "/login.html?error=google_auth_failed"
                    );

                }


                /* =================================
                   NEW GOOGLE USER
                ================================= */

                if (user.isNewGoogleUser) {

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


                /* =================================
                   EXISTING USER
                ================================= */

                if (
                    user.accountStatus !==
                    "active"
                ) {

                    return res.redirect(
                        "/login.html?error=account_inactive"
                    );

                }


                /* =================================
                   PARTNER CHECK
                ================================= */

                if (
                    user.role === "partner"
                ) {

                    if (
                        user.partnerStatus !==
                        "approved"
                    ) {

                        return res.redirect(
                            `/login.html?error=partner_${user.partnerStatus}`
                        );

                    }

                }


                /* =================================
                   JWT
                ================================= */

                const token =
                    jwt.sign(
                        {
                            userId:
                                user._id,

                            role:
                                user.role
                        },

                        process.env.JWT_SECRET,

                        {
                            expiresIn:
                                "7d"
                        }
                    );


                /* =================================
                   USER DATA
                ================================= */

                const userData =
                    encodeURIComponent(
                        JSON.stringify({

                            id:
                                user._id,

                            firstName:
                                user.firstName,

                            lastName:
                                user.lastName,

                            email:
                                user.email,

                            phone:
                                user.phone ||
                                null,

                            city:
                                user.city ||
                                null,

                            address:
                                user.address ||
                                null,

                            role:
                                user.role,

                            partnerStatus:
                                user.partnerStatus ||
                                null

                        })
                    );


                /* =================================
                   REDIRECT
                ================================= */

                return res.redirect(
                    `/google-success.html?token=${encodeURIComponent(token)}&user=${userData}`
                );

            }

            catch (error) {

                console.error(
                    "Google callback error:",
                    error.message
                );

                return res.redirect(
                    "/login.html?error=google_auth_failed"
                );

            }

        }
    )(req, res, next);

};


module.exports = {
    loginUser,
    googleAuth,
    googleCallback
};