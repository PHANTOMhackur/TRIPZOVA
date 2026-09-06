(function () {
    "use strict";

    /* =====================================================
       AUTH GUARD

       This page is for customers only. If someone is not
       logged in, or is logged in as a partner/admin, they
       get redirected to the right place instead of seeing
       a broken/irrelevant dashboard. Real enforcement still
       happens on the server (every request below carries
       the JWT and the API re-checks it) - this is just so
       people don't land on the wrong screen by typing a URL.
    ===================================================== */

    function getToken() {
        return localStorage.getItem("tripzovaToken");
    }

    function getStoredUser() {
        try {
            const raw = localStorage.getItem("tripzovaUser");
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error("Unable to read stored user:", error);
            return null;
        }
    }

    const token = getToken();
    const storedUser = getStoredUser();

    if (!token) {
        const returnTo = encodeURIComponent(
            window.location.pathname + window.location.search
        );
        window.location.replace(`login.html?redirect=${returnTo}`);
        return;
    }

    if (storedUser && storedUser.role === "admin") {
        window.location.replace("/admin/");
        return;
    }

    if (storedUser && storedUser.role === "partner") {
        window.location.replace("/partner/");
        return;
    }


    /* =====================================================
       API HELPER
    ===================================================== */

    async function customerFetch(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        let data = {};
        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (response.status === 401) {
            // Token expired/invalid - send back to login.
            localStorage.removeItem("tripzovaToken");
            localStorage.removeItem("tripzovaUser");

            const returnTo = encodeURIComponent(
                window.location.pathname + window.location.search
            );
            window.location.replace(`login.html?redirect=${returnTo}`);
            throw new Error("Session expired.");
        }

        if (!response.ok) {
            throw new Error(data.message || "Request failed.");
        }

        return data;
    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(Number(value || 0));
    }

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function formatStatus(value) {
        if (!value) return "Unknown";
        return String(value)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }


    /* =====================================================
       GREETING
    ===================================================== */

    function renderGreeting() {
        const greetingEl = document.getElementById("dashGreeting");
        if (!greetingEl || !storedUser) return;

        const name =
            storedUser.firstName ||
            storedUser.name ||
            storedUser.email ||
            "there";

        greetingEl.textContent = `Welcome back, ${name}`;
    }


    /* =====================================================
       LOAD BOOKINGS
    ===================================================== */

    let allBookings = [];

    async function loadBookings() {
        const loadingEl = document.getElementById("dashLoading");
        const errorEl = document.getElementById("dashError");
        const emptyEl = document.getElementById("dashEmpty");
        const listEl = document.getElementById("dashBookingsList");

        loadingEl.style.display = "block";
        errorEl.style.display = "none";
        emptyEl.style.display = "none";
        listEl.innerHTML = "";

        try {
            const data = await customerFetch("/api/bookings/my");

            allBookings = Array.isArray(data.bookings) ? data.bookings : [];

            loadingEl.style.display = "none";

            renderStats();

            if (!allBookings.length) {
                emptyEl.style.display = "block";
                return;
            }

            listEl.innerHTML = allBookings.map(renderBookingCard).join("");

            listEl.querySelectorAll("[data-cancel-id]").forEach((button) => {
                button.addEventListener("click", () => {
                    cancelBooking(button.getAttribute("data-cancel-id"), button);
                });
            });

        } catch (error) {
            console.error("Load bookings error:", error);
            loadingEl.style.display = "none";
            errorEl.style.display = "block";
            errorEl.textContent = error.message || "Unable to load your bookings.";
        }
    }

    function renderStats() {
        const total = allBookings.length;

        const now = new Date();

        const upcoming = allBookings.filter((booking) => {
            const isActiveStatus =
                booking.bookingStatus === "pending" ||
                booking.bookingStatus === "confirmed";
            const travelDate = new Date(booking.travelDate);
            return isActiveStatus && travelDate >= now;
        }).length;

        const completed = allBookings.filter(
            (booking) => booking.bookingStatus === "completed"
        ).length;

        document.getElementById("dashStatTotal").textContent = total;
        document.getElementById("dashStatUpcoming").textContent = upcoming;
        document.getElementById("dashStatCompleted").textContent = completed;
    }

    function renderBookingCard(booking) {
        const vehicle = booking.vehicle || {};
        const partner = booking.partner || {};

        const vehicleName =
            vehicle.vehicleName ||
            [vehicle.brand, vehicle.model].filter(Boolean).join(" ") ||
            booking.serviceName ||
            "Ride";

        const partnerName =
            `${partner.firstName || ""} ${partner.lastName || ""}`.trim() ||
            "TRIPZOVA Partner";

        const status = booking.bookingStatus || "pending";

        const canCancel = ["pending", "confirmed"].includes(status);

        return `
            <article class="dash-booking-card">

                <div class="dash-booking-main">

                    <strong>${escapeHTML(vehicleName)}</strong>

                    <div class="dash-booking-route">
                        ${escapeHTML(booking.pickup || "")}
                        ${booking.pickup && booking.drop ? " → " : ""}
                        ${escapeHTML(booking.drop || "")}
                    </div>

                    <div class="dash-booking-meta">
                        <span>📅 ${formatDate(booking.travelDate)}</span>
                        <span>🕐 ${escapeHTML(booking.pickupTime || "")}</span>
                        <span>👥 ${Number(booking.guests || 1)} guest(s)</span>
                        <span>🤝 ${escapeHTML(partnerName)}</span>
                        <span>#${escapeHTML(booking.bookingNumber || "")}</span>
                    </div>

                </div>

                <div class="dash-booking-side">

                    <span class="dash-status dash-status-${escapeHTML(status)}">
                        ${escapeHTML(formatStatus(status))}
                    </span>

                    <strong>${formatCurrency(booking.amount)}</strong>

                    ${
                        canCancel
                            ? `<button
                                type="button"
                                class="dash-cancel-btn"
                                data-cancel-id="${escapeHTML(booking._id)}"
                            >
                                Cancel
                            </button>`
                            : ""
                    }

                </div>

            </article>
        `;
    }


    /* =====================================================
       CANCEL BOOKING
    ===================================================== */

    async function cancelBooking(bookingId, button) {
        if (!bookingId) return;

        const confirmed = window.confirm(
            "Are you sure you want to cancel this booking?"
        );

        if (!confirmed) return;

        button.disabled = true;
        button.textContent = "Cancelling...";

        try {
            await customerFetch(`/api/bookings/${bookingId}/cancel`, {
                method: "PUT",
                body: JSON.stringify({ reason: "Cancelled by customer" })
            });

            await loadBookings();

        } catch (error) {
            console.error("Cancel booking error:", error);
            alert(error.message || "Unable to cancel this booking.");
            button.disabled = false;
            button.textContent = "Cancel";
        }
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    function initLogout() {
        const logoutButton = document.getElementById("dashLogoutBtn");
        if (!logoutButton) return;

        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("tripzovaToken");
            localStorage.removeItem("tripzovaUser");
            window.location.href = "/user/";
        });
    }


    /* =====================================================
       INIT
    ===================================================== */

    document.addEventListener("DOMContentLoaded", () => {
        renderGreeting();
        initLogout();
        loadBookings();
    });

})();
