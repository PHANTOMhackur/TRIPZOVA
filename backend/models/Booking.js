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

        travelDate: {
            type: Date,
            required: true
        },

        guests: {
            type: Number,
            default: 1,
            min: 1
        },

        amount: {
            type: Number,
            default: 0,
            min: 0
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

module.exports = mongoose.model("Booking", bookingSchema);