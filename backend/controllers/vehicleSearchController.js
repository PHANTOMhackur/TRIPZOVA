const Vehicle = require("../models/Vehicle");
const PartnerProfile = require("../models/PartnerProfile");
const User = require("../models/User");

const searchVehicles = async (req, res) => {
    try {
        const members = Number(req.query.members || 1);

        if (!Number.isInteger(members) || members < 1) {
            return res.status(400).json({
                success: false,
                message: "Members must be at least 1."
            });
        }

        const vehicles = await Vehicle.find({
            seatCapacity: { $gte: members },
            vehicleStatus: "active",
            adminApproval: "approved"
        })
            .populate(
                "partner",
                "firstName lastName email phone city role partnerStatus accountStatus"
            )
            .sort({
                seatCapacity: 1,
                pricePerKm: 1
            });

        const results = [];

        for (const vehicle of vehicles) {
            if (!vehicle.partner) {
                continue;
            }

            if (
                vehicle.partner.accountStatus !== "active" ||
                vehicle.partner.partnerStatus !== "approved"
            ) {
                continue;
            }

            const profile = await PartnerProfile.findOne({
                user: vehicle.partner._id
            }).select(
                "profilePicture businessName displayName city about experienceYears languages partnerType"
            );

            results.push({
                vehicle: {
                    _id: vehicle._id,
                    vehiclePhotos: vehicle.vehiclePhotos,
                    vehicleName: vehicle.vehicleName,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    vehicleType: vehicle.vehicleType,
                    seatCapacity: vehicle.seatCapacity,
                    airConditioning: vehicle.airConditioning,
                    fuelType: vehicle.fuelType,
                    pricePerKm: vehicle.pricePerKm,
                    minimumKm: vehicle.minimumKm,
                    driverIncluded: vehicle.driverIncluded,
                    driverAllowance: vehicle.driverAllowance,
                    extraCharges: vehicle.extraCharges,
                    description: vehicle.description
                },

                partner: {
                    _id: vehicle.partner._id,
                    firstName: vehicle.partner.firstName,
                    lastName: vehicle.partner.lastName,
                    email: vehicle.partner.email,
                    phone: vehicle.partner.phone,
                    city: vehicle.partner.city
                },

                profile: profile || null
            });
        }

        return res.status(200).json({
            success: true,
            members,
            count: results.length,
            data: results
        });

    } catch (error) {
        console.error(
            "Vehicle search error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to search vehicles."
        });
    }
};


const getVehicleDetails = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            vehicleStatus: "active",
            adminApproval: "approved"
        }).populate(
            "partner",
            "firstName lastName email phone city role partnerStatus accountStatus"
        );

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found."
            });
        }

        if (!vehicle.partner) {
            return res.status(404).json({
                success: false,
                message: "Vehicle partner not found."
            });
        }

        if (
            vehicle.partner.accountStatus !== "active" ||
            vehicle.partner.partnerStatus !== "approved"
        ) {
            return res.status(404).json({
                success: false,
                message: "Vehicle is currently unavailable."
            });
        }

        const profile = await PartnerProfile.findOne({
            user: vehicle.partner._id
        }).select(
            "profilePicture businessName displayName city about experienceYears languages partnerType"
        );

        return res.status(200).json({
            success: true,
            data: {
                vehicle: {
                    _id: vehicle._id,
                    vehiclePhotos: vehicle.vehiclePhotos,
                    vehicleName: vehicle.vehicleName,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    vehicleNumber: vehicle.vehicleNumber,
                    vehicleType: vehicle.vehicleType,
                    seatCapacity: vehicle.seatCapacity,
                    airConditioning: vehicle.airConditioning,
                    fuelType: vehicle.fuelType,
                    pricePerKm: vehicle.pricePerKm,
                    minimumKm: vehicle.minimumKm,
                    driverIncluded: vehicle.driverIncluded,
                    driverAllowance: vehicle.driverAllowance,
                    extraCharges: vehicle.extraCharges,
                    description: vehicle.description
                },

                partner: {
                    _id: vehicle.partner._id,
                    firstName: vehicle.partner.firstName,
                    lastName: vehicle.partner.lastName,
                    email: vehicle.partner.email,
                    phone: vehicle.partner.phone,
                    city: vehicle.partner.city
                },

                profile: profile || null
            }
        });

    } catch (error) {
        console.error(
            "Vehicle details error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load vehicle details."
        });
    }
};


module.exports = {
    searchVehicles,
    getVehicleDetails
};