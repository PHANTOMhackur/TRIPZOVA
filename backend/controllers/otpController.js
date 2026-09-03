const {
    verifyMSG91AccessToken
} = require("./authController");


/* =========================================
   VERIFY PHONE OTP
========================================= */

const verifyPhoneOTP = async (req, res) => {

    try {

        const {
            accessToken
        } = req.body;


        /* =====================================
           REQUIRED
        ===================================== */

        if (!accessToken) {

            return res.status(400).json({

                success: false,

                message:
                    "MSG91 access token is required."

            });

        }


        /* =====================================
           VERIFY WITH MSG91
        ===================================== */

        const data =
            await verifyMSG91AccessToken(
                accessToken
            );


        /* =====================================
           SUCCESS
        ===================================== */

        return res.status(200).json({

            success: true,

            message:
                "Phone number verified successfully.",

            data

        });

    }

    catch (error) {

        console.error(
            "Phone OTP verification error:",
            error
        );


        return res.status(401).json({

            success: false,

            message:
                "Phone verification failed. Please try again."

        });

    }

};


module.exports = {
    verifyPhoneOTP
};