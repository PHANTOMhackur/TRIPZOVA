const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const partnerMiddleware = require("../middleware/partnerMiddleware");

const {
    getMyProfile,
    updateMyProfile,
    getMyVehicles,
    getMyVehicleById,
    addVehicle,
    updateVehicle,
    deleteVehicle
} = require("../controllers/partnerController");

const {
    getPartnerDashboard
} = require("../controllers/partnerDashboardController");


const router = express.Router();


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(authMiddleware);
router.use(partnerMiddleware);


// =====================================================
// PARTNER DASHBOARD
// =====================================================

router.get(
    "/dashboard",
    getPartnerDashboard
);


// =====================================================
// PROFILE
// =====================================================

router.get(
    "/profile",
    getMyProfile
);

router.put(
    "/profile",
    updateMyProfile
);


// =====================================================
// VEHICLES
// =====================================================

router.get(
    "/vehicles",
    getMyVehicles
);

router.get(
    "/vehicles/:id",
    getMyVehicleById
);

router.post(
    "/vehicles",
    addVehicle
);

router.put(
    "/vehicles/:id",
    updateVehicle
);

router.delete(
    "/vehicles/:id",
    deleteVehicle
);


module.exports = router;