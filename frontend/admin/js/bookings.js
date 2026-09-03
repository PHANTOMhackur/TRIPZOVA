let allBookings = [];

let selectedBooking = null;


// =========================================
// INITIALIZE
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            typeof initializeAdmin ===
            "function"
        ) {
            initializeAdmin();
        }

        loadBookings();

        setupBookingFilters();

        document
            .getElementById(
                "refreshBookingsBtn"
            )
            ?.addEventListener(
                "click",
                loadBookings
            );

    }
);


// =========================================
// LOAD BOOKINGS
// =========================================

async function loadBookings() {

    const tbody =
        document.getElementById(
            "bookingsTableBody"
        );


    if (tbody) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="admin-table-loading"
                >
                    Loading bookings...
                </td>
            </tr>
        `;

    }


    try {

        const data =
            await adminFetch(
                "/api/admin/bookings"
            );


        allBookings =
            data.bookings || [];


        updateBookingStats();

        applyBookingFilters();

    } catch (error) {

        console.error(
            "Load bookings error:",
            error
        );


        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="admin-table-empty"
                    >
                        Unable to load bookings.
                    </td>
                </tr>
            `;

        }

    }

}


// =========================================
// FILTERS
// =========================================

function setupBookingFilters() {

    const search =
        document.getElementById(
            "bookingSearch"
        );

    const status =
        document.getElementById(
            "bookingStatusFilter"
        );

    const payment =
        document.getElementById(
            "paymentStatusFilter"
        );

    const service =
        document.getElementById(
            "serviceTypeFilter"
        );


    search?.addEventListener(
        "input",
        applyBookingFilters
    );

    status?.addEventListener(
        "change",
        applyBookingFilters
    );

    payment?.addEventListener(
        "change",
        applyBookingFilters
    );

    service?.addEventListener(
        "change",
        applyBookingFilters
    );

}


function applyBookingFilters() {

    const search =
        (
            document.getElementById(
                "bookingSearch"
            )?.value || ""
        )
            .trim()
            .toLowerCase();


    const status =
        document.getElementById(
            "bookingStatusFilter"
        )?.value || "";


    const payment =
        document.getElementById(
            "paymentStatusFilter"
        )?.value || "";


    const service =
        document.getElementById(
            "serviceTypeFilter"
        )?.value || "";


    const filtered =
        allBookings.filter(
            booking => {

                const searchMatch =
                    !search ||
                    String(
                        booking.bookingNumber || ""
                    )
                        .toLowerCase()
                        .includes(search) ||
                    String(
                        booking.serviceName || ""
                    )
                        .toLowerCase()
                        .includes(search);


                const statusMatch =
                    !status ||
                    booking.bookingStatus ===
                    status;


                const paymentMatch =
                    !payment ||
                    booking.paymentStatus ===
                    payment;


                const serviceMatch =
                    !service ||
                    booking.serviceType ===
                    service;


                return (
                    searchMatch &&
                    statusMatch &&
                    paymentMatch &&
                    serviceMatch
                );

            }
        );


    renderBookings(
        filtered
    );

}


// =========================================
// STATS
// =========================================

function updateBookingStats() {

    setText(
        "totalBookings",
        allBookings.length
    );


    setText(
        "pendingBookings",
        allBookings.filter(
            booking =>
                booking.bookingStatus ===
                "pending"
        ).length
    );


    setText(
        "confirmedBookings",
        allBookings.filter(
            booking =>
                booking.bookingStatus ===
                "confirmed"
        ).length
    );


    setText(
        "cancelledBookings",
        allBookings.filter(
            booking =>
                booking.bookingStatus ===
                "cancelled"
        ).length
    );

}


// =========================================
// RENDER
// =========================================

function renderBookings(
    bookings
) {

    const tbody =
        document.getElementById(
            "bookingsTableBody"
        );


    if (!tbody) {
        return;
    }


    if (!bookings.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="admin-table-empty"
                >
                    No bookings found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        bookings
            .map(
                booking => {

                    const customer =
                        booking.customer
                            ? `${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim()
                            : "Unknown";


                    const date =
                        booking.travelDate
                            ? formatDate(
                                booking.travelDate
                            )
                            : "-";


                    return `

                        <tr>

                            <td>

                                <div class="booking-number">
                                    ${escapeHTML(
                                        booking.bookingNumber || "-"
                                    )}
                                </div>

                            </td>


                            <td>

                                <div class="partner-table-user">

                                    <div class="partner-table-avatar">
                                        ${getInitials(customer)}
                                    </div>

                                    <div>

                                        <strong>
                                            ${escapeHTML(customer)}
                                        </strong>

                                        <small>
                                            ${escapeHTML(
                                                booking.customer?.email || "-"
                                            )}
                                        </small>

                                    </div>

                                </div>

                            </td>


                            <td>

                                <div class="booking-service">

                                    <strong>
                                        ${escapeHTML(
                                            booking.serviceName || "-"
                                        )}
                                    </strong>

                                    <small>
                                        ${capitalize(
                                            booking.serviceType || "-"
                                        )}
                                    </small>

                                </div>

                            </td>


                            <td>
                                ${escapeHTML(date)}
                            </td>


                            <td>
                                ${formatCurrency(
                                    booking.amount || 0
                                )}
                            </td>


                            <td>

                                <span class="
                                    admin-status
                                    ${getPaymentStatusClass(
                                        booking.paymentStatus
                                    )}
                                ">
                                    ${capitalize(
                                        booking.paymentStatus || "pending"
                                    )}
                                </span>

                            </td>


                            <td>

                                <span class="
                                    admin-status
                                    ${getBookingStatusClass(
                                        booking.bookingStatus
                                    )}
                                ">
                                    ${capitalize(
                                        booking.bookingStatus || "pending"
                                    )}
                                </span>

                            </td>


                            <td>

                                <button
                                    type="button"
                                    class="table-action-link"
                                    onclick="viewBooking(
                                        '${booking._id}'
                                    )"
                                >
                                    View →
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


// =========================================
// VIEW BOOKING
// =========================================

async function viewBooking(
    bookingId
) {

    try {

        const data =
            await adminFetch(
                `/api/admin/bookings/${bookingId}`
            );


        selectedBooking =
            data.booking;


        renderBookingDetails(
            selectedBooking
        );


        const modalElement =
            document.getElementById(
                "bookingDetailsModal"
            );


        const modal =
            new bootstrap.Modal(
                modalElement
            );


        modal.show();

    } catch (error) {

        console.error(
            "View booking error:",
            error
        );

        alert(
            error.message ||
            "Unable to load booking."
        );

    }

}


// =========================================
// BOOKING DETAILS
// =========================================

function renderBookingDetails(
    booking
) {

    const customer =
        booking.customer
            ? `${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim()
            : "-";


    const partner =
        booking.partner
            ? `${booking.partner.firstName || ""} ${booking.partner.lastName || ""}`.trim()
            : "Not assigned";


    const content =
        document.getElementById(
            "bookingDetailsContent"
        );


    if (!content) {
        return;
    }


    content.innerHTML = `

        <div class="booking-detail-header">

            <div>

                <span>
                    Booking
                </span>

                <h3>
                    ${escapeHTML(
                        booking.bookingNumber || "-"
                    )}
                </h3>

            </div>

            <span class="
                admin-status
                ${getBookingStatusClass(
                    booking.bookingStatus
                )}
            ">
                ${capitalize(
                    booking.bookingStatus
                )}
            </span>

        </div>


        <div class="booking-detail-grid">

            <div class="booking-detail-box">

                <span>
                    Customer
                </span>

                <strong>
                    ${escapeHTML(customer)}
                </strong>

                <small>
                    ${escapeHTML(
                        booking.customer?.email || "-"
                    )}
                </small>

            </div>


            <div class="booking-detail-box">

                <span>
                    Partner
                </span>

                <strong>
                    ${escapeHTML(partner)}
                </strong>

                <small>
                    ${escapeHTML(
                        booking.partner?.city || "-"
                    )}
                </small>

            </div>


            <div class="booking-detail-box">

                <span>
                    Service
                </span>

                <strong>
                    ${escapeHTML(
                        booking.serviceName || "-"
                    )}
                </strong>

                <small>
                    ${capitalize(
                        booking.serviceType || "-"
                    )}
                </small>

            </div>


            <div class="booking-detail-box">

                <span>
                    Travel Date
                </span>

                <strong>
                    ${booking.travelDate
                        ? formatDate(
                            booking.travelDate
                        )
                        : "-"
                    }
                </strong>

            </div>


            <div class="booking-detail-box">

                <span>
                    Guests
                </span>

                <strong>
                    ${booking.guests || 1}
                </strong>

            </div>


            <div class="booking-detail-box">

                <span>
                    Amount
                </span>

                <strong>
                    ${formatCurrency(
                        booking.amount || 0
                    )}
                </strong>

            </div>


            <div class="booking-detail-box">

                <span>
                    Payment
                </span>

                <strong>
                    ${capitalize(
                        booking.paymentStatus || "-"
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        booking.paymentMethod || "-"
                    )}
                </small>

            </div>


            <div class="booking-detail-box">

                <span>
                    Created
                </span>

                <strong>
                    ${booking.createdAt
                        ? formatDate(
                            booking.createdAt
                        )
                        : "-"
                    }
                </strong>

            </div>

        </div>

    `;


    renderBookingActions(
        booking
    );

}


// =========================================
// STATUS ACTIONS
// =========================================

function renderBookingActions(
    booking
) {

    const container =
        document.getElementById(
            "bookingStatusActions"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        booking.bookingStatus ===
        "pending"
    ) {

        container.innerHTML = `

            <button
                type="button"
                class="user-action-btn activate"
                onclick="changeBookingStatus(
                    '${booking._id}',
                    'confirmed'
                )"
            >
                <i class="bi bi-check-circle"></i>
                Confirm Booking
            </button>


            <button
                type="button"
                class="user-action-btn block"
                onclick="changeBookingStatus(
                    '${booking._id}',
                    'cancelled'
                )"
            >
                <i class="bi bi-x-circle"></i>
                Cancel Booking
            </button>

        `;

    }


    if (
        booking.bookingStatus ===
        "confirmed"
    ) {

        container.innerHTML = `

            <button
                type="button"
                class="user-action-btn activate"
                onclick="changeBookingStatus(
                    '${booking._id}',
                    'completed'
                )"
            >
                <i class="bi bi-check2-all"></i>
                Mark Completed
            </button>


            <button
                type="button"
                class="user-action-btn block"
                onclick="changeBookingStatus(
                    '${booking._id}',
                    'cancelled'
                )"
            >
                <i class="bi bi-x-circle"></i>
                Cancel Booking
            </button>

        `;

    }


    if (
        booking.bookingStatus ===
        "cancelled"
    ) {

        container.innerHTML = `

            <span class="admin-account-note">
                <i class="bi bi-info-circle"></i>
                This booking is cancelled.
            </span>

        `;

    }


    if (
        booking.bookingStatus ===
        "completed"
    ) {

        container.innerHTML = `

            <span class="admin-account-note">
                <i class="bi bi-check-circle"></i>
                This booking is completed.
            </span>

        `;

    }

}


// =========================================
// CHANGE BOOKING STATUS
// =========================================

async function changeBookingStatus(
    bookingId,
    status
) {

    const booking =
        allBookings.find(
            item =>
                item._id === bookingId
        );


    if (!booking) {
        return;
    }


    const confirmed =
        window.confirm(
            `Change booking ${booking.bookingNumber} to ${status}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const data =
            await adminFetch(
                `/api/admin/bookings/${bookingId}/status`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        status
                    })
                }
            );


        booking.bookingStatus =
            status;


        updateBookingStats();

        applyBookingFilters();

        renderBookingDetails(
            booking
        );


        alert(
            data.message ||
            "Booking status updated."
        );

    } catch (error) {

        console.error(
            "Change booking status error:",
            error
        );


        alert(
            error.message ||
            "Unable to update booking."
        );

    }

}


// =========================================
// HELPERS
// =========================================

function getBookingStatusClass(
    status
) {

    switch (status) {

        case "confirmed":
            return "status-approved";

        case "completed":
            return "status-approved";

        case "pending":
            return "status-pending";

        case "cancelled":
            return "status-rejected";

        default:
            return "status-default";

    }

}


function getPaymentStatusClass(
    status
) {

    switch (status) {

        case "paid":
            return "status-approved";

        case "pending":
            return "status-pending";

        case "failed":
            return "status-rejected";

        case "refunded":
            return "status-default";

        default:
            return "status-default";

    }

}


function capitalize(value) {

    if (!value) {
        return "-";
    }


    return String(value)
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {
        element.textContent =
            value;
    }

}