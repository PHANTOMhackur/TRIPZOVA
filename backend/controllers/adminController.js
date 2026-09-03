const User = require("../models/User");
const Booking = require("../models/Booking");


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

const getDashboardStats = async (req, res) => {

    try {

        const [
            totalUsers,
            totalCustomers,
            totalTravellers,
            totalPartners,
            approvedPartners,
            pendingPartners,
            rejectedPartners,
            activeUsers,
            suspendedUsers,
            blockedUsers
        ] = await Promise.all([

            User.countDocuments(),

            User.countDocuments({
                role: "customer"
            }),

            User.countDocuments({
                role: "traveller"
            }),

            User.countDocuments({
                role: "partner"
            }),

            User.countDocuments({
                role: "partner",
                partnerStatus: "approved"
            }),

            User.countDocuments({
                role: "partner",
                partnerStatus: "pending"
            }),

            User.countDocuments({
                role: "partner",
                partnerStatus: "rejected"
            }),

            User.countDocuments({
                accountStatus: "active"
            }),

            User.countDocuments({
                accountStatus: "suspended"
            }),

            User.countDocuments({
                accountStatus: "blocked"
            })

        ]);


        return res.json({

            success: true,

            stats: {

                totalUsers,

                customers: totalCustomers,

                travellers: totalTravellers,

                partners: totalPartners,

                approvedPartners,

                pendingPartners,

                rejectedPartners,

                activeUsers,

                suspendedUsers,

                blockedUsers

            }

        });

    } catch (error) {

        console.error(
            "Dashboard stats error:",
            error
        );

        return res.status(500).json({
            message: "Failed to load dashboard statistics."
        });
    }
};


/* =========================================================
   RECENT PARTNER REQUESTS
========================================================= */

const getRecentPartnerRequests = async (req, res) => {

    try {

        const partners =
            await User.find({
                role: "partner"
            })
            .select(
                "firstName lastName email phone city address partnerStatus accountStatus createdAt"
            )
            .sort({
                createdAt: -1
            })
            .limit(10)
            .lean();


        return res.json({

            success: true,

            partners

        });

    } catch (error) {

        console.error(
            "Recent partner requests error:",
            error
        );

        return res.status(500).json({
            message: "Failed to load partner requests."
        });
    }
};


/* =========================================================
   ALL PARTNERS
========================================================= */

const getPartners = async (req, res) => {

    try {

        const {
            status,
            search
        } = req.query;


        const query = {
            role: "partner"
        };


        if (
            status &&
            [
                "pending",
                "approved",
                "rejected"
            ].includes(status)
        ) {

            query.partnerStatus = status;

        }


        if (search && search.trim()) {

            const searchValue =
                search.trim();


            query.$or = [

                {
                    firstName: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    lastName: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    email: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    phone: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    city: {
                        $regex: searchValue,
                        $options: "i"
                    }
                }

            ];

        }


        const partners =
            await User.find(query)
            .select(
                "firstName lastName email phone city address partnerStatus accountStatus createdAt updatedAt"
            )
            .sort({
                createdAt: -1
            })
            .lean();


        return res.json({

            success: true,

            count: partners.length,

            partners

        });

    } catch (error) {

        console.error(
            "Get partners error:",
            error
        );

        return res.status(500).json({
            message: "Failed to load partners."
        });
    }
};


/* =========================================================
   GET SINGLE PARTNER
========================================================= */

const getPartnerById = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const partner =
            await User.findOne({
                _id: id,
                role: "partner"
            })
            .select(
                "firstName lastName email phone city address partnerStatus accountStatus authProvider phoneVerified createdAt updatedAt"
            )
            .lean();


        if (!partner) {

            return res.status(404).json({
                message: "Partner not found."
            });

        }


        return res.json({

            success: true,

            partner

        });

    } catch (error) {

        console.error(
            "Get partner error:",
            error
        );

        return res.status(500).json({
            message: "Failed to load partner details."
        });
    }
};


/* =========================================================
   APPROVE PARTNER
========================================================= */

const approvePartner = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const partner =
            await User.findOne({
                _id: id,
                role: "partner"
            });


        if (!partner) {

            return res.status(404).json({
                message: "Partner not found."
            });

        }


        if (
            partner.partnerStatus ===
            "approved"
        ) {

            return res.status(400).json({
                message: "Partner is already approved."
            });

        }


        partner.partnerStatus =
            "approved";

        partner.accountStatus =
            "active";


        await partner.save();


        console.log(
            "Partner approved:",
            partner.email
        );


        return res.json({

            success: true,

            message:
                "Partner approved successfully.",

            partner: {

                id: partner._id,

                firstName:
                    partner.firstName,

                lastName:
                    partner.lastName,

                email:
                    partner.email,

                partnerStatus:
                    partner.partnerStatus,

                accountStatus:
                    partner.accountStatus

            }

        });

    } catch (error) {

        console.error(
            "Approve partner error:",
            error
        );

        return res.status(500).json({
            message: "Failed to approve partner."
        });
    }
};


/* =========================================================
   REJECT PARTNER
========================================================= */

const rejectPartner = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const partner =
            await User.findOne({
                _id: id,
                role: "partner"
            });


        if (!partner) {

            return res.status(404).json({
                message: "Partner not found."
            });

        }


        if (
            partner.partnerStatus ===
            "rejected"
        ) {

            return res.status(400).json({
                message: "Partner is already rejected."
            });

        }


        partner.partnerStatus =
            "rejected";


        await partner.save();


        console.log(
            "Partner rejected:",
            partner.email
        );


        return res.json({

            success: true,

            message:
                "Partner application rejected.",

            partner: {

                id: partner._id,

                firstName:
                    partner.firstName,

                lastName:
                    partner.lastName,

                email:
                    partner.email,

                partnerStatus:
                    partner.partnerStatus

            }

        });

    } catch (error) {

        console.error(
            "Reject partner error:",
            error
        );

        return res.status(500).json({
            message: "Failed to reject partner."
        });
    }
};


/* =========================================================
   ALL USERS
========================================================= */

const getUsers = async (req, res) => {

    try {

        const {
            role,
            status,
            search
        } = req.query;


        const query = {};


        if (
            role &&
            [
                "customer",
                "traveller",
                "partner",
                "admin"
            ].includes(role)
        ) {

            query.role = role;

        }


        if (
            status &&
            [
                "active",
                "suspended",
                "blocked"
            ].includes(status)
        ) {

            query.accountStatus = status;

        }


        if (search && search.trim()) {

            const searchValue =
                search.trim();


            query.$or = [

                {
                    firstName: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    lastName: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    email: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    phone: {
                        $regex: searchValue,
                        $options: "i"
                    }
                }

            ];

        }


        const users =
            await User.find(query)
            .select(
                "firstName lastName email phone city role partnerStatus accountStatus phoneVerified authProvider createdAt"
            )
            .sort({
                createdAt: -1
            })
            .lean();


        return res.json({

            success: true,

            count: users.length,

            users

        });

    } catch (error) {

        console.error(
            "Get users error:",
            error
        );

        return res.status(500).json({
            message: "Failed to load users."
        });
    }
};

async function getUserById(req, res) {

    try {

        const user = await User.findById(
            req.params.id
        ).select(
            "-password -resetPasswordToken -resetPasswordExpires"
        );


        if (!user) {

            return res.status(404).json({
                message: "User not found."
            });

        }


        return res.json({
            user
        });

    } catch (error) {

        console.error(
            "Get user by ID error:",
            error
        );


        return res.status(500).json({
            message: "Unable to load user details."
        });

    }

}

// =========================================
// CHANGE USER ACCOUNT STATUS
// =========================================

async function updateUserStatus(req, res) {

    try {

        const { status } = req.body;

        console.log("ADMIN STATUS UPDATE");
        console.log("User ID:", req.params.id);
        console.log("New status:", status);


        const allowedStatuses = [
            "active",
            "suspended",
            "blocked"
        ];


        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                message: "Invalid account status."
            });

        }


        const user = await User.findById(
            req.params.id
        );


        if (!user) {

            return res.status(404).json({
                message: "User not found."
            });

        }


        // Prevent admin from changing their own account
        if (
            req.admin &&
            req.admin._id.toString() ===
            user._id.toString()
        ) {

            return res.status(400).json({
                message:
                    "You cannot change your own account status."
            });

        }


        user.accountStatus = status;

        await user.save();


        console.log(
            "Account status updated:",
            user.email,
            "=>",
            user.accountStatus
        );


        return res.status(200).json({

            success: true,

            message:
                status === "active"
                    ? "User account reactivated successfully."
                    : status === "suspended"
                        ? "User account suspended successfully."
                        : "User account blocked successfully.",

            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                accountStatus: user.accountStatus
            }

        });

    } catch (error) {

        console.error(
            "UPDATE USER STATUS ERROR:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to update user account status."
        });

    }

}

// =========================================
// GET ALL BOOKINGS
// =========================================

async function getBookings(req, res) {

    try {

        const {
            status,
            paymentStatus,
            serviceType,
            search
        } = req.query;


        const filter = {};


        if (status) {

            filter.bookingStatus =
                status;

        }


        if (paymentStatus) {

            filter.paymentStatus =
                paymentStatus;

        }


        if (serviceType) {

            filter.serviceType =
                serviceType;

        }


        if (search) {

            filter.$or = [
                {
                    bookingNumber: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    serviceName: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];

        }


        const bookings =
            await Booking.find(filter)

                .populate(
                    "customer",
                    "firstName lastName email phone"
                )

                .populate(
                    "partner",
                    "firstName lastName email phone city"
                )

                .sort({
                    createdAt: -1
                });


        return res.json({
            bookings
        });

    } catch (error) {

        console.error(
            "Get bookings error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to load bookings."
        });

    }

}


// =========================================
// GET BOOKING BY ID
// =========================================

async function getBookingById(req, res) {

    try {

        const booking =
            await Booking.findById(
                req.params.id
            )

                .populate(
                    "customer",
                    "firstName lastName email phone city address"
                )

                .populate(
                    "partner",
                    "firstName lastName email phone city address"
                );


        if (!booking) {

            return res.status(404).json({
                message:
                    "Booking not found."
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
            message:
                "Unable to load booking."
        });

    }

}


// =========================================
// UPDATE BOOKING STATUS
// =========================================

async function updateBookingStatus(
    req,
    res
) {

    try {

        const {
            status
        } = req.body;


        const allowedStatuses = [
            "pending",
            "confirmed",
            "completed",
            "cancelled"
        ];


        if (
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({
                message:
                    "Invalid booking status."
            });

        }


        const booking =
            await Booking.findById(
                req.params.id
            );


        if (!booking) {

            return res.status(404).json({
                message:
                    "Booking not found."
            });

        }


        booking.bookingStatus =
            status;


        if (
            status === "cancelled" &&
            req.body.cancellationReason
        ) {

            booking.cancellationReason =
                req.body.cancellationReason;

        }


        await booking.save();


        return res.json({

            success: true,

            message:
                "Booking status updated successfully.",

            booking

        });

    } catch (error) {

        console.error(
            "Update booking status error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to update booking status."
        });

    }

}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    getDashboardStats,
    getRecentPartnerRequests,
    getPartners,
    getPartnerById,
    approvePartner,
    rejectPartner,
    getUsers,
    getUserById,
    updateUserStatus,

    getBookings,
    getBookingById,
    updateBookingStatus
};