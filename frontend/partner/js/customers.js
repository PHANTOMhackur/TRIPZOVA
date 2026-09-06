// =====================================================
// TRIPZOVA PARTNER - CUSTOMERS
// (derived from /api/bookings/partner - no separate
//  "customers" endpoint exists on the backend yet)
// =====================================================

(function () {
    "use strict";


    let customerRows = [];


    // =================================================
    // LOAD
    // =================================================

    async function loadCustomers() {

        showLoading(true);
        hideError();

        try {

            const data =
                await partnerFetch("/api/bookings/partner");

            const bookings =
                Array.isArray(data.bookings)
                    ? data.bookings
                    : [];

            customerRows = buildCustomerRows(bookings);

            updateStats(bookings, customerRows);
            renderTable(customerRows);

        } catch (error) {

            console.error("Load customers error:", error);

            showError(
                error.message || "Unable to load your customers."
            );

        } finally {

            showLoading(false);
        }
    }


    // =================================================
    // DERIVE UNIQUE CUSTOMERS FROM BOOKINGS
    // =================================================

    function buildCustomerRows(bookings) {

        const byCustomer = new Map();

        bookings.forEach((booking) => {

            const customer = booking.customer;

            if (!customer || !customer._id) {
                return;
            }

            const id = customer._id;

            if (!byCustomer.has(id)) {

                byCustomer.set(id, {
                    id,
                    name:
                        `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                        "Customer",
                    email: customer.email || "",
                    phone: customer.phone || "",
                    city: customer.city || "",
                    bookingCount: 0,
                    totalSpent: 0,
                    lastBookingDate: null
                });
            }

            const row = byCustomer.get(id);

            row.bookingCount += 1;

            // Only count confirmed/completed revenue toward spend.
            if (
                booking.bookingStatus === "confirmed" ||
                booking.bookingStatus === "completed"
            ) {
                row.totalSpent += Number(booking.amount || 0);
            }

            const bookingDate = new Date(booking.createdAt);

            if (
                !row.lastBookingDate ||
                bookingDate > row.lastBookingDate
            ) {
                row.lastBookingDate = bookingDate;
            }
        });

        return Array.from(byCustomer.values()).sort(
            (a, b) => (b.lastBookingDate || 0) - (a.lastBookingDate || 0)
        );
    }


    // =================================================
    // STATS
    // =================================================

    function updateStats(bookings, customers) {

        const totalRevenue = customers.reduce(
            (sum, customer) => sum + customer.totalSpent,
            0
        );

        setText("customerTotalCount", customers.length);
        setText("customerBookingCount", bookings.length);
        setText("customerRevenueTotal", formatCurrency(totalRevenue));
    }


    // =================================================
    // RENDER
    // =================================================

    function renderTable(rows) {

        const wrapper = document.getElementById("customersTableWrapper");
        const emptyState = document.getElementById("customersEmpty");
        const tbody = document.getElementById("customersTableBody");
        const resultText = document.getElementById("customerResultText");

        if (!rows.length) {
            wrapper.style.display = "none";
            emptyState.style.display = "block";
            setText("customerResultText", "No customers yet.");
            return;
        }

        wrapper.style.display = "block";
        emptyState.style.display = "none";

        setText(
            "customerResultText",
            `${rows.length} customer${rows.length !== 1 ? "s" : ""} found`
        );

        tbody.innerHTML = rows.map((row) => `
            <tr>
                <td>
                    <div class="partner-booking-customer">
                        <div class="partner-table-avatar">
                            ${escapeHTML(getInitials(row.name))}
                        </div>
                        <div>
                            <strong>${escapeHTML(row.name)}</strong>
                        </div>
                    </div>
                </td>
                <td>
                    <div>${escapeHTML(row.email)}</div>
                    <small>${escapeHTML(row.phone)}</small>
                </td>
                <td>${escapeHTML(row.city || "-")}</td>
                <td>${Number(row.bookingCount)}</td>
                <td>${formatCurrency(row.totalSpent)}</td>
                <td>
                    ${
                        row.lastBookingDate
                            ? row.lastBookingDate.toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                            })
                            : "-"
                    }
                </td>
            </tr>
        `).join("");
    }


    // =================================================
    // SEARCH FILTER
    // =================================================

    function applySearch() {

        const query =
            (document.getElementById("customerSearch")?.value || "")
                .trim()
                .toLowerCase();

        if (!query) {
            renderTable(customerRows);
            return;
        }

        const filtered = customerRows.filter((row) =>
            row.name.toLowerCase().includes(query) ||
            row.email.toLowerCase().includes(query) ||
            row.phone.toLowerCase().includes(query)
        );

        renderTable(filtered);
    }


    // =================================================
    // HELPERS
    // =================================================

    function showLoading(isLoading) {
        const loadingEl = document.getElementById("customersLoading");
        const wrapper = document.getElementById("customersTableWrapper");

        if (loadingEl) {
            loadingEl.style.display = isLoading ? "flex" : "none";
        }

        if (isLoading && wrapper) {
            wrapper.style.display = "none";
        }
    }

    function showError(message) {
        const errorEl = document.getElementById("customersError");
        if (errorEl) {
            errorEl.style.display = "block";
            errorEl.className = "partner-alert partner-alert-danger mb-4";
            errorEl.textContent = message;
        }
    }

    function hideError() {
        const errorEl = document.getElementById("customersError");
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

        loadCustomers();

        const searchInput = document.getElementById("customerSearch");

        if (searchInput) {
            searchInput.addEventListener("input", applySearch);
        }
    });

})();
