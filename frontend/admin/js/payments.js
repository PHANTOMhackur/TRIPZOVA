// =====================================================
// TRIPZOVA ADMIN - PAYMENTS
// (a ledger view derived from /api/admin/bookings -
//  there's no separate payments/transactions table yet,
//  Booking already carries amount/paymentMethod/paymentStatus)
// =====================================================

let allPaymentBookings = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();

    loadPayments();

    document.getElementById("paymentSearch")
        ?.addEventListener("input", applyPaymentFilters);

    document.getElementById("paymentStatusFilter")
        ?.addEventListener("change", applyPaymentFilters);

    document.getElementById("refreshPaymentsBtn")
        ?.addEventListener("click", loadPayments);
});


async function loadPayments() {

    showLoading(true);
    hideError();

    try {

        const data = await adminFetch("/api/admin/bookings");

        allPaymentBookings =
            Array.isArray(data.bookings) ? data.bookings : [];

        updatePaymentStats();
        applyPaymentFilters();

    } catch (error) {

        console.error("Load payments error:", error);
        showError(error.message || "Unable to load payments.");

    } finally {

        showLoading(false);
    }
}


function updatePaymentStats() {

    const total = allPaymentBookings.length;

    const paid = allPaymentBookings.filter(
        (b) => b.paymentStatus === "paid"
    ).length;

    const pending = allPaymentBookings.filter(
        (b) => b.paymentStatus === "pending"
    ).length;

    const collected = allPaymentBookings
        .filter((b) => b.paymentStatus === "paid")
        .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    setText("totalPayments", total);
    setText("paidPayments", paid);
    setText("pendingPayments", pending);
    setText("paymentsRevenue", formatCurrency(collected));
}


function applyPaymentFilters() {

    const query =
        (document.getElementById("paymentSearch")?.value || "")
            .trim().toLowerCase();

    const paymentStatus =
        document.getElementById("paymentStatusFilter")?.value || "";

    let filtered = [...allPaymentBookings];

    if (paymentStatus) {
        filtered = filtered.filter((b) => b.paymentStatus === paymentStatus);
    }

    if (query) {
        filtered = filtered.filter((b) => {
            const customer = b.customer || {};
            const customerName =
                `${customer.firstName || ""} ${customer.lastName || ""}`.toLowerCase();

            return (
                (b.bookingNumber || "").toLowerCase().includes(query) ||
                customerName.includes(query)
            );
        });
    }

    renderPayments(filtered);
}


function renderPayments(bookings) {

    const tbody = document.getElementById("paymentsTableBody");
    const emptyState = document.getElementById("paymentsEmpty");
    const container = document.getElementById("paymentsTableContainer");

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

        const customerName =
            `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "-";

        return `
            <tr>
                <td>#${escapeHTML(booking.bookingNumber || "")}</td>
                <td>${escapeHTML(customerName)}</td>
                <td>${formatCurrency(booking.amount || 0)}</td>
                <td>${escapeHTML(capitalize(booking.paymentMethod || "-"))}</td>
                <td>
                    <span class="admin-status ${getStatusClass(booking.paymentStatus)}">
                        ${escapeHTML(capitalize(booking.paymentStatus || "-"))}
                    </span>
                </td>
                <td>
                    <span class="admin-status ${getStatusClass(booking.bookingStatus)}">
                        ${escapeHTML(capitalize(booking.bookingStatus || "-"))}
                    </span>
                </td>
                <td>${formatDate(booking.createdAt)}</td>
            </tr>
        `;
    }).join("");
}


// =========================================================
// HELPERS
// =========================================================

function showLoading(show) {
    const el = document.getElementById("paymentsLoading");
    if (el) el.style.display = show ? "flex" : "none";
}

function showError(message) {
    const el = document.getElementById("paymentsError");
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
}

function hideError() {
    const el = document.getElementById("paymentsError");
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
