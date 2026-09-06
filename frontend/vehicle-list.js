/* =====================================================
   TRIPZOVA CUSTOMER VEHICLE LIST
===================================================== */

(function () {

    "use strict";


    let allVehicles = [];

    let filteredVehicles = [];


    /* =================================================
       HELPERS
    ================================================= */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatCurrency(value) {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
            }
        ).format(Number(value || 0));
    }


    function formatStatus(value) {

        if (!value) {
            return "";
        }

        return String(value)
            .replace(/_/g, " ")
            .replace(/\b\w/g, function (letter) {
                return letter.toUpperCase();
            });
    }


    function getInitials(name) {

        const parts = String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!parts.length) {
            return "P";
        }

        if (parts.length === 1) {
            return parts[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }


    function getSearchParams() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        return {
            destination:
                params.get("destination") || "",

            members:
                Number(
                    params.get("members") || 1
                ),

            travelDate:
                params.get("travelDate") || "",

            pickup:
                params.get("pickup") || "",

            drop:
                params.get("drop") || ""
        };
    }


    /* =================================================
       LOAD VEHICLES
    ================================================= */

    async function loadVehicles() {

        const search =
            getSearchParams();

        const members =
            Number(search.members || 1);


        showLoading();

        hideError();


        updateSearchSummary(search);


        try {

            const response =
                await fetch(
                    `/api/vehicles/search?members=${encodeURIComponent(
                        members
                    )}`
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load vehicles."
                );

            }


            allVehicles =
                Array.isArray(data.data)
                    ? data.data
                    : [];


            filteredVehicles =
                [...allVehicles];


            hideLoading();

            showContent();

            initializeFilters();

            initializeSorting();

            renderVehicles();


        } catch (error) {

            console.error(
                "Vehicle search error:",
                error
            );


            hideLoading();

            showError(
                error.message ||
                "Unable to load vehicles."
            );
        }
    }


    /* =================================================
       SEARCH SUMMARY
    ================================================= */

    function updateSearchSummary(search) {

        const memberElement =
            document.getElementById(
                "summaryMemberCount"
            );


        if (memberElement) {

            memberElement.textContent =
                `${search.members} ${
                    search.members === 1
                        ? "Person"
                        : "People"
                }`;

        }


        const summary =
            document.getElementById(
                "vehicleSearchSummary"
            );


        if (!summary) {
            return;
        }


        const parts = [];


        if (search.pickup) {

            parts.push(
                search.pickup
            );

        }


        if (search.drop) {

            parts.push(
                search.drop
            );

        }


        if (
            !parts.length &&
            search.destination
        ) {

            parts.push(
                search.destination
            );

        }


        if (search.travelDate) {

            const date =
                new Date(
                    search.travelDate
                );


            if (!Number.isNaN(date.getTime())) {

                parts.push(
                    date.toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    )
                );

            }

        }


        if (parts.length) {

            summary.textContent =
                parts.join(" • ");

        } else {

            summary.textContent =
                "Select the vehicle that best fits your trip.";

        }
    }


    /* =================================================
       RENDER
    ================================================= */

    function renderVehicles() {

        const container =
            document.getElementById(
                "vehicleList"
            );


        const noResults =
            document.getElementById(
                "vehicleNoResults"
            );


        const count =
            document.getElementById(
                "vehicleResultCount"
            );


        if (!container) {
            return;
        }


        if (count) {

            count.textContent =
                `${filteredVehicles.length} ${
                    filteredVehicles.length === 1
                        ? "vehicle"
                        : "vehicles"
                }`;

        }


        if (!filteredVehicles.length) {

            container.innerHTML = "";

            if (noResults) {
                noResults.style.display =
                    "block";
            }

            return;
        }


        if (noResults) {
            noResults.style.display =
                "none";
        }


        container.innerHTML =
            filteredVehicles
                .map(renderVehicleCard)
                .join("");
    }


    function renderVehicleCard(item) {

        const vehicle =
            item.vehicle || {};

        const partner =
            item.partner || {};

        const profile =
            item.profile || {};


        const vehicleName =
            vehicle.vehicleName ||
            "Vehicle";


        const brandModel =
            [
                vehicle.brand,
                vehicle.model
            ]
                .filter(Boolean)
                .join(" ") ||
            formatStatus(
                vehicle.vehicleType
            );


        const vehicleType =
            formatStatus(
                vehicle.vehicleType ||
                "vehicle"
            );


        const photo =
            vehicle.vehiclePhotos &&
            vehicle.vehiclePhotos.length
                ? vehicle.vehiclePhotos[0]
                : "";


        const partnerName =
            profile.displayName ||
            profile.businessName ||
            `${partner.firstName || ""} ${
                partner.lastName || ""
            }`.trim() ||
            "Trip Partner";


        const partnerType =
            formatStatus(
                profile.partnerType ||
                "individual"
            );


        const location =
            profile.city ||
            partner.city ||
            "Location not added";


        const profilePicture =
            profile.profilePicture ||
            "";


        const initials =
            getInitials(
                partnerName
            );


        const imageHTML =
            photo
                ? `
                    <img
                        src="${escapeHTML(photo)}"
                        alt="${escapeHTML(vehicleName)}"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    >

                    <div
                        class="vehicle-image-placeholder"
                        style="display: none;"
                    >
                        <i class="bi bi-car-front"></i>
                    </div>
                `
                : `
                    <div class="vehicle-image-placeholder">
                        <i class="bi bi-car-front"></i>
                    </div>
                `;


        const partnerAvatar =
            profilePicture
                ? `
                    <img
                        src="${escapeHTML(profilePicture)}"
                        alt="${escapeHTML(partnerName)}"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    >

                    <span style="display:none;">
                        ${escapeHTML(initials)}
                    </span>
                `
                : `
                    <span>
                        ${escapeHTML(initials)}
                    </span>
                `;


        const acText =
            vehicle.airConditioning === "ac"
                ? "AC"
                : "Non-AC";


        const fuelText =
            formatStatus(
                vehicle.fuelType ||
                "other"
            );


        const driverText =
            vehicle.driverIncluded
                ? "Driver included"
                : "Driver not included";


        const minimumKm =
            Number(
                vehicle.minimumKm || 0
            );


        const price =
            Number(
                vehicle.pricePerKm || 0
            );


        return `
            <article
                class="vehicle-card"
                data-vehicle-id="${escapeHTML(
                    String(vehicle._id || "")
                )}"
                data-vehicle-type="${escapeHTML(
                    vehicle.vehicleType || ""
                )}"
                data-ac="${escapeHTML(
                    vehicle.airConditioning || ""
                )}"
                data-driver="${vehicle.driverIncluded ? "true" : "false"}"
                data-price="${price}"
                data-capacity="${Number(
                    vehicle.seatCapacity || 0
                )}"
            >

                <div class="vehicle-card-image">

                    ${imageHTML}

                    <span class="vehicle-type-badge">
                        ${escapeHTML(vehicleType)}
                    </span>

                </div>


                <div class="vehicle-card-info">

                    <div class="vehicle-card-title-row">

                        <div>

                            <h3 class="vehicle-card-title">
                                ${escapeHTML(vehicleName)}
                            </h3>

                            <div class="vehicle-card-brand">
                                ${escapeHTML(brandModel)}
                            </div>

                        </div>


                        <span class="vehicle-capacity-badge">
                            <i class="bi bi-people"></i>
                            ${Number(
                                vehicle.seatCapacity || 0
                            )}
                            seats
                        </span>

                    </div>


                    <div class="vehicle-features">

                        <span class="vehicle-feature">
                            <i class="bi bi-snow"></i>
                            ${escapeHTML(acText)}
                        </span>

                        <span class="vehicle-feature">
                            <i class="bi bi-fuel-pump"></i>
                            ${escapeHTML(fuelText)}
                        </span>

                        <span class="vehicle-feature">
                            <i class="bi bi-person-badge"></i>
                            ${vehicle.driverIncluded
                                ? "Driver included"
                                : "Driver optional"}
                        </span>

                    </div>


                    ${
                        vehicle.description
                            ? `
                                <p class="vehicle-description">
                                    ${escapeHTML(
                                        vehicle.description
                                    )}
                                </p>
                            `
                            : ""
                    }


                    <div class="vehicle-partner">

                        <div class="vehicle-partner-avatar">
                            ${partnerAvatar}
                        </div>

                        <div class="vehicle-partner-info">

                            <strong>
                                ${escapeHTML(partnerName)}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    partnerType
                                )}
                                •
                                ${escapeHTML(
                                    location
                                )}
                            </span>

                        </div>

                    </div>

                </div>


                <div class="vehicle-card-action">

                    <span class="vehicle-price-label">
                        Starting from
                    </span>

                    <div class="vehicle-price">
                        ${formatCurrency(price)}
                        <span>/ km</span>
                    </div>


                    ${
                        minimumKm > 0
                            ? `
                                <div class="vehicle-minimum">
                                    Minimum ${minimumKm} km
                                </div>
                            `
                            : `
                                <div class="vehicle-minimum">
                                    No minimum distance
                                </div>
                            `
                    }


                    <div class="vehicle-driver">
                        <i class="bi bi-check-circle-fill"></i>
                        ${escapeHTML(driverText)}
                    </div>


                    <button
                        type="button"
                        class="vehicle-select-btn"
                        onclick="selectVehicle('${escapeHTML(
                            String(vehicle._id || "")
                        )}')"
                    >
                        Select Vehicle
                        <i class="bi bi-arrow-right"></i>
                    </button>

                </div>

            </article>
        `;
    }


    /* =================================================
       FILTERS
    ================================================= */

    function initializeFilters() {

        const inputs =
            document.querySelectorAll(
                "[data-filter]"
            );


        inputs.forEach(function (input) {

            input.addEventListener(
                "change",
                applyFilters
            );

        });


        const driver =
            document.getElementById(
                "driverIncludedFilter"
            );


        if (driver) {

            driver.addEventListener(
                "change",
                applyFilters
            );

        }


        const clear =
            document.getElementById(
                "clearFilters"
            );


        if (clear) {

            clear.addEventListener(
                "click",
                clearFilters
            );

        }


        const reset =
            document.getElementById(
                "resetVehicleFilters"
            );


        if (reset) {

            reset.addEventListener(
                "click",
                clearFilters
            );

        }

    }


    function applyFilters() {

        const selectedTypes =
            Array.from(
                document.querySelectorAll(
                    '[data-filter="vehicleType"]:checked'
                )
            ).map(
                input => input.value
            );


        const selectedAc =
            Array.from(
                document.querySelectorAll(
                    '[data-filter="ac"]:checked'
                )
            ).map(
                input => input.value
            );


        const driverFilter =
            document.getElementById(
                "driverIncludedFilter"
            );


        const driverRequired =
            driverFilter &&
            driverFilter.checked;


        filteredVehicles =
            allVehicles.filter(
                function (item) {

                    const vehicle =
                        item.vehicle || {};


                    if (
                        selectedTypes.length &&
                        !selectedTypes.includes(
                            vehicle.vehicleType
                        )
                    ) {
                        return false;
                    }


                    if (
                        selectedAc.length &&
                        !selectedAc.includes(
                            vehicle.airConditioning
                        )
                    ) {
                        return false;
                    }


                    if (
                        driverRequired &&
                        !vehicle.driverIncluded
                    ) {
                        return false;
                    }


                    return true;
                }
            );


        sortVehicles();

        renderVehicles();
    }


    function clearFilters() {

        document
            .querySelectorAll(
                "[data-filter]"
            )
            .forEach(
                input => {
                    input.checked = false;
                }
            );


        const driver =
            document.getElementById(
                "driverIncludedFilter"
            );


        if (driver) {
            driver.checked = false;
        }


        const sort =
            document.getElementById(
                "vehicleSort"
            );


        if (sort) {
            sort.value = "recommended";
        }


        filteredVehicles =
            [...allVehicles];


        renderVehicles();
    }


    /* =================================================
       SORTING
    ================================================= */

    function initializeSorting() {

        const select =
            document.getElementById(
                "vehicleSort"
            );


        if (!select) {
            return;
        }


        select.addEventListener(
            "change",
            function () {

                sortVehicles();

                renderVehicles();

            }
        );

    }


    function sortVehicles() {

        const select =
            document.getElementById(
                "vehicleSort"
            );


        const sort =
            select
                ? select.value
                : "recommended";


        if (sort === "price-low") {

            filteredVehicles.sort(
                function (a, b) {

                    return (
                        Number(
                            a.vehicle?.pricePerKm || 0
                        ) -
                        Number(
                            b.vehicle?.pricePerKm || 0
                        )
                    );

                }
            );

            return;
        }


        if (sort === "price-high") {

            filteredVehicles.sort(
                function (a, b) {

                    return (
                        Number(
                            b.vehicle?.pricePerKm || 0
                        ) -
                        Number(
                            a.vehicle?.pricePerKm || 0
                        )
                    );

                }
            );

            return;
        }


        if (sort === "capacity") {

            filteredVehicles.sort(
                function (a, b) {

                    return (
                        Number(
                            a.vehicle?.seatCapacity || 0
                        ) -
                        Number(
                            b.vehicle?.seatCapacity || 0
                        )
                    );

                }
            );

            return;
        }


        /*
         * Recommended:
         * Smaller suitable vehicle first,
         * then lower price.
         */

        filteredVehicles.sort(
            function (a, b) {

                const aCapacity =
                    Number(
                        a.vehicle?.seatCapacity || 0
                    );

                const bCapacity =
                    Number(
                        b.vehicle?.seatCapacity || 0
                    );


                const aPrice =
                    Number(
                        a.vehicle?.pricePerKm || 0
                    );

                const bPrice =
                    Number(
                        b.vehicle?.pricePerKm || 0
                    );


                if (
                    aCapacity !==
                    bCapacity
                ) {

                    return (
                        aCapacity -
                        bCapacity
                    );

                }


                return (
                    aPrice -
                    bPrice
                );

            }
        );
    }


    /* =================================================
       SELECT VEHICLE
    ================================================= */

    function selectVehicle(vehicleId) {

        if (!vehicleId) {
            return;
        }


        const search =
            getSearchParams();


        const params =
            new URLSearchParams();


        params.set(
            "vehicleId",
            vehicleId
        );


        if (search.destination) {

            params.set(
                "destination",
                search.destination
            );

        }


        if (search.members) {

            params.set(
                "members",
                search.members
            );

        }


        if (search.travelDate) {

            params.set(
                "travelDate",
                search.travelDate
            );

        }


        if (search.pickup) {

            params.set(
                "pickup",
                search.pickup
            );

        }


        if (search.drop) {

            params.set(
                "drop",
                search.drop
            );

        }


        /*
         * Take the person straight to checkout with
         * the chosen vehicle and their original search
         * details attached (pickup/drop pre-fill there).
         */

        window.location.href =
            `booking.html?${params.toString()}`;
    }


    /* =================================================
       UI STATES
    ================================================= */

    function showLoading() {

        const loading =
            document.getElementById(
                "vehicleLoading"
            );


        const content =
            document.getElementById(
                "vehicleContent"
            );


        if (loading) {
            loading.style.display =
                "flex";
        }


        if (content) {
            content.style.display =
                "none";
        }

    }


    function hideLoading() {

        const loading =
            document.getElementById(
                "vehicleLoading"
            );


        if (loading) {
            loading.style.display =
                "none";
        }

    }


    function showContent() {

        const content =
            document.getElementById(
                "vehicleContent"
            );


        if (content) {
            content.style.display =
                "block";
        }

    }


    function showError(message) {

        const error =
            document.getElementById(
                "vehicleError"
            );


        const messageElement =
            document.getElementById(
                "vehicleErrorMessage"
            );


        if (messageElement) {

            messageElement.textContent =
                message;

        }


        if (error) {

            error.style.display =
                "flex";

        }

    }


    function hideError() {

        const error =
            document.getElementById(
                "vehicleError"
            );


        if (error) {

            error.style.display =
                "none";

        }

    }


    /* =================================================
       INIT
    ================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            loadVehicles();

        }
    );


    window.loadVehicles =
        loadVehicles;


    window.selectVehicle =
        selectVehicle;


})();