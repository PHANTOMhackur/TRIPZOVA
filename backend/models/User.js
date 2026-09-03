const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
    {

        /* =========================================
           BASIC USER INFORMATION
        ========================================= */

        firstName: {
            type: String,
            required: true,
            trim: true
        },

        lastName: {
            type: String,
            required: true,
            trim: true
        },


        /* =========================================
           EMAIL
        ========================================= */

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },


        /* =========================================
           GOOGLE
        ========================================= */

        googleId: {
            type: String,
            default: null
        },


        /* =========================================
           PHONE
        ========================================= */

        phone: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },

        phoneVerified: {
            type: Boolean,
            default: false
        },


        /* =========================================
           LOCATION
        ========================================= */

        city: {
            type: String,
            trim: true
        },

        address: {
            type: String,
            trim: true
        },


        /* =========================================
           PASSWORD
        ========================================= */

        password: {
            type: String,
            required: function () {
                return this.authProvider === "local";
            }
        },


        /* =========================================
           AUTH PROVIDER
        ========================================= */

        authProvider: {
            type: String,
            enum: [
                "local",
                "google"
            ],
            default: "local"
        },


        /* =========================================
           USER ROLE
        ========================================= */

        role: {
            type: String,
            enum: [
                "customer",
                "traveller",
                "partner",
                "admin"
            ],
            default: "customer"
        },


        /* =========================================
           PARTNER APPLICATION STATUS
        ========================================= */

        partnerStatus: {
            type: String,
            enum: [
                "not_applicable",
                "pending",
                "approved",
                "rejected"
            ],
            default: "not_applicable"
        },


        /* =========================================
           ACCOUNT STATUS
        ========================================= */

        accountStatus: {
            type: String,
            enum: [
                "active",
                "suspended",
                "blocked"
            ],
            default: "active"
        },


        /* =========================================
           PASSWORD RESET
        ========================================= */

        resetPasswordToken: {
            type: String,
            default: null
        },

        resetPasswordExpires: {
            type: Date,
            default: null
        }

    },

    {
        timestamps: true
    }
);


/* =========================================
   INDEXES
========================================= */


/*
 * Google ID
 *
 * Only Google users have a googleId.
 */
userSchema.index(
    { googleId: 1 },
    {
        unique: true,
        sparse: true
    }
);


module.exports = mongoose.model(
    "User",
    userSchema
);