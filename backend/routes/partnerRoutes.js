const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    getMyProfile,
    updateMyProfile,
    getMyVehicles,
    getMyVehicleById,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getPartnerDashboard
} = require("../controllers/partnerController");

const router = express.Router();

// All partner routes require a logged-in user
router.use(authMiddleware);

// =====================================================
// PARTNER PROFILE
// =====================================================

router.get("/profile", getMyProfile);

router.put("/profile", updateMyProfile);


// =====================================================
// PARTNER VEHICLES
// =====================================================

// Get all my vehicles
router.get("/vehicles", getMyVehicles);

// Get one of my vehicles
router.get("/vehicles/:id", getMyVehicleById);

// Add vehicle
router.post("/vehicles", addVehicle);

// Update vehicle
router.put("/vehicles/:id", updateVehicle);

// Delete vehicle
router.delete("/vehicles/:id", deleteVehicle);

router.get("/dashboard", getPartnerDashboard);


module.exports = router;