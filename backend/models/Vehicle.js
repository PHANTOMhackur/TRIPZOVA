const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
    {
        partner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        vehiclePhotos: {
            type: [String],
            default: []
        },

        vehicleName: {
            type: String,
            required: true,
            trim: true
        },

        brand: {
            type: String,
            trim: true,
            default: ""
        },

        model: {
            type: String,
            trim: true,
            default: ""
        },

        vehicleNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        vehicleType: {
            type: String,
            enum: [
                "hatchback",
                "sedan",
                "suv",
                "muv",
                "tempo_traveller",
                "minibus",
                "bus",
                "other"
            ],
            required: true
        },

        seatCapacity: {
            type: Number,
            required: true,
            min: 1
        },

        airConditioning: {
            type: String,
            enum: ["ac", "non_ac"],
            default: "ac"
        },

        fuelType: {
            type: String,
            enum: [
                "petrol",
                "diesel",
                "cng",
                "electric",
                "hybrid",
                "other"
            ],
            required: true
        },

        pricePerKm: {
            type: Number,
            required: true,
            min: 0
        },

        minimumKm: {
            type: Number,
            default: 0,
            min: 0
        },

        driverIncluded: {
            type: Boolean,
            default: true
        },

        driverAllowance: {
            type: Number,
            default: 0,
            min: 0
        },

        extraCharges: {
            type: Number,
            default: 0,
            min: 0
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        vehicleStatus: {
            type: String,
            enum: ["active", "inactive", "pending", "rejected"],
            default: "pending"
        },

        adminApproval: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

vehicleSchema.index({
    partner: 1
});

vehicleSchema.index({
    vehicleNumber: 1
});

vehicleSchema.index({
    vehicleStatus: 1
});

module.exports = mongoose.model(
    "Vehicle",
    vehicleSchema
);