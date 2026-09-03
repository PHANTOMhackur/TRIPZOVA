const express = require("express");

const adminMiddleware = require("../middleware/adminMiddleware");

const {
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
} = require("../controllers/adminController");


const router = express.Router();


// =========================================
// ADMIN AUTHENTICATION
// =========================================

router.use(adminMiddleware);


// =========================================
// DASHBOARD
// =========================================

router.get(
    "/dashboard",
    getDashboardStats
);

router.get(
    "/dashboard/recent-partners",
    getRecentPartnerRequests
);


// =========================================
// PARTNERS
// =========================================

router.get(
    "/partners",
    getPartners
);

router.get(
    "/partners/:id",
    getPartnerById
);

router.put(
    "/partners/:id/approve",
    approvePartner
);

router.put(
    "/partners/:id/reject",
    rejectPartner
);


// =========================================
// USERS
// =========================================

router.get(
    "/users",
    getUsers
);

router.get(
    "/users/:id",
    getUserById
);


// =========================================
// USER ACCOUNT STATUS
// =========================================

router.put(
    "/users/:id/status",
    updateUserStatus
);

// =========================================
// BOOKINGS
// =========================================

router.get(
    "/bookings",
    getBookings
);

router.get(
    "/bookings/:id",
    getBookingById
);

router.put(
    "/bookings/:id/status",
    updateBookingStatus
);

module.exports = router;