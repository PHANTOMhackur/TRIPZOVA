const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        bookingNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        partner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            default: null
        },

        serviceType: {
            type: String,
            enum: ["tour", "ride"],
            required: true
        },

        serviceName: {
            type: String,
            required: true,
            trim: true
        },

        tripType: {
            type: String,
            enum: ["one_way", "round_trip"],
            default: "one_way"
        },

        pickup: {
            type: String,
            trim: true,
            default: ""
        },

        drop: {
            type: String,
            trim: true,
            default: ""
        },

        travelDate: {
            type: Date,
            required: true
        },

        returnDate: {
            type: Date,
            default: null
        },

        pickupTime: {
            type: String,
            trim: true,
            default: ""
        },

        flightNumber: {
            type: String,
            trim: true,
            default: ""
        },

        guests: {
            type: Number,
            default: 1,
            min: 1
        },

        distanceKm: {
            type: Number,
            min: 0,
            default: 0
        },

        amount: {
            type: Number,
            default: 0,
            min: 0
        },

        pricing: {
            pricePerKm: {
                type: Number,
                min: 0,
                default: 0
            },

            minimumKm: {
                type: Number,
                min: 0,
                default: 0
            },

            billableKm: {
                type: Number,
                min: 0,
                default: 0
            },

            driverAllowance: {
                type: Number,
                min: 0,
                default: 0
            },

            extraCharges: {
                type: Number,
                min: 0,
                default: 0
            }
        },

        paymentMethod: {
            type: String,
            default: "pending",
            trim: true
        },

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed",
                "refunded"
            ],
            default: "pending"
        },

        bookingStatus: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "rejected",
                "cancelled",
                "completed"
            ],
            default: "pending"
        },

        notes: {
            type: String,
            default: "",
            trim: true
        },

        rejectedReason: {
            type: String,
            default: "",
            trim: true
        },

        cancelledReason: {
            type: String,
            default: "",
            trim: true
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

bookingSchema.index({ customer: 1 });
bookingSchema.index({ partner: 1 });
bookingSchema.index({ vehicle: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ travelDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);