// =====================================================
// TRIPZOVA PARTNER - ADD / EDIT VEHICLE
// =====================================================

(function () {
    "use strict";


    // =================================================
    // STATE
    // =================================================

    const params = new URLSearchParams(window.location.search);
    const editingVehicleId = params.get("id");


    // =================================================
    // LOAD EXISTING VEHICLE (edit mode)
    // =================================================

    async function loadVehicleForEdit() {

        if (!editingVehicleId) {
            return;
        }

        setText("addVehiclePageTitle", "Edit Vehicle");
        setText("addVehicleHeading", "Edit Vehicle");
        setText("saveVehicleBtnText", "Save Changes");

        try {

            const data =
                await partnerFetch(
                    `/api/partners/vehicles/${editingVehicleId}`
                );

            const vehicle = data.vehicle || data;

            fillForm(vehicle);

        } catch (error) {

            console.error("Load vehicle error:", error);

            showMessage(
                error.message || "Unable to load this vehicle.",
                "danger"
            );
        }
    }


    function fillForm(vehicle) {

        setValue("vehicleName", vehicle.vehicleName);
        setValue("vehicleNumber", vehicle.vehicleNumber);
        setValue("vehicleBrand", vehicle.brand);
        setValue("vehicleModel", vehicle.model);
        setValue("vehicleType", vehicle.vehicleType);
        setValue("seatCapacity", vehicle.seatCapacity);
        setValue("airConditioning", vehicle.airConditioning || "ac");
        setValue("fuelType", vehicle.fuelType);
        setValue("pricePerKm", vehicle.pricePerKm);
        setValue("minimumKm", vehicle.minimumKm);
        setValue(
            "driverIncluded",
            vehicle.driverIncluded === false ? "false" : "true"
        );
        setValue("driverAllowance", vehicle.driverAllowance);
        setValue("extraCharges", vehicle.extraCharges);
        setValue("vehicleDescription", vehicle.description);

        if (
            Array.isArray(vehicle.vehiclePhotos) &&
            vehicle.vehiclePhotos.length
        ) {
            setValue("vehiclePhotoUrl", vehicle.vehiclePhotos[0]);
        }
    }


    // =================================================
    // SUBMIT
    // =================================================

    async function handleSubmit(event) {

        event.preventDefault();

        hideMessage();

        const vehicleName = getValue("vehicleName").trim();
        const vehicleNumber = getValue("vehicleNumber").trim();
        const vehicleType = getValue("vehicleType");
        const seatCapacity = getValue("seatCapacity");
        const fuelType = getValue("fuelType");
        const pricePerKm = getValue("pricePerKm");

        if (!vehicleName || !vehicleNumber || !vehicleType || !fuelType) {
            showMessage(
                "Please fill in all required fields.",
                "danger"
            );
            return;
        }

        if (!seatCapacity || Number(seatCapacity) < 1) {
            showMessage(
                "Seat capacity must be at least 1.",
                "danger"
            );
            return;
        }

        if (pricePerKm === "" || Number(pricePerKm) < 0) {
            showMessage(
                "Please enter a valid price per KM.",
                "danger"
            );
            return;
        }

        const photoUrl = getValue("vehiclePhotoUrl").trim();

        const payload = {
            vehicleName,
            vehicleNumber,
            brand: getValue("vehicleBrand").trim(),
            model: getValue("vehicleModel").trim(),
            vehicleType,
            seatCapacity: Number(seatCapacity),
            airConditioning: getValue("airConditioning"),
            fuelType,
            pricePerKm: Number(pricePerKm),
            minimumKm: Number(getValue("minimumKm") || 0),
            driverIncluded: getValue("driverIncluded") === "true",
            driverAllowance: Number(getValue("driverAllowance") || 0),
            extraCharges: Number(getValue("extraCharges") || 0),
            description: getValue("vehicleDescription").trim(),
            vehiclePhotos: photoUrl ? [photoUrl] : []
        };

        const saveButton = document.getElementById("saveVehicleBtn");

        if (saveButton) {
            saveButton.disabled = true;
        }

        setText(
            "saveVehicleBtnText",
            editingVehicleId ? "Saving..." : "Adding..."
        );

        try {

            if (editingVehicleId) {

                await partnerFetch(
                    `/api/partners/vehicles/${editingVehicleId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(payload)
                    }
                );

                showMessage(
                    "Vehicle updated and submitted for admin approval.",
                    "success"
                );

            } else {

                await partnerFetch(
                    "/api/partners/vehicles",
                    {
                        method: "POST",
                        body: JSON.stringify(payload)
                    }
                );

                showMessage(
                    "Vehicle added successfully and submitted for admin approval.",
                    "success"
                );

                document.getElementById("vehicleForm").reset();
            }

            setTimeout(() => {
                window.location.href = "vehicles.html";
            }, 1200);

        } catch (error) {

            console.error("Save vehicle error:", error);

            showMessage(
                error.message || "Unable to save this vehicle.",
                "danger"
            );

        } finally {

            if (saveButton) {
                saveButton.disabled = false;
            }

            setText(
                "saveVehicleBtnText",
                editingVehicleId ? "Save Changes" : "Add Vehicle"
            );
        }
    }


    // =================================================
    // HELPERS
    // =================================================

    function getValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : "";
    }

    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    }

    function showMessage(text, type) {
        const messageEl = document.getElementById("addVehicleMessage");
        if (!messageEl) return;

        messageEl.style.display = "block";
        messageEl.className = `partner-alert partner-alert-${type} mb-4`;
        messageEl.textContent = text;

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function hideMessage() {
        const messageEl = document.getElementById("addVehicleMessage");
        if (messageEl) {
            messageEl.style.display = "none";
        }
    }


    // =================================================
    // START
    // =================================================

    document.addEventListener("DOMContentLoaded", () => {

        if (
            typeof requirePartnerLogin === "function" &&
            !requirePartnerLogin()
        ) {
            return;
        }

        loadVehicleForEdit();

        const form = document.getElementById("vehicleForm");

        if (form) {
            form.addEventListener("submit", handleSubmit);
        }
    });

})();
