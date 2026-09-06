// =====================================================
// TRIPZOVA PARTNER - MY VEHICLES
// =====================================================

(function () {
    "use strict";


    // =================================================
    // STATE
    // =================================================

    let allVehicles = [];
    let pendingDeleteId = null;


    // =================================================
    // LOAD VEHICLES
    // =================================================

    async function loadVehicles() {

        showLoading(true);
        hideError();

        try {

            const data =
                await partnerFetch("/api/partners/vehicles");

            allVehicles =
                Array.isArray(data.vehicles)
                    ? data.vehicles
                    : [];

            updateStats();
            renderVehicles();

        } catch (error) {

            console.error("Load vehicles error:", error);

            showError(
                error.message || "Unable to load your vehicles."
            );

        } finally {

            showLoading(false);
        }
    }


    // =================================================
    // STATS
    // =================================================

    function updateStats() {

        const total = allVehicles.length;

        const active = allVehicles.filter(
            (vehicle) => vehicle.vehicleStatus === "active"
        ).length;

        const pending = allVehicles.filter(
            (vehicle) =>
                vehicle.adminApproval === "pending" ||
                vehicle.vehicleStatus === "pending"
        ).length;

        const rejected = allVehicles.filter(
            (vehicle) =>
                vehicle.adminApproval === "rejected" ||
                vehicle.vehicleStatus === "rejected"
        ).length;

        setText("vehicleTotalCount", total);
        setText("vehicleActiveCount", active);
        setText("vehiclePendingCount", pending);
        setText("vehicleRejectedCount", rejected);
    }


    // =================================================
    // RENDER
    // =================================================

    function renderVehicles() {

        const grid = document.getElementById("vehiclesGrid");
        const emptyState = document.getElementById("vehiclesEmpty");

        if (!grid) {
            return;
        }

        if (!allVehicles.length) {
            grid.innerHTML = "";
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";

        grid.innerHTML =
            allVehicles.map(renderVehicleCard).join("");


        // Wire up edit/delete buttons
        grid.querySelectorAll("[data-edit-id]").forEach((button) => {
            button.addEventListener("click", () => {
                window.location.href =
                    `add-vehicle.html?id=${button.getAttribute("data-edit-id")}`;
            });
        });

        grid.querySelectorAll("[data-delete-id]").forEach((button) => {
            button.addEventListener("click", () => {
                openDeleteModal(
                    button.getAttribute("data-delete-id"),
                    button.getAttribute("data-delete-name")
                );
            });
        });
    }


    function renderVehicleCard(vehicle) {

        const photo =
            Array.isArray(vehicle.vehiclePhotos) &&
            vehicle.vehiclePhotos.length
                ? vehicle.vehiclePhotos[0]
                : "";

        const imageHTML = photo
            ? `
                <img
                    src="${escapeHTML(photo)}"
                    alt="${escapeHTML(vehicle.vehicleName)}"
                    class="partner-vehicle-image"
                >
            `
            : `
                <div class="partner-vehicle-placeholder">
                    <i class="bi bi-car-front"></i>
                </div>
            `;

        // A vehicle that's rejected shows the rejection status,
        // otherwise show the live operational status.
        const statusValue =
            vehicle.adminApproval === "rejected"
                ? "rejected"
                : vehicle.adminApproval === "pending"
                    ? "pending"
                    : vehicle.vehicleStatus || "pending";

        return `
            <div class="partner-vehicle-card">

                <div class="partner-vehicle-photo">
                    ${imageHTML}
                </div>

                <div class="partner-vehicle-content">

                    <div class="partner-vehicle-header">

                        <h5 class="partner-vehicle-name">
                            ${escapeHTML(vehicle.vehicleName)}
                        </h5>

                        <span class="partner-status ${getStatusClass(statusValue)}">
                            ${escapeHTML(formatStatus(statusValue))}
                        </span>

                    </div>

                    <div class="partner-vehicle-number">
                        ${escapeHTML(vehicle.vehicleNumber || "")}
                    </div>

                    <div class="partner-vehicle-meta">

                        <span class="partner-vehicle-meta-item">
                            <i class="bi bi-people"></i>
                            ${Number(vehicle.seatCapacity || 0)} Seats
                        </span>

                        <span class="partner-vehicle-meta-item">
                            <i class="bi bi-snow"></i>
                            ${vehicle.airConditioning === "ac" ? "AC" : "Non-AC"}
                        </span>

                        <span class="partner-vehicle-meta-item">
                            <i class="bi bi-fuel-pump"></i>
                            ${escapeHTML(formatStatus(vehicle.fuelType || "other"))}
                        </span>

                    </div>

                    <div class="partner-vehicle-price">
                        <strong>${formatCurrency(vehicle.pricePerKm || 0)}</strong>
                        <span>/ km</span>
                    </div>

                    <div class="partner-vehicle-actions">

                        <button
                            type="button"
                            class="partner-btn partner-btn-outline partner-btn-sm"
                            data-edit-id="${escapeHTML(vehicle._id)}"
                        >
                            <i class="bi bi-pencil"></i>
                            Edit
                        </button>

                        <button
                            type="button"
                            class="partner-btn partner-btn-danger partner-btn-sm"
                            data-delete-id="${escapeHTML(vehicle._id)}"
                            data-delete-name="${escapeHTML(vehicle.vehicleName)}"
                        >
                            <i class="bi bi-trash"></i>
                            Delete
                        </button>

                    </div>

                </div>

            </div>
        `;
    }


    // =================================================
    // DELETE
    // =================================================

    function openDeleteModal(vehicleId, vehicleName) {

        pendingDeleteId = vehicleId;

        setText("deleteVehicleName", vehicleName || "this vehicle");

        const modalElement =
            document.getElementById("deleteVehicleModal");

        if (modalElement && window.bootstrap) {
            new window.bootstrap.Modal(modalElement).show();
        }
    }


    async function confirmDelete() {

        if (!pendingDeleteId) {
            return;
        }

        const confirmButton =
            document.getElementById("confirmDeleteVehicleBtn");

        if (confirmButton) {
            confirmButton.disabled = true;
            confirmButton.textContent = "Deleting...";
        }

        try {

            await partnerFetch(
                `/api/partners/vehicles/${pendingDeleteId}`,
                { method: "DELETE" }
            );

            const modalElement =
                document.getElementById("deleteVehicleModal");

            if (modalElement && window.bootstrap) {
                const instance =
                    window.bootstrap.Modal.getInstance(modalElement);

                if (instance) {
                    instance.hide();
                }
            }

            pendingDeleteId = null;

            await loadVehicles();

        } catch (error) {

            console.error("Delete vehicle error:", error);
            alert(error.message || "Unable to delete this vehicle.");

        } finally {

            if (confirmButton) {
                confirmButton.disabled = false;
                confirmButton.textContent = "Delete";
            }
        }
    }


    // =================================================
    // HELPERS
    // =================================================

    function showLoading(isLoading) {
        const loadingEl = document.getElementById("vehiclesLoading");
        if (loadingEl) {
            loadingEl.style.display = isLoading ? "block" : "none";
        }
    }

    function showError(message) {
        const errorEl = document.getElementById("vehiclesError");
        if (errorEl) {
            errorEl.style.display = "block";
            errorEl.className = "partner-alert partner-alert-danger mb-4";
            errorEl.textContent = message;
        }
    }

    function hideError() {
        const errorEl = document.getElementById("vehiclesError");
        if (errorEl) {
            errorEl.style.display = "none";
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

        loadVehicles();

        const confirmButton =
            document.getElementById("confirmDeleteVehicleBtn");

        if (confirmButton) {
            confirmButton.addEventListener("click", confirmDelete);
        }
    });

})();
