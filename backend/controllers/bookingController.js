const Booking = require("../models/Booking");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");

// CREATE BOOKING
async function createBooking(req, res) {
    try {
        const {
            vehicle,
            partner,
            serviceType,
            serviceName,
            tripType,
            pickup,
            drop,
            travelDate,
            returnDate,
            pickupTime,
            flightNumber,
            guests,
            distanceKm,
            notes
        } = req.body;

        // BASIC VALIDATION
        if (!serviceType || !serviceName || !travelDate) {
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

        if (serviceType === "ride") {
            if (!vehicle) {
                return res.status(400).json({
                    message: "Vehicle is required for a ride booking."
                });
            }

            if (!pickup || !drop) {
                return res.status(400).json({
                    message: "Pickup and drop locations are required."
                });
            }

            if (!pickupTime) {
                return res.status(400).json({
                    message: "Pickup time is required."
                });
            }
        }

        const guestCount = Number(guests || 1);

        if (!Number.isInteger(guestCount) || guestCount < 1) {
            return res.status(400).json({
                message: "Guests must be at least 1."
            });
        }

        if (!["one_way", "round_trip"].includes(tripType || "one_way")) {
            return res.status(400).json({
                message: "Invalid trip type."
            });
        }

        if (
            (tripType || "one_way") === "round_trip" &&
            !returnDate
        ) {
            return res.status(400).json({
                message: "Return date is required for round trip."
            });
        }

        let selectedVehicle = null;
        let selectedPartner = null;

        // VEHICLE BOOKING
        if (serviceType === "ride") {
            selectedVehicle = await Vehicle.findOne({
                _id: vehicle,
                vehicleStatus: "active",
                adminApproval: "approved"
            });

            if (!selectedVehicle) {
                return res.status(400).json({
                    message:
                        "Selected vehicle is no longer available."
                });
            }

            // CHECK SEATING CAPACITY
            if (guestCount > selectedVehicle.seatCapacity) {
                return res.status(400).json({
                    message:
                        `This vehicle can carry a maximum of ${selectedVehicle.seatCapacity} passengers.`
                });
            }

            // VEHICLE PARTNER
            selectedPartner = await User.findOne({
                _id: selectedVehicle.partner,
                role: "partner",
                partnerStatus: "approved",
                accountStatus: "active"
            });

            if (!selectedPartner) {
                return res.status(400).json({
                    message:
                        "The partner for this vehicle is currently unavailable."
                });
            }

            // IF FRONTEND SENT PARTNER, MAKE SURE IT MATCHES
            if (
                partner &&
                partner.toString() !== selectedPartner._id.toString()
            ) {
                return res.status(400).json({
                    message:
                        "Selected vehicle and partner do not match."
                });
            }
        }

        // DISTANCE
        let routeDistanceKm = Number(distanceKm || 0);

        if (!Number.isFinite(routeDistanceKm) || routeDistanceKm < 0) {
            routeDistanceKm = 0;
        }

        // PRICING
        let amount = 0;

        let pricePerKm = 0;
        let minimumKm = 0;
        let billableKm = 0;
        let driverAllowance = 0;
        let extraCharges = 0;

        if (selectedVehicle) {
            pricePerKm = Number(selectedVehicle.pricePerKm || 0);
            minimumKm = Number(selectedVehicle.minimumKm || 0);

            billableKm = Math.max(
                routeDistanceKm,
                minimumKm
            );

            const multiplier =
                (tripType || "one_way") === "round_trip"
                    ? 2
                    : 1;

            driverAllowance = selectedVehicle.driverIncluded
                ? 0
                : Number(selectedVehicle.driverAllowance || 0);

            extraCharges = Number(
                selectedVehicle.extraCharges || 0
            );

            amount =
                billableKm * multiplier * pricePerKm +
                driverAllowance +
                extraCharges;
        }

        // BOOKING NUMBER
        const bookingNumber =
            "TZ-" +
            Date.now().toString().slice(-8) +
            Math.floor(100 + Math.random() * 900);

        // CREATE BOOKING
        const booking = await Booking.create({
            bookingNumber,

            customer: req.user._id,

            partner: selectedPartner
                ? selectedPartner._id
                : partner || null,

            vehicle: selectedVehicle
                ? selectedVehicle._id
                : vehicle || null,

            serviceType,

            serviceName,

            tripType: tripType || "one_way",

            pickup: pickup || "",

            drop: drop || "",

            travelDate,

            returnDate:
                (tripType || "one_way") === "round_trip"
                    ? returnDate
                    : null,

            pickupTime: pickupTime || "",

            flightNumber: flightNumber || "",

            guests: guestCount,

            distanceKm: routeDistanceKm,

            amount,

            pricing: {
                pricePerKm,
                minimumKm,
                billableKm,
                driverAllowance,
                extraCharges
            },

            paymentMethod: "pending",

            paymentStatus: "pending",

            bookingStatus: "pending",

            notes: notes || ""
        });

        // RETURN COMPLETE BOOKING
        const populatedBooking =
            await Booking.findById(booking._id)
                .populate(
                    "customer",
                    "firstName lastName email phone city"
                )
                .populate(
                    "partner",
                    "firstName lastName email phone city partnerStatus"
                )
                .populate(
                    "vehicle",
                    "vehicleName brand model vehicleNumber vehicleType seatCapacity airConditioning fuelType pricePerKm minimumKm driverIncluded driverAllowance extraCharges vehiclePhotos"
                );

        return res.status(201).json({
            message:
                "Booking request created successfully.",

            booking: populatedBooking
        });
    } catch (error) {
        console.error("Create booking error:", error);

        return res.status(500).json({
            message: "Failed to create booking."
        });
    }
}


// CUSTOMER BOOKINGS
async function getMyBookings(req, res) {
    try {
        const bookings = await Booking.find({
            customer: req.user._id
        })
            .populate(
                "partner",
                "firstName lastName email phone city partnerStatus"
            )
            .populate(
                "vehicle",
                "vehicleName brand model vehicleNumber vehicleType seatCapacity airConditioning fuelType vehiclePhotos"
            )
            .sort({ createdAt: -1 });

        return res.json({
            bookings
        });
    } catch (error) {
        console.error(
            "Get customer bookings error:",
            error
        );

        return res.status(500).json({
            message: "Failed to load bookings."
        });
    }
}


// PARTNER BOOKINGS
async function getPartnerBookings(req, res) {
    try {
        if (req.user.role !== "partner") {
            return res.status(403).json({
                message:
                    "Only partners can access partner bookings."
            });
        }

        const bookings = await Booking.find({
            partner: req.user._id
        })
            .populate(
                "customer",
                "firstName lastName email phone city"
            )
            .populate(
                "vehicle",
                "vehicleName brand model vehicleNumber vehicleType seatCapacity airConditioning fuelType vehiclePhotos"
            )
            .sort({ createdAt: -1 });

        return res.json({
            bookings
        });
    } catch (error) {
        console.error(
            "Get partner bookings error:",
            error
        );

        return res.status(500).json({
            message: "Failed to load bookings."
        });
    }
}


// SINGLE BOOKING
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
            )
            .populate(
                "vehicle",
                "vehicleName brand model vehicleNumber vehicleType seatCapacity airConditioning fuelType pricePerKm minimumKm driverIncluded driverAllowance extraCharges vehiclePhotos"
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

        const isAdmin =
            req.user.role === "admin";

        if (!isCustomer && !isPartner && !isAdmin) {
            return res.status(403).json({
                message:
                    "You are not allowed to view this booking."
            });
        }

        return res.json({
            booking
        });
    } catch (error) {
        console.error(
            "Get booking error:",
            error
        );

        return res.status(500).json({
            message: "Failed to load booking."
        });
    }
}


// PARTNER ACCEPTS BOOKING
async function acceptBooking(req, res) {
    try {
        if (req.user.role !== "partner") {
            return res.status(403).json({
                message:
                    "Only partners can accept bookings."
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
            message:
                "Booking accepted successfully.",
            booking
        });
    } catch (error) {
        console.error(
            "Accept booking error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to accept booking."
        });
    }
}


// PARTNER REJECTS BOOKING
async function rejectBooking(req, res) {
    try {
        if (req.user.role !== "partner") {
            return res.status(403).json({
                message:
                    "Only partners can reject bookings."
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
        console.error(
            "Reject booking error:",
            error
        );

        return res.status(500).json({
            message: "Failed to reject booking."
        });
    }
}


// CUSTOMER CANCELS BOOKING
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
            message:
                "Booking cancelled successfully.",
            booking
        });
    } catch (error) {
        console.error(
            "Cancel booking error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to cancel booking."
        });
    }
}


// PARTNER COMPLETES TRIP
async function completeBooking(req, res) {
    try {
        if (req.user.role !== "partner") {
            return res.status(403).json({
                message:
                    "Only partners can complete trips."
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
            message:
                "Trip completed successfully.",
            booking
        });
    } catch (error) {
        console.error(
            "Complete booking error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to complete trip."
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