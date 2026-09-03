const Booking = require("../models/Booking");
const User = require("../models/User");


// =====================================================
// CREATE BOOKING
// Customer creates a booking request
// =====================================================

async function createBooking(req, res) {
    try {
        const {
            partner,
            serviceType,
            serviceName,
            travelDate,
            guests,
            amount,
            paymentMethod,
            notes
        } = req.body;

        if (
            !serviceType ||
            !serviceName ||
            !travelDate
        ) {
            return res.status(400).json({
                message:
                    "Service type, service name and travel date are required."
            });
        }

        if (!["tour", "ride"].includes(serviceType)) {
            return res.status(400).json({
                message: "Invalid service type."
            });
        }

        if (guests !== undefined && Number(guests) < 1) {
            return res.status(400).json({
                message: "Guests must be at least 1."
            });
        }

        // If partner is supplied, make sure it is an approved partner
        let partnerUser = null;

        if (partner) {
            partnerUser = await User.findOne({
                _id: partner,
                role: "partner",
                partnerStatus: "approved",
                accountStatus: "active"
            });

            if (!partnerUser) {
                return res.status(400).json({
                    message: "Selected partner is not available."
                });
            }
        }

        // Generate booking number
        const bookingNumber =
            "TZ-" +
            Date.now().toString().slice(-8) +
            Math.floor(100 + Math.random() * 900);

        const booking = await Booking.create({
            bookingNumber,
            customer: req.user._id,
            partner: partner || null,
            serviceType,
            serviceName,
            travelDate,
            guests: guests || 1,
            amount: amount || 0,
            paymentMethod: paymentMethod || "pending",
            notes: notes || "",
            bookingStatus: "pending",
            paymentStatus: "pending"
        });

        const populatedBooking = await Booking.findById(
            booking._id
        )
            .populate(
                "customer",
                "firstName lastName email phone"
            )
            .populate(
                "partner",
                "firstName lastName email phone city partnerStatus"
            );

        return res.status(201).json({
            message: "Booking request created successfully.",
            booking: populatedBooking
        });

    } catch (error) {
        console.error("Create booking error:", error);

        return res.status(500).json({
            message: "Failed to create booking."
        });
    }
}


// =====================================================
// CUSTOMER BOOKINGS
// =====================================================

async function getMyBookings(req, res) {
    try {
        const bookings = await Booking.find({
            customer: req.user._id
        })
            .populate(
                "partner",
                "firstName lastName email phone city"
            )
            .sort({ createdAt: -1 });

        return res.json({
            bookings
        });

    } catch (error) {
        console.error("Get customer bookings error:", error);

        return res.status(500).json({
            message: "Failed to load bookings."
        });
    }
}


// =====================================================
// PARTNER BOOKINGS
// =====================================================

async function getPartnerBookings(req, res) {
    try {
        if (req.user.role !== "partner") {
            return res.status(403).json({
                message: "Only partners can access partner bookings."
            });
        }

        const bookings = await Booking.find({
            partner: req.user._id
        })
            .populate(
                "customer",
                "firstName lastName email phone city"
            )
            .sort({ createdAt: -1 });

        return res.json({
            bookings
        });

    } catch (error) {
        console.error("Get partner bookings error:", error);

        return res.status(500).json({
            message: "Failed to load partner bookings."
        });
    }
}


// =====================================================
// SINGLE BOOKING
// =====================================================

async function getBookingById(req, res) {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate(
                "customer",
                "firstName lastName email phone city"
            )
            .populate(
                "partner",
                "firstName lastName email phone city partnerStatus"
            );

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        const isCustomer =
            booking.customer &&
            booking.customer._id.toString() ===
                req.user._id.toString();

        const isPartner =
            booking.partner &&
            booking.partner._id.toString() ===
                req.user._id.toString();

        const isAdmin = req.user.role === "admin";

        if (!isCustomer && !isPartner && !isAdmin) {
            return res.status(403).json({
                message: "You are not allowed to view this booking."
            });
        }

        return res.json({
            booking
        });

    } catch (error) {
        console.error("Get booking error:", error);

        return res.status(500).json({
            message: "Failed to load booking."
        });
    }
}


// =====================================================
// PARTNER ACCEPTS BOOKING
// =====================================================

async function acceptBooking(req, res) {
    try {
        if (req.user.role !== "partner") {
            return res.status(403).json({
                message: "Only partners can accept bookings."
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            partner: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        if (booking.bookingStatus !== "pending") {
            return res.status(400).json({
                message:
                    "Only pending bookings can be accepted."
            });
        }

        booking.bookingStatus = "confirmed";

        await booking.save();

        return res.json({
            message: "Booking accepted successfully.",
            booking
        });

    } catch (error) {
        console.error("Accept booking error:", error);

        return res.status(500).json({
            message: "Failed to accept booking."
        });
    }
}


// =====================================================
// PARTNER REJECTS BOOKING
// =====================================================

async function rejectBooking(req, res) {
    try {
        if (req.user.role !== "partner") {
            return res.status(403).json({
                message: "Only partners can reject bookings."
            });
        }

        const { reason } = req.body;

        const booking = await Booking.findOne({
            _id: req.params.id,
            partner: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        if (booking.bookingStatus !== "pending") {
            return res.status(400).json({
                message:
                    "Only pending bookings can be rejected."
            });
        }

        booking.bookingStatus = "rejected";
        booking.rejectedReason = reason || "";

        await booking.save();

        return res.json({
            message: "Booking rejected.",
            booking
        });

    } catch (error) {
        console.error("Reject booking error:", error);

        return res.status(500).json({
            message: "Failed to reject booking."
        });
    }
}


// =====================================================
// CUSTOMER CANCELS BOOKING
// =====================================================

async function cancelBooking(req, res) {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            customer: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        if (
            !["pending", "confirmed"].includes(
                booking.bookingStatus
            )
        ) {
            return res.status(400).json({
                message:
                    "This booking cannot be cancelled."
            });
        }

        booking.bookingStatus = "cancelled";
        booking.cancelledReason =
            req.body.reason || "";

        await booking.save();

        return res.json({
            message: "Booking cancelled successfully.",
            booking
        });

    } catch (error) {
        console.error("Cancel booking error:", error);

        return res.status(500).json({
            message: "Failed to cancel booking."
        });
    }
}


// =====================================================
// PARTNER COMPLETES TRIP
// =====================================================

async function completeBooking(req, res) {
    try {
        if (req.user.role !== "partner") {
            return res.status(403).json({
                message: "Only partners can complete trips."
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            partner: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        if (booking.bookingStatus !== "confirmed") {
            return res.status(400).json({
                message:
                    "Only confirmed bookings can be completed."
            });
        }

        booking.bookingStatus = "completed";
        booking.completedAt = new Date();

        await booking.save();

        return res.json({
            message: "Trip completed successfully.",
            booking
        });

    } catch (error) {
        console.error("Complete booking error:", error);

        return res.status(500).json({
            message: "Failed to complete trip."
        });
    }
}


module.exports = {
    createBooking,
    getMyBookings,
    getPartnerBookings,
    getBookingById,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    completeBooking
};