// =====================================================
// TRIPZOVA PARTNER DASHBOARD CONTROLLER
// =====================================================

const User = require("../models/User");
const PartnerProfile = require("../models/PartnerProfile");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");


// =====================================================
// GET PARTNER DASHBOARD
// =====================================================

const getPartnerDashboard = async (req, res) => {
    try {

        const partnerId = req.user._id;


        // =================================================
        // PROFILE
        // =================================================

        const profile = await PartnerProfile.findOne({
            user: partnerId
        }).populate(
            "user",
            "firstName lastName email phone city address role partnerStatus accountStatus"
        );


        // =================================================
        // VEHICLES
        // =================================================

        const vehicles = await Vehicle.find({
            partner: partnerId
        })
            .sort({ createdAt: -1 })
            .limit(10);


        const vehicleCount = await Vehicle.countDocuments({
            partner: partnerId
        });


        // =================================================
        // BOOKINGS
        // =================================================

        const bookings = await Booking.find({
            partner: partnerId
        })
            .populate(
                "customer",
                "firstName lastName email phone"
            )
            .sort({
                createdAt: -1
            });


        const totalBookings =
            bookings.length;


        // =================================================
        // PENDING BOOKINGS
        // =================================================

        const pendingBookings =
            bookings.filter(
                booking =>
                    booking.bookingStatus === "pending"
            ).length;


        // =================================================
        // UNIQUE CUSTOMERS
        // =================================================

        const customerIds =
            new Set();

        bookings.forEach(
            booking => {

                if (booking.customer?._id) {

                    customerIds.add(
                        booking.customer._id.toString()
                    );
                }
            }
        );


        const customerCount =
            customerIds.size;


        // =================================================
        // TOTAL REVENUE
        // =================================================
        // Only completed bookings are counted as revenue.
        // Cancelled/rejected/pending bookings are excluded.

        const totalRevenue =
            bookings
                .filter(
                    booking =>
                        booking.bookingStatus ===
                        "completed"
                )
                .reduce(
                    (total, booking) =>
                        total +
                        Number(
                            booking.amount || 0
                        ),
                    0
                );


        // =================================================
        // RECENT BOOKINGS
        // =================================================

        const recentBookings =
            bookings.slice(0, 5);


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            data: {

                vehicleCount,

                totalBookings,

                customerCount,

                totalRevenue,

                pendingBookings,

                profile,

                vehicles,

                recentBookings

            }

        });

    } catch (error) {

        console.error(
            "Partner dashboard error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load partner dashboard."

        });
    }
};


module.exports = {
    getPartnerDashboard
};