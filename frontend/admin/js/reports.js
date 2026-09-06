// =====================================================
// TRIPZOVA ADMIN - REPORTS
// (analytics derived client-side from /api/admin/bookings -
//  there's no separate analytics/aggregation endpoint yet)
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();

    loadReports();

    document.getElementById("refreshReportsBtn")
        ?.addEventListener("click", loadReports);
});


async function loadReports() {

    showLoading(true);
    hideError();

    try {

        const data = await adminFetch("/api/admin/bookings");

        const bookings =
            Array.isArray(data.bookings) ? data.bookings : [];

        renderSummary(bookings);
        renderRevenueByMonth(bookings);
        renderStatusBreakdown(bookings);
        renderServiceSplit(bookings);
        renderTopPartners(bookings);

        document.getElementById("reportsBody").style.display = "block";

    } catch (error) {

        console.error("Load reports error:", error);
        showError(error.message || "Unable to load reports.");

    } finally {

        showLoading(false);
    }
}


// =========================================================
// SUMMARY
// =========================================================

function renderSummary(bookings) {

    const total = bookings.length;

    const revenueBookings = bookings.filter((b) =>
        ["confirmed", "completed"].includes(b.bookingStatus)
    );

    const totalRevenue = revenueBookings.reduce(
        (sum, b) => sum + Number(b.amount || 0), 0
    );

    const avgValue = total ? totalRevenue / (revenueBookings.length || 1) : 0;

    const completed = bookings.filter(
        (b) => b.bookingStatus === "completed"
    ).length;

    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    setText("reportTotalBookings", total);
    setText("reportTotalRevenue", formatCurrency(totalRevenue));
    setText("reportAvgValue", formatCurrency(avgValue));
    setText("reportCompletionRate", `${completionRate}%`);
}


// =========================================================
// REVENUE BY MONTH (last 6 months)
// =========================================================

function renderRevenueByMonth(bookings) {

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

    bookings
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

    const container = document.getElementById("revenueChart");

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


// =========================================================
// STATUS BREAKDOWN
// =========================================================

function renderStatusBreakdown(bookings) {

    const statuses = ["pending", "confirmed", "completed", "cancelled", "rejected"];

    const counts = statuses.map((status) => ({
        status,
        count: bookings.filter((b) => b.bookingStatus === status).length
    }));

    const maxCount = Math.max(...counts.map((c) => c.count), 1);

    const container = document.getElementById("statusBreakdown");

    if (!container) return;

    container.innerHTML = counts.map((c) => `
        <div class="report-status-row">
            <span class="report-status-label">${capitalize(c.status)}</span>
            <div class="report-status-track">
                <div class="report-status-fill" style="width:${(c.count / maxCount) * 100}%;"></div>
            </div>
            <span class="report-status-count">${c.count}</span>
        </div>
    `).join("");
}


// =========================================================
// SERVICE SPLIT (rides vs tours)
// =========================================================

function renderServiceSplit(bookings) {

    const rides = bookings.filter((b) => b.serviceType === "ride").length;
    const tours = bookings.filter((b) => b.serviceType === "tour").length;
    const maxCount = Math.max(rides, tours, 1);

    const container = document.getElementById("serviceSplit");

    if (!container) return;

    container.innerHTML = `
        <div class="report-status-row">
            <span class="report-status-label">Rides</span>
            <div class="report-status-track">
                <div class="report-status-fill" style="width:${(rides / maxCount) * 100}%;"></div>
            </div>
            <span class="report-status-count">${rides}</span>
        </div>
        <div class="report-status-row">
            <span class="report-status-label">Tours</span>
            <div class="report-status-track">
                <div class="report-status-fill" style="width:${(tours / maxCount) * 100}%;"></div>
            </div>
            <span class="report-status-count">${tours}</span>
        </div>
    `;
}


// =========================================================
// TOP PARTNERS BY REVENUE
// =========================================================

function renderTopPartners(bookings) {

    const byPartner = new Map();

    bookings
        .filter((b) => ["confirmed", "completed"].includes(b.bookingStatus))
        .forEach((b) => {

            const partner = b.partner;
            if (!partner || !partner._id) return;

            if (!byPartner.has(partner._id)) {
                byPartner.set(partner._id, {
                    name: `${partner.firstName || ""} ${partner.lastName || ""}`.trim() || "Partner",
                    bookings: 0,
                    revenue: 0
                });
            }

            const entry = byPartner.get(partner._id);
            entry.bookings += 1;
            entry.revenue += Number(b.amount || 0);
        });

    const topPartners = Array.from(byPartner.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

    const tbody = document.getElementById("topPartnersBody");

    if (!tbody) return;

    if (!topPartners.length) {
        tbody.innerHTML = `
            <tr><td colspan="3" class="text-center text-muted py-3">No revenue yet.</td></tr>
        `;
        return;
    }

    tbody.innerHTML = topPartners.map((p) => `
        <tr>
            <td>${escapeHTML(p.name)}</td>
            <td>${p.bookings}</td>
            <td>${formatCurrency(p.revenue)}</td>
        </tr>
    `).join("");
}


// =========================================================
// HELPERS
// =========================================================

function showLoading(show) {
    const el = document.getElementById("reportsLoading");
    if (el) el.style.display = show ? "flex" : "none";
}

function showError(message) {
    const el = document.getElementById("reportsError");
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
}

function hideError() {
    const el = document.getElementById("reportsError");
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
