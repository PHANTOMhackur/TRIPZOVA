// =====================================================
// TRIPZOVA ADMIN - RIDES
// (bookings filtered to serviceType = "ride")
// =====================================================

let allRideBookings = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();

    loadRides();

    document.getElementById("rideSearch")
        ?.addEventListener("input", applyRideFilters);

    document.getElementById("rideStatusFilter")
        ?.addEventListener("change", applyRideFilters);

    document.getElementById("refreshRidesBtn")
        ?.addEventListener("click", loadRides);
});


async function loadRides() {

    showLoading(true);
    hideError();

    try {

        const data =
            await adminFetch("/api/admin/bookings?serviceType=ride");

        allRideBookings =
            Array.isArray(data.bookings) ? data.bookings : [];

        updateRideStats();
        applyRideFilters();

    } catch (error) {

        console.error("Load rides error:", error);
        showError(error.message || "Unable to load rides.");

    } finally {

        showLoading(false);
    }
}


function updateRideStats() {

    const total = allRideBookings.length;

    const pending = allRideBookings.filter(
        (b) => b.bookingStatus === "pending"
    ).length;

    const completed = allRideBookings.filter(
        (b) => b.bookingStatus === "completed"
    ).length;

    const revenue = allRideBookings
        .filter((b) => ["confirmed", "completed"].includes(b.bookingStatus))
        .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    setText("totalRides", total);
    setText("pendingRides", pending);
    setText("completedRides", completed);
    setText("ridesRevenue", formatCurrency(revenue));
}


function applyRideFilters() {

    const query =
        (document.getElementById("rideSearch")?.value || "")
            .trim().toLowerCase();

    const status =
        document.getElementById("rideStatusFilter")?.value || "";

    let filtered = [...allRideBookings];

    if (status) {
        filtered = filtered.filter((b) => b.bookingStatus === status);
    }

    if (query) {
        filtered = filtered.filter((b) => {
            const customer = b.customer || {};
            const customerName =
                `${customer.firstName || ""} ${customer.lastName || ""}`.toLowerCase();

            return (
                (b.bookingNumber || "").toLowerCase().includes(query) ||
                customerName.includes(query) ||
                (b.pickup || "").toLowerCase().includes(query) ||
                (b.drop || "").toLowerCase().includes(query)
            );
        });
    }

    renderRides(filtered);
}


function renderRides(bookings) {

    const tbody = document.getElementById("ridesTableBody");
    const emptyState = document.getElementById("ridesEmpty");
    const container = document.getElementById("ridesTableContainer");

    if (!bookings.length) {
        tbody.innerHTML = "";
        container.style.display = "none";
        emptyState.style.display = "block";
        return;
    }

    container.style.display = "block";
    emptyState.style.display = "none";

    tbody.innerHTML = bookings.map((booking) => {

        const customer = booking.customer || {};
        const partner = booking.partner || {};

        const customerName =
            `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "-";

        const partnerName =
            `${partner.firstName || ""} ${partner.lastName || ""}`.trim() || "-";

        return `
            <tr>
                <td>#${escapeHTML(booking.bookingNumber || "")}</td>
                <td>${escapeHTML(customerName)}</td>
                <td>${escapeHTML(partnerName)}</td>
                <td>
                    ${escapeHTML(booking.pickup || "")}
                    ${booking.pickup && booking.drop ? " → " : ""}
                    ${escapeHTML(booking.drop || "")}
                </td>
                <td>${formatDate(booking.travelDate)}</td>
                <td>${formatCurrency(booking.amount || 0)}</td>
                <td>
                    <span class="admin-status ${getStatusClass(booking.bookingStatus)}">
                        ${escapeHTML(capitalize(booking.bookingStatus || "-"))}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}


// =========================================================
// HELPERS
// =========================================================

function showLoading(show) {
    const el = document.getElementById("ridesLoading");
    if (el) el.style.display = show ? "flex" : "none";
}

function showError(message) {
    const el = document.getElementById("ridesError");
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
}

function hideError() {
    const el = document.getElementById("ridesError");
    if (el) el.style.display = "none";
}

function capitalize(value) {
    if (!value) return "-";
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent =
            value === undefined || value === null || value === "" ? "-" : value;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}
