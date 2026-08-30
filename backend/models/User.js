const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
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

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["customer", "traveller", "admin"],
            default: "customer"
        },

        accountStatus: {
            type: String,
            enum: ["active", "suspended", "blocked"],
            default: "active"
        },

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