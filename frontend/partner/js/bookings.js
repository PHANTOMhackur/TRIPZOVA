// =====================================================
// TRIPZOVA PARTNER BOOKINGS
// =====================================================

(function () {
    "use strict";


    // =================================================
    // STATE
    // =================================================

    let allBookings = [];

    let currentFilter = "all";


    // =================================================
    // LOAD BOOKINGS
    // =================================================

    async function loadPartnerBookings() {

        try {

            showBookingsLoading();

            hideBookingsError();

            const response =
                await partnerFetch(
                    "/api/bookings/partner"
                );


            const data =
                response.data || response;


            if (
                Array.isArray(data)
            ) {

                allBookings = data;

            } else if (
                Array.isArray(data.bookings)
            ) {

                allBookings =
                    data.bookings;

            } else {

                allBookings = [];

            }


            updateBookingStats();

            updateBookingList();


            hideBookingsLoading();

        } catch (error) {

            console.error(
                "Partner bookings error:",
                error
            );


            hideBookingsLoading();

            showBookingsError(
                error.message ||
                "Unable to load bookings."
            );

        }
    }


    // =================================================
    // UPDATE STATISTICS
    // =================================================

    function updateBookingStats() {

        const pending =
            allBookings.filter(
                booking =>
                    booking.bookingStatus ===
                    "pending"
            ).length;


        const confirmed =
            allBookings.filter(
                booking =>
                    booking.bookingStatus ===
                    "confirmed"
            ).length;


        const completed =
            allBookings.filter(
                booking =>
                    booking.bookingStatus ===
                    "completed"
            ).length;


        setText(
            "bookingPendingCount",
            formatNumber(pending)
        );


        setText(
            "bookingConfirmedCount",
            formatNumber(confirmed)
        );


        setText(
            "bookingCompletedCount",
            formatNumber(completed)
        );


        setText(
            "bookingTotalCount",
            formatNumber(
                allBookings.length
            )
        );


        // Sidebar pending badge

        const badge =
            document.getElementById(
                "partnerPendingBookingBadge"
            );


        if (badge) {

            if (pending > 0) {

                badge.textContent =
                    pending;

                badge.style.display =
                    "inline-flex";

            } else {

                badge.style.display =
                    "none";
            }
        }
    }


    // =================================================
    // FILTER BOOKINGS
    // =================================================

    function getFilteredBookings() {

        if (
            currentFilter ===
            "all"
        ) {

            return allBookings;
        }


        return allBookings.filter(
            booking =>
                booking.bookingStatus ===
                currentFilter
        );
    }


    // =================================================
    // UPDATE BOOKING LIST
    // =================================================

    function updateBookingList() {

        const container =
            document.getElementById(
                "partnerBookingsList"
            );


        const empty =
            document.getElementById(
                "partnerBookingsEmpty"
            );


        const card =
            document.getElementById(
                "partnerBookingsCard"
            );


        const resultText =
            document.getElementById(
                "partnerBookingResultText"
            );


        if (!container) {
            return;
        }


        const bookings =
            getFilteredBookings();


        if (resultText) {

            resultText.textContent =
                `${bookings.length} booking${
                    bookings.length === 1
                        ? ""
                        : "s"
                } found`;
        }


        if (
            bookings.length === 0
        ) {

            container.innerHTML = "";


            if (card) {
                card.style.display =
                    "none";
            }


            if (empty) {
                empty.style.display =
                    "block";
            }


            return;
        }


        if (empty) {
            empty.style.display =
                "none";
        }


        if (card) {
            card.style.display =
                "block";
        }


        container.innerHTML =
            bookings
                .map(
                    renderBooking
                )
                .join("");
    }


    // =================================================
    // RENDER BOOKING
    // =================================================

    function renderBooking(
        booking
    ) {

        const customer =
            booking.customer || {};


        const customerName =
            `${customer.firstName || ""} ${
                customer.lastName || ""
            }`.trim() ||
            "Customer";


        const customerEmail =
            customer.email ||
            "";


        const travelDate =
            booking.travelDate
                ? new Date(
                    booking.travelDate
                ).toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                )
                : "-";


        const createdDate =
            booking.createdAt
                ? new Date(
                    booking.createdAt
                ).toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                )
                : "-";


        const status =
            booking.bookingStatus ||
            "pending";


        const amount =
            Number(
                booking.amount || 0
            );


        const guests =
            Number(
                booking.guests || 1
            );


        const serviceName =
            booking.serviceName ||
            "-";


        const serviceType =
            booking.serviceType ||
            "";


        return `
            <div
                class="partner-booking-row"
                data-booking-id="${escapeHTML(
                    String(
                        booking._id || ""
                    )
                )}"
            >

                <!-- CUSTOMER -->

                <div class="partner-booking-customer">

                    <div class="partner-table-avatar">
                        ${escapeHTML(
                            getInitials(
                                customerName
                            )
                        )}
                    </div>


                    <div>

                        <strong>
                            ${escapeHTML(
                                customerName
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                customerEmail ||
                                "Customer"
                            )}
                        </small>

                    </div>

                </div>


                <!-- SERVICE -->

                <div class="partner-booking-service">

                    <strong>
                        ${escapeHTML(
                            serviceName
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            formatStatus(
                                serviceType
                            )
                        )}
                    </small>

                </div>


                <!-- TRAVEL DATE -->

                <div class="partner-booking-date">

                    <strong>
                        ${escapeHTML(
                            travelDate
                        )}
                    </strong>

                    <small>
                        Booked ${escapeHTML(
                            createdDate
                        )}
                    </small>

                </div>


                <!-- GUESTS -->

                <div class="partner-booking-guests">

                    <strong>
                        ${guests}
                    </strong>

                    <small>
                        ${
                            guests === 1
                                ? "guest"
                                : "guests"
                        }
                    </small>

                </div>


                <!-- AMOUNT -->

                <div class="partner-booking-amount">

                    ${formatCurrency(
                        amount
                    )}

                </div>


                <!-- STATUS -->

                <div class="partner-booking-status">

                    <span
                        class="partner-status ${getStatusClass(
                            status
                        )}"
                    >
                        ${escapeHTML(
                            formatStatus(
                                status
                            )
                        )}
                    </span>

                </div>


                <!-- ACTIONS -->

                <div class="partner-booking-actions">

                    ${renderBookingActions(
                        booking
                    )}

                </div>

            </div>
        `;
    }


    // =================================================
    // BOOKING ACTIONS
    // =================================================

    function renderBookingActions(
        booking
    ) {

        const status =
            booking.bookingStatus;


        const bookingId =
            booking._id;


        if (!bookingId) {
            return "";
        }


        // Pending

        if (
            status ===
            "pending"
        ) {

            return `
                <button
                    type="button"
                    class="partner-btn partner-btn-sm partner-btn-primary"
                    onclick="acceptPartnerBooking('${escapeHTML(
                        String(bookingId)
                    )}')"
                >
                    <i class="bi bi-check-lg"></i>
                    Accept
                </button>


                <button
                    type="button"
                    class="partner-btn partner-btn-sm partner-btn-outline"
                    onclick="rejectPartnerBooking('${escapeHTML(
                        String(bookingId)
                    )}')"
                >
                    <i class="bi bi-x-lg"></i>
                    Reject
                </button>
            `;
        }


        // Confirmed

        if (
            status ===
            "confirmed"
        ) {

            return `
                <button
                    type="button"
                    class="partner-btn partner-btn-sm partner-btn-primary"
                    onclick="completePartnerBooking('${escapeHTML(
                        String(bookingId)
                    )}')"
                >
                    <i class="bi bi-check-circle"></i>
                    Complete
                </button>
            `;
        }


        // Completed

        if (
            status ===
            "completed"
        ) {

            return `
                <span class="partner-action-completed">
                    <i class="bi bi-check-circle-fill"></i>
                    Completed
                </span>
            `;
        }


        // Cancelled

        if (
            status ===
            "cancelled"
        ) {

            return `
                <span class="partner-action-muted">
                    Cancelled
                </span>
            `;
        }


        // Rejected

        if (
            status ===
            "rejected"
        ) {

            return `
                <span class="partner-action-muted">
                    Rejected
                </span>
            `;
        }


        return "";
    }


    // =================================================
    // ACCEPT BOOKING
    // =================================================

    async function acceptPartnerBooking(
        bookingId
    ) {

        if (!bookingId) {
            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to accept this booking?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setBookingActionLoading(
                bookingId,
                true
            );


            await partnerFetch(
                `/api/bookings/${bookingId}/accept`,
                {
                    method: "PUT"
                }
            );


            await loadPartnerBookings();


            showBookingMessage(
                "Booking accepted successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "Accept booking error:",
                error
            );


            showBookingMessage(
                error.message ||
                "Unable to accept booking.",
                "danger"
            );


            setBookingActionLoading(
                bookingId,
                false
            );
        }
    }


    // =================================================
    // REJECT BOOKING
    // =================================================

    async function rejectPartnerBooking(
        bookingId
    ) {

        if (!bookingId) {
            return;
        }


        const reason =
            window.prompt(
                "Why are you rejecting this booking?\n\nYou can leave this blank."
            );


        if (
            reason === null
        ) {

            return;
        }


        try {

            setBookingActionLoading(
                bookingId,
                true
            );


            await partnerFetch(
                `/api/bookings/${bookingId}/reject`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        reason:
                            reason.trim()
                    })
                }
            );


            await loadPartnerBookings();


            showBookingMessage(
                "Booking rejected.",
                "success"
            );


        } catch (error) {

            console.error(
                "Reject booking error:",
                error
            );


            showBookingMessage(
                error.message ||
                "Unable to reject booking.",
                "danger"
            );


            setBookingActionLoading(
                bookingId,
                false
            );
        }
    }


    // =================================================
    // COMPLETE BOOKING
    // =================================================

    async function completePartnerBooking(
        bookingId
    ) {

        if (!bookingId) {
            return;
        }


        const confirmed =
            window.confirm(
                "Mark this booking as completed?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setBookingActionLoading(
                bookingId,
                true
            );


            await partnerFetch(
                `/api/bookings/${bookingId}/complete`,
                {
                    method: "PUT"
                }
            );


            await loadPartnerBookings();


            showBookingMessage(
                "Booking marked as completed.",
                "success"
            );


        } catch (error) {

            console.error(
                "Complete booking error:",
                error
            );


            showBookingMessage(
                error.message ||
                "Unable to complete booking.",
                "danger"
            );


            setBookingActionLoading(
                bookingId,
                false
            );
        }
    }


    // =================================================
    // ACTION LOADING
    // =================================================

    function setBookingActionLoading(
        bookingId,
        loading
    ) {

        const row =
            document.querySelector(
                `[data-booking-id="${bookingId}"]`
            );


        if (!row) {
            return;
        }


        const buttons =
            row.querySelectorAll(
                "button"
            );


        buttons.forEach(
            button => {

                button.disabled =
                    loading;

            }
        );


        if (loading) {

            buttons.forEach(
                button => {

                    button.innerHTML =
                        `
                        <span
                            class="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                        ></span>
                        Processing...
                        `;

                }
            );
        }
    }


    // =================================================
    // FILTER BUTTONS
    // =================================================

    function initializeFilters() {

        const buttons =
            document.querySelectorAll(
                ".partner-filter-btn"
            );


        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        const status =
                            this.dataset.status ||
                            "all";


                        currentFilter =
                            status;


                        buttons.forEach(
                            item => {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                        this.classList.add(
                            "active"
                        );


                        updateBookingList();

                    }
                );

            }
        );
    }


    // =================================================
    // LOADING
    // =================================================

    function showBookingsLoading() {

        const loading =
            document.getElementById(
                "partnerBookingsLoading"
            );


        const card =
            document.getElementById(
                "partnerBookingsCard"
            );


        const empty =
            document.getElementById(
                "partnerBookingsEmpty"
            );


        if (loading) {

            loading.style.display =
                "block";
        }


        if (card) {

            card.style.display =
                "none";
        }


        if (empty) {

            empty.style.display =
                "none";
        }
    }


    function hideBookingsLoading() {

        const loading =
            document.getElementById(
                "partnerBookingsLoading"
            );


        if (loading) {

            loading.style.display =
                "none";
        }
    }


    // =================================================
    // ERROR
    // =================================================

    function showBookingsError(
        message
    ) {

        const container =
            document.getElementById(
                "partnerBookingsError"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <div class="partner-alert partner-alert-danger">

                <i class="bi bi-exclamation-triangle"></i>

                <span>
                    ${escapeHTML(
                        message
                    )}
                </span>


                <button
                    type="button"
                    class="partner-btn partner-btn-sm partner-btn-outline"
                    onclick="loadPartnerBookings()"
                >
                    Retry
                </button>

            </div>
        `;


        container.style.display =
            "block";
    }


    function hideBookingsError() {

        const container =
            document.getElementById(
                "partnerBookingsError"
            );


        if (container) {

            container.innerHTML =
                "";

            container.style.display =
                "none";
        }
    }


    // =================================================
    // ACTION MESSAGE
    // =================================================

    function showBookingMessage(
        message,
        type
    ) {

        const container =
            document.getElementById(
                "partnerBookingsError"
            );


        if (!container) {
            return;
        }


        const icon =
            type === "success"
                ? "bi-check-circle"
                : "bi-exclamation-triangle";


        const alertClass =
            type === "success"
                ? "partner-alert-success"
                : "partner-alert-danger";


        container.innerHTML = `
            <div class="partner-alert ${alertClass}">

                <i class="bi ${icon}"></i>

                <span>
                    ${escapeHTML(
                        message
                    )}
                </span>

            </div>
        `;


        container.style.display =
            "block";


        setTimeout(
            function () {

                hideBookingsError();

            },
            4000
        );
    }


    // =================================================
    // START
    // =================================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            if (
                typeof requirePartnerLogin ===
                "function"
            ) {

                if (
                    !requirePartnerLogin()
                ) {

                    return;
                }
            }


            initializeFilters();

            loadPartnerBookings();

        }
    );


    // =================================================
    // GLOBAL FUNCTIONS
    // =================================================

    window.loadPartnerBookings =
        loadPartnerBookings;


    window.acceptPartnerBooking =
        acceptPartnerBooking;


    window.rejectPartnerBooking =
        rejectPartnerBooking;


    window.completePartnerBooking =
        completePartnerBooking;

})();