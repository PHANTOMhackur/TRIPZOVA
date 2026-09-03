const mongoose = require("mongoose");

const partnerProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        profilePicture: {
            type: String,
            default: ""
        },

        businessName: {
            type: String,
            trim: true,
            default: ""
        },

        displayName: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ""
        },

        city: {
            type: String,
            trim: true,
            default: ""
        },

        address: {
            type: String,
            trim: true,
            default: ""
        },

        about: {
            type: String,
            trim: true,
            default: ""
        },

        experienceYears: {
            type: Number,
            min: 0,
            default: 0
        },

        languages: {
            type: [String],
            default: []
        },

        partnerType: {
            type: String,
            enum: ["individual", "business", "travel_agency"],
            default: "individual"
        },

        profileStatus: {
            type: String,
            enum: ["incomplete", "complete"],
            default: "incomplete"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "PartnerProfile",
    partnerProfileSchema
);