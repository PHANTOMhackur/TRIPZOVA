const express = require("express");

const {
    searchVehicles,
    getVehicleDetails
} = require("../controllers/vehicleSearchController");

const router = express.Router();

router.get("/search", searchVehicles);

router.get("/:id", getVehicleDetails);

module.exports = router;