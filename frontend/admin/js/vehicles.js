// =====================================================
// TRIPZOVA ADMIN - VEHICLES
// =====================================================

let allVehicles = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();

    loadVehicles();

    const searchInput = document.getElementById("vehicleSearch");
    const approvalFilter = document.getElementById("vehicleApprovalFilter");
    const refreshButton = document.getElementById("refreshVehiclesBtn");

    if (searchInput) {
        searchInput.addEventListener("input", applyVehicleFilters);
    }

    if (approvalFilter) {
        approvalFilter.addEventListener("change", applyVehicleFilters);
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", loadVehicles);
    }
});


async function loadVehicles() {

    showLoading(true);
    hideError();

    try {

        const data = await adminFetch("/api/admin/vehicles");

        allVehicles = Array.isArray(data.vehicles) ? data.vehicles : [];

        updateVehicleStats();
        applyVehicleFilters();

    } catch (error) {

        console.error("Vehicle loading error:", error);

        showError(error.message || "Unable to load vehicles.");

    } finally {

        showLoading(false);
    }
}


function updateVehicleStats() {

    const total = allVehicles.length;

    const pending = allVehicles.filter(
        (vehicle) => vehicle.adminApproval === "pending"
    ).length;

    const approved = allVehicles.filter(
        (vehicle) => vehicle.adminApproval === "approved"
    ).length;

    const rejected = allVehicles.filter(
        (vehicle) => vehicle.adminApproval === "rejected"
    ).length;

    setText("totalVehicles", total);
    setText("pendingVehicles", pending);
    setText("approvedVehicles", approved);
    setText("rejectedVehicles", rejected);

    const sidebarBadge =
        document.getElementById("sidebarVehiclePendingBadge");

    if (sidebarBadge) {
        sidebarBadge.textContent = pending;
        sidebarBadge.style.display = pending > 0 ? "inline-flex" : "none";
    }
}


function applyVehicleFilters() {

    const searchValue =
        (document.getElementById("vehicleSearch")?.value || "")
            .trim()
            .toLowerCase();

    const approvalValue =
        document.getElementById("vehicleApprovalFilter")?.value || "";

    let filtered = [...allVehicles];

    if (approvalValue) {
        filtered = filtered.filter(
            (vehicle) => vehicle.adminApproval === approvalValue
        );
    }

    if (searchValue) {
        filtered = filtered.filter((vehicle) => {

            const partner = vehicle.partner || {};

            const partnerName =
                `${partner.firstName || ""} ${partner.lastName || ""}`.toLowerCase();

            return (
                (vehicle.vehicleName || "").toLowerCase().includes(searchValue) ||
                (vehicle.vehicleNumber || "").toLowerCase().includes(searchValue) ||
                partnerName.includes(searchValue) ||
                (partner.email || "").toLowerCase().includes(searchValue)
            );
        });
    }

    renderVehicles(filtered);
}


function renderVehicles(vehicles) {

    const tbody = document.getElementById("vehiclesTableBody");
    const emptyState = document.getElementById("vehiclesEmpty");
    const tableContainer = document.getElementById("vehiclesTableContainer");

    if (!tbody) return;

    if (!vehicles.length) {
        tbody.innerHTML = "";
        tableContainer.style.display = "none";
        emptyState.style.display = "block";
        return;
    }

    tableContainer.style.display = "block";
    emptyState.style.display = "none";

    tbody.innerHTML = vehicles.map(renderVehicleRow).join("");

    tbody.querySelectorAll("[data-approve-id]").forEach((button) => {
        button.addEventListener("click", () =>
            handleVehicleAction(button.getAttribute("data-approve-id"), "approve")
        );
    });

    tbody.querySelectorAll("[data-reject-id]").forEach((button) => {
        button.addEventListener("click", () =>
            handleVehicleAction(button.getAttribute("data-reject-id"), "reject")
        );
    });
}


function renderVehicleRow(vehicle) {

    const partner = vehicle.partner || {};

    const partnerName =
        `${partner.firstName || ""} ${partner.lastName || ""}`.trim() ||
        "Unknown";

    const approval = vehicle.adminApproval || "pending";
    const status = vehicle.vehicleStatus || "pending";

    return `
        <tr>
            <td>
                <strong>${escapeHTML(vehicle.vehicleName)}</strong>
                <div class="text-muted small">
                    ${escapeHTML(vehicle.vehicleNumber || "")}
                </div>
            </td>
            <td>
                <div>${escapeHTML(partnerName)}</div>
                <div class="text-muted small">
                    ${escapeHTML(partner.email || "")}
                </div>
            </td>
            <td>${escapeHTML(capitalize(vehicle.vehicleType || "-"))}</td>
            <td>${formatCurrency(vehicle.pricePerKm || 0)}</td>
            <td>
                <span class="admin-status ${getStatusClass(approval)}">
                    ${escapeHTML(capitalize(approval))}
                </span>
            </td>
            <td>
                <span class="admin-status ${getStatusClass(status)}">
                    ${escapeHTML(capitalize(status))}
                </span>
            </td>
            <td class="text-end">
                ${
                    approval !== "approved"
                        ? `<button
                            type="button"
                            class="admin-success-btn"
                            data-approve-id="${escapeHTML(vehicle._id)}"
                        >
                            <i class="bi bi-check-lg"></i>
                        </button>`
                        : ""
                }
                ${
                    approval !== "rejected"
                        ? `<button
                            type="button"
                            class="admin-danger-btn"
                            data-reject-id="${escapeHTML(vehicle._id)}"
                        >
                            <i class="bi bi-x-lg"></i>
                        </button>`
                        : ""
                }
            </td>
        </tr>
    `;
}


async function handleVehicleAction(vehicleId, action) {

    const vehicle = allVehicles.find((item) => item._id === vehicleId);

    if (!vehicle) return;

    const confirmed = confirm(
        action === "approve"
            ? `Approve "${vehicle.vehicleName}" and make it live?`
            : `Reject "${vehicle.vehicleName}"'s listing?`
    );

    if (!confirmed) return;

    try {

        const endpoint =
            action === "approve"
                ? `/api/admin/vehicles/${vehicleId}/approve`
                : `/api/admin/vehicles/${vehicleId}/reject`;

        await adminFetch(endpoint, { method: "PUT" });

        await loadVehicles();

    } catch (error) {

        console.error("Vehicle action error:", error);
        alert(error.message || "Unable to update this vehicle.");
    }
}


// =========================================================
// HELPERS (local to this page - matches admin/js/partners.js)
// =========================================================

function showLoading(show) {
    const loading = document.getElementById("vehiclesLoading");
    if (loading) {
        loading.style.display = show ? "flex" : "none";
    }
}

function showError(message) {
    const errorElement = document.getElementById("vehiclesError");
    if (!errorElement) return;
    errorElement.textContent = message;
    errorElement.style.display = "block";
}

function hideError() {
    const errorElement = document.getElementById("vehiclesError");
    if (errorElement) {
        errorElement.style.display = "none";
    }
}

function capitalize(value) {
    if (!value) return "-";
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent =
            value === undefined || value === null || value === ""
                ? "-"
                : value;
    }
}
