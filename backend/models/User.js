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

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            trim: true
        },

        city: {
            type: String,
            trim: true
        },

        address: {
            type: String,
            trim: true
        },

        password: {
            type: String,
            required: true
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

module.exports = mongoose.model("User", userSchema);