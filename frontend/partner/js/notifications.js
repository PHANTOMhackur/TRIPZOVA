// =====================================================
// TRIPZOVA PARTNER - NOTIFICATIONS
// (an activity feed derived from /api/bookings/partner -
//  there's no push/real-time notification system on the
//  backend yet, so this reflects recent booking changes
//  rather than live events)
// =====================================================

(function () {
    "use strict";


    async function loadNotifications() {

        showLoading(true);
        hideError();

        try {

            const data = await partnerFetch("/api/bookings/partner");

            const bookings =
                Array.isArray(data.bookings) ? data.bookings : [];

            const notifications = buildNotifications(bookings);

            renderNotifications(notifications);

        } catch (error) {

            console.error("Load notifications error:", error);

            showError(
                error.message || "Unable to load notifications."
            );

        } finally {

            showLoading(false);
        }
    }


    function buildNotifications(bookings) {

        // Most recently created/updated bookings first,
        // turned into a simple readable activity feed.
        return [...bookings]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 25)
            .map((booking) => {

                const customer = booking.customer || {};

                const customerName =
                    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                    "A customer";

                let icon = "bi-calendar-plus";
                let text = `${customerName} made a new booking request (#${booking.bookingNumber || ""}).`;

                if (booking.bookingStatus === "confirmed") {
                    icon = "bi-check-circle";
                    text = `Booking #${booking.bookingNumber || ""} was confirmed.`;
                } else if (booking.bookingStatus === "completed") {
                    icon = "bi-flag";
                    text = `Booking #${booking.bookingNumber || ""} was marked completed.`;
                } else if (booking.bookingStatus === "cancelled") {
                    icon = "bi-x-circle";
                    text = `Booking #${booking.bookingNumber || ""} was cancelled.`;
                } else if (booking.bookingStatus === "rejected") {
                    icon = "bi-slash-circle";
                    text = `Booking #${booking.bookingNumber || ""} was rejected.`;
                }

                return {
                    icon,
                    text,
                    date: booking.createdAt
                };
            });
    }


    function renderNotifications(notifications) {

        const card = document.getElementById("notificationsCard");
        const emptyState = document.getElementById("notificationsEmpty");
        const list = document.getElementById("notificationsList");

        if (!notifications.length) {
            card.style.display = "none";
            emptyState.style.display = "block";
            return;
        }

        card.style.display = "block";
        emptyState.style.display = "none";

        list.innerHTML = notifications.map((item) => `
            <div class="notification-item">
                <div class="notification-icon">
                    <i class="bi ${item.icon}"></i>
                </div>
                <div class="notification-body">
                    <p>${escapeHTML(item.text)}</p>
                    <small>${formatDate(item.date)}</small>
                </div>
            </div>
        `).join("");
    }


    // =================================================
    // HELPERS
    // =================================================

    function showLoading(isLoading) {
        const el = document.getElementById("notificationsLoading");
        if (el) el.style.display = isLoading ? "block" : "none";
    }

    function showError(message) {
        const el = document.getElementById("notificationsError");
        if (el) {
            el.style.display = "block";
            el.className = "partner-alert partner-alert-danger mb-4";
            el.textContent = message;
        }
    }

    function hideError() {
        const el = document.getElementById("notificationsError");
        if (el) el.style.display = "none";
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
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

        loadNotifications();
    });

})();
