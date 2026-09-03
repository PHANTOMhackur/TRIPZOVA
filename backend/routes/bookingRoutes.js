const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    createBooking,
    getMyBookings,
    getPartnerBookings,
    getBookingById,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    completeBooking
} = require("../controllers/bookingController");

const router = express.Router();


// All booking routes require login
router.use(authMiddleware);


// Customer
router.post("/", createBooking);
router.get("/my", getMyBookings);


// Partner
router.get("/partner", getPartnerBookings);
router.put("/:id/accept", acceptBooking);
router.put("/:id/reject", rejectBooking);
router.put("/:id/complete", completeBooking);


// Customer cancellation
router.put("/:id/cancel", cancelBooking);


// Customer / Partner / Admin
router.get("/:id", getBookingById);


module.exports = router;