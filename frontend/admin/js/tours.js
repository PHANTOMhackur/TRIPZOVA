// =====================================================
// TRIPZOVA ADMIN - TOURS
// (bookings filtered to serviceType = "tour")
// =====================================================

let allTourBookings = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();

    loadTours();

    document.getElementById("tourSearch")
        ?.addEventListener("input", applyTourFilters);

    document.getElementById("tourStatusFilter")
        ?.addEventListener("change", applyTourFilters);

    document.getElementById("refreshToursBtn")
        ?.addEventListener("click", loadTours);
});


async function loadTours() {

    showLoading(true);
    hideError();

    try {

        const data =
            await adminFetch("/api/admin/bookings?serviceType=tour");

        allTourBookings =
            Array.isArray(data.bookings) ? data.bookings : [];

        updateTourStats();
        applyTourFilters();

    } catch (error) {

        console.error("Load tours error:", error);
        showError(error.message || "Unable to load tours.");

    } finally {

        showLoading(false);
    }
}


function updateTourStats() {

    const total = allTourBookings.length;

    const pending = allTourBookings.filter(
        (b) => b.bookingStatus === "pending"
    ).length;

    const completed = allTourBookings.filter(
        (b) => b.bookingStatus === "completed"
    ).length;

    const revenue = allTourBookings
        .filter((b) => ["confirmed", "completed"].includes(b.bookingStatus))
        .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    setText("totalTours", total);
    setText("pendingTours", pending);
    setText("completedTours", completed);
    setText("toursRevenue", formatCurrency(revenue));
}


function applyTourFilters() {

    const query =
        (document.getElementById("tourSearch")?.value || "")
            .trim().toLowerCase();

    const status =
        document.getElementById("tourStatusFilter")?.value || "";

    let filtered = [...allTourBookings];

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
                (b.serviceName || "").toLowerCase().includes(query)
            );
        });
    }

    renderTours(filtered);
}


function renderTours(bookings) {

    const tbody = document.getElementById("toursTableBody");
    const emptyState = document.getElementById("toursEmpty");
    const container = document.getElementById("toursTableContainer");

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
                <td>${escapeHTML(booking.serviceName || "-")}</td>
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
    const el = document.getElementById("toursLoading");
    if (el) el.style.display = show ? "flex" : "none";
}

function showError(message) {
    const el = document.getElementById("toursError");
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
}

function hideError() {
    const el = document.getElementById("toursError");
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
