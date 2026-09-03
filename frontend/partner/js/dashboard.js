// =====================================================
// TRIPZOVA PARTNER DASHBOARD
// =====================================================

(function () {
    "use strict";

    // =================================================
    // LOAD DASHBOARD
    // =================================================

    async function loadPartnerDashboard() {
        try {
            showDashboardLoading();

            const response = await partnerFetch(
                "/api/partners/dashboard"
            );

            const data = response.data || response;

            updateStats(data);
            updateProfile(data.profile);
            updateVehicles(data.vehicles);
            updateRecentBookings(data.recentBookings);

            hideDashboardLoading();

        } catch (error) {
            console.error(
                "Partner dashboard error:",
                error
            );

            hideDashboardLoading();

            showDashboardError(
                error.message ||
                "Unable to load dashboard data."
            );
        }
    }


    // =================================================
    // UPDATE STATISTICS
    // =================================================

    function updateStats(data) {

        setText(
            "partnerVehicleCount",
            formatNumber(
                data.vehicleCount || 0
            )
        );

        setText(
            "partnerBookingCount",
            formatNumber(
                data.totalBookings || 0
            )
        );

        setText(
            "partnerCustomerCount",
            formatNumber(
                data.customerCount || 0
            )
        );

        setText(
            "partnerRevenue",
            formatCurrency(
                data.totalRevenue || 0
            )
        );


        // Pending booking badge

        const pendingCount =
            Number(
                data.pendingBookings || 0
            );

        const pendingBadge =
            document.getElementById(
                "partnerPendingBookingBadge"
            );

        if (pendingBadge) {

            if (pendingCount > 0) {

                pendingBadge.textContent =
                    pendingCount;

                pendingBadge.style.display =
                    "inline-flex";

            } else {

                pendingBadge.style.display =
                    "none";
            }
        }
    }


    // =================================================
    // UPDATE PROFILE
    // =================================================

    function updateProfile(profile) {

        if (!profile) {
            return;
        }


        setText(
            "partnerProfileName",
            profile.displayName ||
            "Partner"
        );


        setText(
            "partnerProfileLocation",
            profile.city ||
            "Location not added"
        );


        setText(
            "partnerProfileType",
            formatStatus(
                profile.partnerType ||
                "individual"
            )
        );


        setText(
            "partnerProfileExperience",
            `${Number(
                profile.experienceYears || 0
            )} years`
        );


        setText(
            "partnerProfileBusiness",
            profile.businessName ||
            "Independent Partner"
        );


        // Profile status

        const statusElement =
            document.getElementById(
                "partnerProfileStatus"
            );

        if (statusElement) {

            const status =
                profile.user?.partnerStatus ||
                profile.partnerStatus ||
                "pending";

            statusElement.textContent =
                formatStatus(status);

            statusElement.className =
                `partner-status ${getStatusClass(
                    status
                )}`;
        }


        // Profile picture

        const avatar =
            document.getElementById(
                "partnerProfileAvatar"
            );

        if (
            avatar &&
            profile.profilePicture
        ) {

            avatar.innerHTML = "";

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                profile.profilePicture;

            image.alt =
                profile.displayName ||
                "Partner";

            image.onerror =
                function () {

                    avatar.innerHTML =
                        `<span>${escapeHTML(
                            getInitials(
                                profile.displayName
                            )
                        )}</span>`;
                };

            avatar.appendChild(image);
        }
    }


    // =================================================
    // UPDATE VEHICLES
    // =================================================

    function updateVehicles(vehicles) {

        const container =
            document.getElementById(
                "partnerVehiclesContainer"
            );

        if (!container) {
            return;
        }


        if (
            !Array.isArray(vehicles) ||
            vehicles.length === 0
        ) {

            container.innerHTML = `
                <div class="partner-empty-state">
                    <div class="partner-empty-icon">
                        <i class="bi bi-car-front"></i>
                    </div>

                    <h5>No vehicles added yet</h5>

                    <p>
                        Add your first vehicle to start
                        receiving booking requests.
                    </p>

                    <a
                        href="add-vehicle.html"
                        class="partner-btn partner-btn-primary"
                    >
                        <i class="bi bi-plus-lg"></i>
                        Add Vehicle
                    </a>
                </div>
            `;

            return;
        }


        container.innerHTML =
            vehicles
                .slice(0, 3)
                .map(
                    renderVehicle
                )
                .join("");
    }


    // =================================================
    // VEHICLE CARD
    // =================================================

    function renderVehicle(vehicle) {

        const photo =
            vehicle.vehiclePhotos &&
            vehicle.vehiclePhotos.length
                ? vehicle.vehiclePhotos[0]
                : "";


        const imageHTML = photo
            ? `
                <img
                    src="${escapeHTML(photo)}"
                    alt="${escapeHTML(
                        vehicle.vehicleName
                    )}"
                    class="partner-vehicle-image"
                >
            `
            : `
                <div class="partner-vehicle-placeholder">
                    <i class="bi bi-car-front"></i>
                </div>
            `;


        const approval =
            vehicle.adminApproval ||
            "pending";


        return `
            <div class="partner-vehicle-card">

                <div class="partner-vehicle-photo">
                    ${imageHTML}
                </div>

                <div class="partner-vehicle-content">

                    <div class="partner-vehicle-header">

                        <h5>
                            ${escapeHTML(
                                vehicle.vehicleName
                            )}
                        </h5>

                        <span class="partner-status ${getStatusClass(
                            approval
                        )}">
                            ${escapeHTML(
                                formatStatus(
                                    approval
                                )
                            )}
                        </span>

                    </div>


                    <div class="partner-vehicle-meta">

                        <span>
                            <i class="bi bi-people"></i>
                            ${Number(
                                vehicle.seatCapacity || 0
                            )} Seats
                        </span>

                        <span>
                            <i class="bi bi-snow"></i>
                            ${
                                vehicle.airConditioning ===
                                "ac"
                                    ? "AC"
                                    : "Non-AC"
                            }
                        </span>

                        <span>
                            <i class="bi bi-fuel-pump"></i>
                            ${escapeHTML(
                                formatStatus(
                                    vehicle.fuelType ||
                                    "other"
                                )
                            )}
                        </span>

                    </div>


                    <div class="partner-vehicle-price">

                        <strong>
                            ${formatCurrency(
                                vehicle.pricePerKm || 0
                            )}
                        </strong>

                        <span>
                            / km
                        </span>

                    </div>

                </div>

            </div>
        `;
    }


    // =================================================
    // RECENT BOOKINGS
    // =================================================

    function updateRecentBookings(bookings) {

        const container =
            document.getElementById(
                "partnerRecentBookings"
            );

        if (!container) {
            return;
        }


        if (
            !Array.isArray(bookings) ||
            bookings.length === 0
        ) {

            container.innerHTML = `
                <div class="partner-empty-state small">

                    <div class="partner-empty-icon">
                        <i class="bi bi-calendar-check"></i>
                    </div>

                    <h5>No booking requests yet</h5>

                    <p>
                        New customer booking requests
                        will appear here.
                    </p>

                </div>
            `;

            return;
        }


        container.innerHTML =
            bookings
                .slice(0, 5)
                .map(
                    renderBooking
                )
                .join("");
    }


    // =================================================
    // BOOKING ROW
    // =================================================

    function renderBooking(booking) {

        const customer =
            booking.customer || {};

        const customerName =
            `${customer.firstName || ""} ${
                customer.lastName || ""
            }`.trim() ||
            "Customer";


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


        return `
            <div class="partner-booking-row">

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
                                booking.bookingNumber ||
                                ""
                            )}
                        </small>
                    </div>

                </div>


                <div class="partner-booking-service">

                    <strong>
                        ${escapeHTML(
                            booking.serviceName ||
                            "-"
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            formatStatus(
                                booking.serviceType ||
                                ""
                            )
                        )}
                    </small>

                </div>


                <div class="partner-booking-date">
                    ${travelDate}
                </div>


                <div class="partner-booking-guests">
                    ${Number(
                        booking.guests || 1
                    )}
                    <small>
                        guests
                    </small>
                </div>


                <div class="partner-booking-amount">
                    ${formatCurrency(
                        booking.amount || 0
                    )}
                </div>


                <div>

                    <span class="partner-status ${getStatusClass(
                        booking.bookingStatus
                    )}">
                        ${escapeHTML(
                            formatStatus(
                                booking.bookingStatus
                            )
                        )}
                    </span>

                </div>

            </div>
        `;
    }


    // =================================================
    // LOADING
    // =================================================

    function showDashboardLoading() {

        const loading =
            document.getElementById(
                "partnerDashboardLoading"
            );

        if (loading) {
            loading.style.display = "flex";
        }
    }


    function hideDashboardLoading() {

        const loading =
            document.getElementById(
                "partnerDashboardLoading"
            );

        if (loading) {
            loading.style.display = "none";
        }
    }


    // =================================================
    // ERROR
    // =================================================

    function showDashboardError(message) {

        const container =
            document.getElementById(
                "partnerDashboardError"
            );

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="partner-alert partner-alert-danger">

                <i class="bi bi-exclamation-triangle"></i>

                <span>
                    ${escapeHTML(message)}
                </span>

                <button
                    type="button"
                    class="partner-btn partner-btn-sm partner-btn-outline"
                    onclick="loadPartnerDashboard()"
                >
                    Retry
                </button>

            </div>
        `;

        container.style.display =
            "block";
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

            loadPartnerDashboard();
        }
    );


    // =================================================
    // GLOBAL
    // =================================================

    window.loadPartnerDashboard =
        loadPartnerDashboard;

})();