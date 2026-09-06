// =====================================================
// TRIPZOVA PARTNER - EARNINGS
// (derived from /api/bookings/partner - no separate
//  earnings/payouts endpoint exists on the backend yet)
// =====================================================

(function () {
    "use strict";

    let allBookings = [];


    async function loadEarnings() {

        showLoading(true);
        hideError();

        try {

            const data = await partnerFetch("/api/bookings/partner");

            allBookings =
                Array.isArray(data.bookings) ? data.bookings : [];

            renderSummary();
            renderChart();
            renderTable();

        } catch (error) {

            console.error("Load earnings error:", error);

            showError(
                error.message || "Unable to load your earnings."
            );

        } finally {

            showLoading(false);
        }
    }


    function renderSummary() {

        const earningBookings = allBookings.filter((b) =>
            ["confirmed", "completed"].includes(b.bookingStatus)
        );

        const total = earningBookings.reduce(
            (sum, b) => sum + Number(b.amount || 0), 0
        );

        const now = new Date();

        const thisMonth = earningBookings
            .filter((b) => {
                const d = new Date(b.createdAt);
                return (
                    d.getFullYear() === now.getFullYear() &&
                    d.getMonth() === now.getMonth()
                );
            })
            .reduce((sum, b) => sum + Number(b.amount || 0), 0);

        const pending = allBookings
            .filter((b) => b.bookingStatus === "confirmed")
            .reduce((sum, b) => sum + Number(b.amount || 0), 0);

        const completedCount = allBookings.filter(
            (b) => b.bookingStatus === "completed"
        ).length;

        setText("earningsTotal", formatCurrency(total));
        setText("earningsThisMonth", formatCurrency(thisMonth));
        setText("earningsPending", formatCurrency(pending));
        setText("earningsTripCount", completedCount);
    }


    function renderChart() {

        const now = new Date();
        const months = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key: `${d.getFullYear()}-${d.getMonth()}`,
                label: d.toLocaleDateString("en-IN", { month: "short" }),
                total: 0
            });
        }

        allBookings
            .filter((b) => ["confirmed", "completed"].includes(b.bookingStatus))
            .forEach((b) => {
                const d = new Date(b.createdAt);
                if (Number.isNaN(d.getTime())) return;

                const key = `${d.getFullYear()}-${d.getMonth()}`;
                const bucket = months.find((m) => m.key === key);

                if (bucket) {
                    bucket.total += Number(b.amount || 0);
                }
            });

        const maxValue = Math.max(...months.map((m) => m.total), 1);
        const container = document.getElementById("earningsChart");

        if (!container) return;

        container.innerHTML = months.map((m) => {
            const heightPercent = Math.max((m.total / maxValue) * 100, 2);

            return `
                <div class="report-bar-col">
                    <span class="report-bar-value">
                        ${m.total > 0 ? formatCurrency(m.total) : ""}
                    </span>
                    <div class="report-bar" style="height:${heightPercent}%;"></div>
                    <span class="report-bar-label">${escapeHTML(m.label)}</span>
                </div>
            `;
        }).join("");
    }


    function renderTable() {

        const earningBookings = allBookings
            .filter((b) => ["confirmed", "completed"].includes(b.bookingStatus))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const tableCard = document.getElementById("earningsTableCard");
        const emptyState = document.getElementById("earningsEmpty");
        const tbody = document.getElementById("earningsTableBody");

        if (!earningBookings.length) {
            tableCard.style.display = "none";
            emptyState.style.display = "block";
            return;
        }

        tableCard.style.display = "block";
        emptyState.style.display = "none";

        setText(
            "earningsResultText",
            `${earningBookings.length} earning booking${earningBookings.length !== 1 ? "s" : ""}`
        );

        tbody.innerHTML = earningBookings.map((booking) => {

            const customer = booking.customer || {};

            const customerName =
                `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "-";

            return `
                <tr>
                    <td>#${escapeHTML(booking.bookingNumber || "")}</td>
                    <td>${escapeHTML(customerName)}</td>
                    <td>${formatDate(booking.createdAt)}</td>
                    <td>
                        <span class="partner-status ${getStatusClass(booking.bookingStatus)}">
                            ${escapeHTML(formatStatus(booking.bookingStatus))}
                        </span>
                    </td>
                    <td>${formatCurrency(booking.amount || 0)}</td>
                </tr>
            `;
        }).join("");
    }


    // =================================================
    // HELPERS
    // =================================================

    function showLoading(isLoading) {
        const el = document.getElementById("earningsLoading");
        if (el) el.style.display = isLoading ? "block" : "none";
    }

    function showError(message) {
        const el = document.getElementById("earningsError");
        if (el) {
            el.style.display = "block";
            el.className = "partner-alert partner-alert-danger mb-4";
            el.textContent = message;
        }
    }

    function hideError() {
        const el = document.getElementById("earningsError");
        if (el) el.style.display = "none";
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

        loadEarnings();
    });

})();
