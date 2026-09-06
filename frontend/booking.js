// =========================================
// TRIPZOVA BOOKING.JS
// COMPLETE BOOKING + GOOGLE MAPS VERSION
// =========================================

let map = null;
let directionsService = null;
let directionsRenderer = null;
let geocoder = null;

let pickupPlace = null;
let dropPlace = null;

let pickupMarker = null;
let dropMarker = null;

let pickupAutocomplete = null;
let dropAutocomplete = null;

// Map picker
let pickerMap = null;
let pickerGeocoder = null;
let pickerType = null;
let pickerLocation = null;

// Selected vehicle
let selectedVehicle = null;

// Route distance in KM
let routeDistanceKm = 0;


// =========================================
// URL PARAMETERS
// =========================================

const bookingParams =
    new URLSearchParams(window.location.search);

const vehicleId =
    bookingParams.get("vehicleId");

const destinationParam =
    bookingParams.get("destination") || "";

const membersParam =
    Number(bookingParams.get("members") || 1);

const travelDateParam =
    bookingParams.get("travelDate") || "";

const pickupParam =
    bookingParams.get("pickup") || "";

const dropParam =
    bookingParams.get("drop") || "";


// =========================================
// GOOGLE MAP INITIALIZATION
// =========================================

function initBookingMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        console.error("Map element #map not found.");
        return;
    }

    const defaultLocation = {
        lat: 21.1702,
        lng: 72.8311
    };

    // Main map
    map = new google.maps.Map(
        mapElement,
        {
            center: defaultLocation,
            zoom: 12,

            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
        }
    );

    // Services
    directionsService =
        new google.maps.DirectionsService();

    directionsRenderer =
        new google.maps.DirectionsRenderer({
            map: map,

            suppressMarkers: false,

            polylineOptions: {
                strokeColor: "#202633",
                strokeWeight: 5
            }
        });

    geocoder =
        new google.maps.Geocoder();

    // Google autocomplete
    setupAutocomplete();

    // Location menus
    setupLocationMenus();

    // Other controls
    setupTripType();
    setupPassengers();
    setupDates();
    setupBookingButton();

    // Load vehicle after page/map initialization
    loadSelectedVehicle();

    console.log(
        "TRIPZOVA Google Maps initialized"
    );
}


// =========================================
// LOAD SELECTED VEHICLE
// =========================================

async function loadSelectedVehicle() {

    if (!vehicleId) {

        console.warn(
            "No vehicleId found in booking URL."
        );

        setElementText(
            "bookingVehicleName",
            "No vehicle selected"
        );

        showBookingMessage(
            "No vehicle was selected. Please go back and choose a vehicle first."
        );

        const bookButtonMissing =
            document.getElementById("bookRideButton");

        if (bookButtonMissing) {
            bookButtonMissing.disabled = true;
        }

        return;
    }

    try {

        const response =
            await fetch(
                `/api/vehicles/${encodeURIComponent(vehicleId)}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load selected vehicle."
            );
        }

        selectedVehicle =
            data.vehicle || data;

        console.log(
            "Selected vehicle:",
            selectedVehicle
        );

        displaySelectedVehicle();

    } catch (error) {

        console.error(
            "Load vehicle error:",
            error
        );

        showBookingMessage(
            error.message ||
            "Unable to load the selected vehicle."
        );
    }
}


// =========================================
// DISPLAY SELECTED VEHICLE
// =========================================

function displaySelectedVehicle() {

    if (!selectedVehicle) {
        return;
    }

    /*
        This function supports optional elements.

        If you later add these IDs to booking.html:
            bookingVehicleName
            bookingVehiclePrice
            bookingVehicleSeats
            bookingVehiclePartner

        they will automatically be populated.
    */

    const vehicleName =
        selectedVehicle.vehicleName ||
        selectedVehicle.name ||
        "Selected Vehicle";

    const pricePerKm =
        Number(
            selectedVehicle.pricePerKm || 0
        );

    const seatCapacity =
        Number(
            selectedVehicle.seatCapacity || 0
        );

    const partner =
        selectedVehicle.partner || {};

    const partnerName =
        `${partner.firstName || ""} ${partner.lastName || ""}`
            .trim();


    setElementText(
        "bookingVehicleName",
        vehicleName
    );

    setElementText(
        "bookingVehiclePrice",
        pricePerKm > 0
            ? `₹${pricePerKm.toLocaleString("en-IN")} / km`
            : "Price unavailable"
    );

    setElementText(
        "bookingVehicleSeats",
        seatCapacity
            ? `${seatCapacity} Seats`
            : ""
    );

    setElementText(
        "bookingVehiclePartner",
        partnerName || "Tripzova Partner"
    );


    // Optional vehicle image
    const vehicleImage =
        document.getElementById(
            "bookingVehicleImage"
        );

    if (
        vehicleImage &&
        Array.isArray(
            selectedVehicle.vehiclePhotos
        ) &&
        selectedVehicle.vehiclePhotos.length
    ) {

        vehicleImage.src =
            selectedVehicle.vehiclePhotos[0];

        vehicleImage.style.display =
            "block";
    }
}


// =========================================
// SMALL DOM HELPER
// =========================================

function setElementText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value || "";
    }
}


// =========================================
// AUTOCOMPLETE
// =========================================

function setupAutocomplete() {

    const pickupInput =
        document.getElementById("pickupInput");

    const dropInput =
        document.getElementById("dropInput");

    if (!pickupInput || !dropInput) {
        return;
    }

    pickupAutocomplete =
        new google.maps.places.Autocomplete(
            pickupInput,
            {
                fields: [
                    "formatted_address",
                    "geometry",
                    "name"
                ]
            }
        );

    dropAutocomplete =
        new google.maps.places.Autocomplete(
            dropInput,
            {
                fields: [
                    "formatted_address",
                    "geometry",
                    "name"
                ]
            }
        );


    // Pickup
    pickupAutocomplete.addListener(
        "place_changed",
        () => {

            const place =
                pickupAutocomplete.getPlace();

            if (
                !place ||
                !place.geometry ||
                !place.geometry.location
            ) {

                console.error(
                    "Invalid pickup place."
                );

                return;
            }

            pickupPlace =
                place;

            pickupInput.value =
                place.formatted_address ||
                place.name ||
                "";

            updateMarker(
                "pickup",
                place.geometry.location
            );

            map.panTo(
                place.geometry.location
            );

            map.setZoom(14);

            calculateRoute();
        }
    );


    // Drop
    dropAutocomplete.addListener(
        "place_changed",
        () => {

            const place =
                dropAutocomplete.getPlace();

            if (
                !place ||
                !place.geometry ||
                !place.geometry.location
            ) {

                console.error(
                    "Invalid drop place."
                );

                return;
            }

            dropPlace =
                place;

            dropInput.value =
                place.formatted_address ||
                place.name ||
                "";

            updateMarker(
                "drop",
                place.geometry.location
            );

            map.panTo(
                place.geometry.location
            );

            map.setZoom(14);

            calculateRoute();
        }
    );
}


// =========================================
// LOCATION MENUS
// =========================================

function setupLocationMenus() {

    const pickupInput =
        document.getElementById(
            "pickupInput"
        );

    const dropInput =
        document.getElementById(
            "dropInput"
        );

    if (pickupInput) {

        createLocationMenu(
            pickupInput,
            "pickup"
        );
    }

    if (dropInput) {

        createLocationMenu(
            dropInput,
            "drop"
        );
    }
}


// =========================================
// CREATE LOCATION MENU
// =========================================

function createLocationMenu(
    input,
    type
) {

    const wrapper =
        input.closest(".booking-input") ||
        input.parentElement;

    if (!wrapper) {
        return;
    }

    wrapper.style.position =
        "relative";

    const menu =
        document.createElement("div");

    menu.className =
        "location-menu";

    menu.style.cssText = `
        display: none;
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        z-index: 9999;
        background: #ffffff;
        border: 1px solid #e5e5e5;
        border-radius: 14px;
        padding: 6px;
        box-shadow: 0 10px 30px rgba(0,0,0,.15);
    `;

    menu.innerHTML = `

        <button
            type="button"
            class="location-menu-item"
            data-action="current"
            style="
                width:100%;
                border:0;
                background:white;
                padding:12px;
                display:flex;
                align-items:center;
                gap:12px;
                text-align:left;
                cursor:pointer;
                border-radius:10px;
            "
        >

            <span style="font-size:20px;">
                📍
            </span>

            <span>

                <strong
                    style="
                        display:block;
                        font-size:13px;
                        color:#202633;
                    "
                >
                    Use my current location
                </strong>

                <small
                    style="
                        display:block;
                        color:#777;
                        margin-top:3px;
                    "
                >
                    Find my location automatically
                </small>

            </span>

        </button>


        <button
            type="button"
            class="location-menu-item"
            data-action="map"
            style="
                width:100%;
                border:0;
                background:white;
                padding:12px;
                display:flex;
                align-items:center;
                gap:12px;
                text-align:left;
                cursor:pointer;
                border-radius:10px;
            "
        >

            <span style="font-size:20px;">
                🗺️
            </span>

            <span>

                <strong
                    style="
                        display:block;
                        font-size:13px;
                        color:#202633;
                    "
                >
                    Select on map
                </strong>

                <small
                    style="
                        display:block;
                        color:#777;
                        margin-top:3px;
                    "
                >
                    Move the map and choose a pin
                </small>

            </span>

        </button>

    `;

    wrapper.appendChild(menu);


    function openMenu(event) {

        event.stopPropagation();

        closeAllLocationMenus();

        menu.style.display =
            "block";
    }


    input.addEventListener(
        "click",
        openMenu
    );

    input.addEventListener(
        "focus",
        openMenu
    );


    menu.addEventListener(
        "click",
        event => {

            event.stopPropagation();
        }
    );


    menu
        .querySelector(
            '[data-action="current"]'
        )
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                closeAllLocationMenus();

                useCurrentLocation(
                    type
                );
            }
        );


    menu
        .querySelector(
            '[data-action="map"]'
        )
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                closeAllLocationMenus();

                openMapPicker(
                    type
                );
            }
        );
}


// =========================================
// CLOSE LOCATION MENUS
// =========================================

function closeAllLocationMenus() {

    document
        .querySelectorAll(
            ".location-menu"
        )
        .forEach(menu => {

            menu.style.display =
                "none";
        });
}


document.addEventListener(
    "click",
    event => {

        if (
            event.target.closest(
                ".location-menu"
            )
        ) {
            return;
        }

        if (
            event.target.closest(
                ".booking-input"
            )
        ) {
            return;
        }

        closeAllLocationMenus();
    }
);


// =========================================
// CURRENT LOCATION
// =========================================

function useCurrentLocation(type) {

    if (
        !navigator.geolocation
    ) {

        alert(
            "Your browser does not support location services."
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(

        position => {

            const lat =
                Number(
                    position.coords.latitude
                );

            const lng =
                Number(
                    position.coords.longitude
                );

            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lng)
            ) {

                alert(
                    "Invalid current location."
                );

                return;
            }

            const location =
                new google.maps.LatLng(
                    lat,
                    lng
                );

            reverseGeocode(
                location,
                type
            );
        },


        error => {

            console.error(
                "Geolocation error:",
                error
            );

            alert(
                "Unable to get your current location. Please allow location access."
            );
        },


        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}


// =========================================
// REVERSE GEOCODING
// =========================================

function reverseGeocode(
    location,
    type
) {

    geocoder.geocode(

        {
            location: location
        },

        (
            results,
            status
        ) => {

            if (
                status !== "OK" ||
                !results ||
                !results.length
            ) {

                alert(
                    "Could not find the address."
                );

                return;
            }

            const address =
                results[0]
                    .formatted_address;

            setLocation(
                type,
                location,
                address
            );
        }
    );
}


// =========================================
// SET LOCATION
// =========================================

function setLocation(
    type,
    location,
    address
) {

    let lat;
    let lng;

    if (
        location &&
        typeof location.lat === "function"
    ) {

        lat =
            Number(
                location.lat()
            );

        lng =
            Number(
                location.lng()
            );

    } else {

        lat =
            Number(
                location?.lat
            );

        lng =
            Number(
                location?.lng
            );
    }

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {

        console.error(
            "Invalid location:",
            location
        );

        return;
    }

    const latLng =
        new google.maps.LatLng(
            lat,
            lng
        );

    const place = {

        formatted_address:
            address,

        geometry: {

            location:
                latLng
        }
    };


    if (type === "pickup") {

        pickupPlace =
            place;

        const input =
            document.getElementById(
                "pickupInput"
            );

        if (input) {

            input.value =
                address;
        }

        updateMarker(
            "pickup",
            latLng
        );

    } else {

        dropPlace =
            place;

        const input =
            document.getElementById(
                "dropInput"
            );

        if (input) {

            input.value =
                address;
        }

        updateMarker(
            "drop",
            latLng
        );
    }


    map.panTo(
        latLng
    );

    map.setZoom(
        14
    );

    calculateRoute();
}


// =========================================
// MARKERS
// =========================================

function updateMarker(
    type,
    location
) {

    if (type === "pickup") {

        if (pickupMarker) {

            pickupMarker.setMap(
                null
            );
        }

        pickupMarker =
            new google.maps.Marker({

                map: map,

                position: location,

                title:
                    "Pickup location"
            });

    } else {

        if (dropMarker) {

            dropMarker.setMap(
                null
            );
        }

        dropMarker =
            new google.maps.Marker({

                map: map,

                position: location,

                title:
                    "Drop location"
            });
    }
}


// =========================================
// MAP PICKER
// =========================================

function openMapPicker(type) {

    pickerType =
        type;

    const oldPicker =
        document.getElementById(
            "tripzovaMapPicker"
        );

    if (oldPicker) {
        oldPicker.remove();
    }


    const overlay =
        document.createElement("div");

    overlay.id =
        "tripzovaMapPicker";

    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 100000;
        background: #ffffff;
        display: flex;
        flex-direction: column;
    `;


    const header =
        document.createElement("div");

    header.style.cssText = `
        height: 68px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        background: #ffffff;
        box-shadow: 0 2px 10px rgba(0,0,0,.12);
        z-index: 20;
    `;


    header.innerHTML = `

        <button
            id="pickerClose"
            type="button"
            style="
                width:40px;
                height:40px;
                border:0;
                border-radius:50%;
                background:#f2f2f2;
                font-size:18px;
                cursor:pointer;
            "
        >
            ✕
        </button>

        <div>

            <strong
                style="
                    display:block;
                    font-size:15px;
                    color:#202633;
                "
            >
                ${
                    type === "pickup"
                        ? "Select pickup location"
                        : "Select drop location"
                }
            </strong>

            <small
                style="
                    color:#777;
                    font-size:11px;
                "
            >
                Move the map under the pin
            </small>

        </div>
    `;


    const mapArea =
        document.createElement("div");

    mapArea.style.cssText = `
        position: relative;
        flex: 1;
        min-height: 0;
    `;


    const pickerMapElement =
        document.createElement("div");

    pickerMapElement.id =
        "tripzovaPickerMap";

    pickerMapElement.style.cssText = `
        position:absolute;
        inset:0;
    `;

    mapArea.appendChild(
        pickerMapElement
    );


    const centerPin =
        document.createElement("div");

    centerPin.innerHTML =
        "📍";

    centerPin.style.cssText = `
        position:absolute;
        left:50%;
        top:50%;
        transform:translate(-50%,-100%);
        z-index:10;
        font-size:42px;
        pointer-events:none;
        filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));
    `;

    mapArea.appendChild(
        centerPin
    );


    const gpsButton =
        document.createElement("button");

    gpsButton.id =
        "pickerGpsButton";

    gpsButton.type =
        "button";

    gpsButton.innerHTML =
        "📍";

    gpsButton.style.cssText = `
        position:absolute;
        right:15px;
        top:15px;
        z-index:15;
        width:46px;
        height:46px;
        border:0;
        border-radius:50%;
        background:#ffffff;
        box-shadow:0 3px 12px rgba(0,0,0,.2);
        font-size:20px;
        cursor:pointer;
    `;

    mapArea.appendChild(
        gpsButton
    );


    const bottom =
        document.createElement("div");

    bottom.style.cssText = `
        flex-shrink:0;
        background:#ffffff;
        padding:12px 16px 16px;
        box-shadow:0 -3px 15px rgba(0,0,0,.12);
        z-index:20;
    `;


    const addressBox =
        document.createElement("div");

    addressBox.id =
        "pickerAddress";

    addressBox.textContent =
        "Move the map to choose a location";

    addressBox.style.cssText = `
        background:#f6f7f7;
        border-radius:12px;
        padding:11px 13px;
        margin-bottom:10px;
        font-size:12px;
        color:#555;
        min-height:40px;
    `;


    const confirmButton =
        document.createElement("button");

    confirmButton.id =
        "pickerConfirm";

    confirmButton.type =
        "button";

    confirmButton.textContent =
        "CONFIRM LOCATION";

    confirmButton.style.cssText = `
        width:100%;
        height:48px;
        border:0;
        border-radius:24px;
        background:#202633;
        color:#ffffff;
        font-size:13px;
        font-weight:700;
        cursor:pointer;
    `;


    bottom.appendChild(
        addressBox
    );

    bottom.appendChild(
        confirmButton
    );


    overlay.appendChild(
        header
    );

    overlay.appendChild(
        mapArea
    );

    overlay.appendChild(
        bottom
    );

    document.body.appendChild(
        overlay
    );


    // Starting position
    let startingLocation =
        new google.maps.LatLng(
            21.1702,
            72.8311
        );


    if (
        type === "pickup" &&
        pickupPlace &&
        pickupPlace.geometry
    ) {

        startingLocation =
            pickupPlace.geometry.location;
    }


    if (
        type === "drop" &&
        dropPlace &&
        dropPlace.geometry
    ) {

        startingLocation =
            dropPlace.geometry.location;
    }


    pickerMap =
        new google.maps.Map(
            pickerMapElement,
            {
                center:
                    startingLocation,

                zoom:15,

                mapTypeControl:false,

                streetViewControl:false,

                fullscreenControl:false,

                gestureHandling:
                    "greedy"
            }
        );


    pickerGeocoder =
        new google.maps.Geocoder();


    pickerLocation =
        pickerMap.getCenter();


    updatePickerAddress(
        pickerLocation
    );


    pickerMap.addListener(
        "idle",
        () => {

            pickerLocation =
                pickerMap.getCenter();

            updatePickerAddress(
                pickerLocation
            );
        }
    );


    document
        .getElementById(
            "pickerClose"
        )
        .addEventListener(
            "click",
            () => {

                overlay.remove();

                pickerMap =
                    null;

                pickerLocation =
                    null;

                pickerType =
                    null;
            }
        );


    gpsButton.addEventListener(
        "click",
        () => {

            if (
                !navigator.geolocation
            ) {

                alert(
                    "Location is not supported."
                );

                return;
            }


            gpsButton.textContent =
                "⏳";


            navigator.geolocation.getCurrentPosition(

                position => {

                    const location =
                        new google.maps.LatLng(

                            position.coords.latitude,

                            position.coords.longitude
                        );


                    pickerMap.setCenter(
                        location
                    );

                    pickerMap.setZoom(
                        17
                    );

                    pickerLocation =
                        location;

                    gpsButton.textContent =
                        "📍";
                },


                error => {

                    console.error(
                        error
                    );

                    gpsButton.textContent =
                        "📍";

                    alert(
                        "Unable to get your location."
                    );
                },


                {
                    enableHighAccuracy:true,
                    timeout:15000,
                    maximumAge:0
                }
            );
        }
    );


    confirmButton.addEventListener(
        "click",
        () => {

            if (!pickerLocation) {
                return;
            }


            confirmButton.disabled =
                true;

            confirmButton.textContent =
                "SELECTING...";


            pickerGeocoder.geocode(

                {
                    location:
                        pickerLocation
                },

                (
                    results,
                    status
                ) => {

                    if (
                        status !== "OK" ||
                        !results ||
                        !results.length
                    ) {

                        confirmButton.disabled =
                            false;

                        confirmButton.textContent =
                            "CONFIRM LOCATION";

                        alert(
                            "Could not find this location."
                        );

                        return;
                    }


                    const address =
                        results[0]
                            .formatted_address;


                    const selected =
                        new google.maps.LatLng(

                            pickerLocation.lat(),

                            pickerLocation.lng()
                        );


                    setLocation(
                        pickerType,
                        selected,
                        address
                    );


                    overlay.remove();

                    pickerMap =
                        null;

                    pickerLocation =
                        null;

                    pickerType =
                        null;
                }
            );
        }
    );
}


// =========================================
// PICKER ADDRESS
// =========================================

function updatePickerAddress(
    location
) {

    const addressElement =
        document.getElementById(
            "pickerAddress"
        );

    if (
        !addressElement ||
        !pickerGeocoder ||
        !location
    ) {
        return;
    }

    addressElement.textContent =
        "Finding address...";


    pickerGeocoder.geocode(

        {
            location: location
        },

        (
            results,
            status
        ) => {

            if (
                status === "OK" &&
                results &&
                results.length
            ) {

                addressElement.textContent =
                    results[0]
                        .formatted_address;

            } else {

                addressElement.textContent =
                    "Move the map to choose a location";
            }
        }
    );
}


// =========================================
// ROUTE
// =========================================

function calculateRoute() {

    if (
        !pickupPlace ||
        !dropPlace
    ) {

        console.log(
            "Waiting for both pickup and drop locations..."
        );

        routeDistanceKm = 0;

        return;
    }


    const origin =
        pickupPlace
            .geometry
            .location;

    const destination =
        dropPlace
            .geometry
            .location;


    const originLat =
        typeof origin.lat === "function"
            ? origin.lat()
            : Number(origin.lat);

    const originLng =
        typeof origin.lng === "function"
            ? origin.lng()
            : Number(origin.lng);

    const destinationLat =
        typeof destination.lat === "function"
            ? destination.lat()
            : Number(destination.lat);

    const destinationLng =
        typeof destination.lng === "function"
            ? destination.lng()
            : Number(destination.lng);


    if (
        !Number.isFinite(originLat) ||
        !Number.isFinite(originLng) ||
        !Number.isFinite(destinationLat) ||
        !Number.isFinite(destinationLng)
    ) {

        console.error(
            "Invalid coordinates."
        );

        return;
    }


    directionsService.route(

        {
            origin:
                new google.maps.LatLng(
                    originLat,
                    originLng
                ),

            destination:
                new google.maps.LatLng(
                    destinationLat,
                    destinationLng
                ),

            travelMode:
                google.maps.TravelMode.DRIVING
        },

        (
            result,
            status
        ) => {

            console.log(
                "Directions status:",
                status
            );


            if (
                status !== "OK"
            ) {

                console.error(
                    "Directions request failed:",
                    status
                );

                routeDistanceKm = 0;

                hideRouteInfo();

                return;
            }


            directionsRenderer.setDirections(
                result
            );


            const route =
                result.routes[0];


            if (
                !route ||
                !route.legs ||
                !route.legs.length
            ) {

                return;
            }


            const leg =
                route.legs[0];


            const distance =
                leg.distance
                    ? leg.distance.text
                    : "—";


            const duration =
                leg.duration
                    ? leg.duration.text
                    : "—";


            // =====================================
            // SAVE NUMERIC DISTANCE
            // Google returns metres
            // =====================================

            if (
                leg.distance &&
                Number.isFinite(
                    Number(leg.distance.value)
                )
            ) {

                routeDistanceKm =
                    Number(
                        leg.distance.value
                    ) / 1000;

            } else {

                routeDistanceKm =
                    0;
            }


            console.log(
                "Distance:",
                distance
            );

            console.log(
                "Distance KM:",
                routeDistanceKm
            );

            console.log(
                "Duration:",
                duration
            );


            showRouteInfo(
                distance,
                duration
            );


            // Update optional fare display
            updateEstimatedFare();
        }
    );
}


// =========================================
// ESTIMATED FARE
// =========================================

function updateEstimatedFare() {

    if (!selectedVehicle) {
        return;
    }

    if (!routeDistanceKm) {
        return;
    }


    const pricePerKm =
        Number(
            selectedVehicle.pricePerKm || 0
        );

    const minimumKm =
        Number(
            selectedVehicle.minimumKm || 0
        );


    if (
        pricePerKm <= 0
    ) {
        return;
    }


    const chargeableKm =
        Math.max(
            routeDistanceKm,
            minimumKm
        );


    let estimatedAmount =
        chargeableKm *
        pricePerKm;


    // Round trip
    const tripType =
        getTripType();


    if (
        tripType === "round_trip"
    ) {

        estimatedAmount *= 2;
    }


    const amountElement =
        document.getElementById(
            "bookingEstimatedAmount"
        );


    if (amountElement) {

        amountElement.textContent =
            `₹${Math.round(
                estimatedAmount
            ).toLocaleString("en-IN")}`;
    }
}


// =========================================
// ROUTE INFO
// =========================================

function showRouteInfo(
    distance,
    duration
) {

    const routeInfo =
        document.getElementById(
            "routeInfo"
        );

    if (!routeInfo) {
        return;
    }


    const distanceElement =
        document.getElementById(
            "routeDistance"
        );

    const timeElement =
        document.getElementById(
            "routeTime"
        );


    if (
        distanceElement &&
        timeElement
    ) {

        distanceElement.textContent =
            distance;

        timeElement.textContent =
            " • " + duration;

    } else {

        routeInfo.innerHTML = `
            <strong>${escapeHTML(distance)}</strong>
            <span> • </span>
            ${escapeHTML(duration)}
        `;
    }


    routeInfo.classList.add(
        "active"
    );
}


function hideRouteInfo() {

    const routeInfo =
        document.getElementById(
            "routeInfo"
        );

    if (routeInfo) {

        routeInfo.classList.remove(
            "active"
        );
    }
}


// =========================================
// TRIP TYPE
// =========================================

let currentTripType =
    "one_way";


function setupTripType() {

    const roundTripBtn =
        document.getElementById(
            "roundTripBtn"
        );

    const oneWayBtn =
        document.getElementById(
            "oneWayBtn"
        );

    const returnDateField =
        document.getElementById(
            "returnDateField"
        );


    if (
        !roundTripBtn ||
        !oneWayBtn
    ) {
        return;
    }


    roundTripBtn.addEventListener(
        "click",
        () => {

            currentTripType =
                "round_trip";

            roundTripBtn.classList.add(
                "active"
            );

            oneWayBtn.classList.remove(
                "active"
            );


            if (returnDateField) {

                returnDateField.style.display =
                    "";
            }


            updateEstimatedFare();
        }
    );


    oneWayBtn.addEventListener(
        "click",
        () => {

            currentTripType =
                "one_way";

            oneWayBtn.classList.add(
                "active"
            );

            roundTripBtn.classList.remove(
                "active"
            );


            if (returnDateField) {

                returnDateField.style.display =
                    "none";
            }


            updateEstimatedFare();
        }
    );
}


// =========================================
// GET TRIP TYPE
// =========================================

function getTripType() {

    return currentTripType;
}


// =========================================
// PASSENGERS
// =========================================

let adults = 1;
let kids = 0;


function setupPassengers() {

    const passengerButton =
        document.getElementById(
            "passengerButton"
        );

    const passengerMenu =
        document.getElementById(
            "passengerMenu"
        );

    const passengerText =
        document.getElementById(
            "passengerText"
        );

    const adultCount =
        document.getElementById(
            "adultCount"
        );

    const kidCount =
        document.getElementById(
            "kidCount"
        );


    if (!passengerButton) {
        return;
    }


    function updatePassengers() {

        if (adultCount) {
            adultCount.textContent =
                adults;
        }

        if (kidCount) {
            kidCount.textContent =
                kids;
        }

        if (passengerText) {

            passengerText.textContent =
                `${adults} Adult${adults !== 1 ? "s" : ""}, ${kids} Kid${kids !== 1 ? "s" : ""}`;
        }
    }


    passengerButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            if (passengerMenu) {

                passengerMenu.classList.toggle(
                    "show"
                );
            }
        }
    );


    document
        .getElementById("adultPlus")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                adults++;

                updatePassengers();

                updateEstimatedFare();
            }
        );


    document
        .getElementById("adultMinus")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                if (adults > 1) {

                    adults--;

                    updatePassengers();
                }
            }
        );


    document
        .getElementById("kidPlus")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                kids++;

                updatePassengers();
            }
        );


    document
        .getElementById("kidMinus")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                if (kids > 0) {

                    kids--;

                    updatePassengers();
                }
            }
        );


    updatePassengers();


    // Pre-fill members from vehicle-list URL
    if (
        Number.isFinite(
            membersParam
        ) &&
        membersParam > 0
    ) {

        adults =
            Math.max(
                1,
                membersParam
            );

        kids = 0;

        updatePassengers();
    }
}


// =========================================
// DATES
// =========================================

function setupDates() {

    const journeyDate =
        document.getElementById(
            "journeyDate"
        );

    const returnDate =
        document.getElementById(
            "returnDate"
        );


    if (!journeyDate) {
        return;
    }


    const today =
        new Date();


    const yyyy =
        today.getFullYear();

    const mm =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dd =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    const todayString =
        `${yyyy}-${mm}-${dd}`;


    journeyDate.min =
        todayString;


    // Pre-fill selected travel date
    if (
        travelDateParam
    ) {

        journeyDate.value =
            travelDateParam;
    }


    if (returnDate) {

        returnDate.min =
            todayString;


        journeyDate.addEventListener(
            "change",
            () => {

                returnDate.min =
                    journeyDate.value;

                if (
                    returnDate.value &&
                    returnDate.value <
                    journeyDate.value
                ) {

                    returnDate.value =
                        journeyDate.value;
                }
            }
        );
    }
}


// =========================================
// PREFILL LOCATIONS
// =========================================

function prefillLocations() {

    const pickupInput =
        document.getElementById(
            "pickupInput"
        );

    const dropInput =
        document.getElementById(
            "dropInput"
        );


    if (
        pickupInput &&
        pickupParam
    ) {

        pickupInput.value =
            pickupParam;
    }


    if (
        dropInput &&
        dropParam
    ) {

        dropInput.value =
            dropParam;
    }
}


// =========================================
// BOOKING BUTTON
// =========================================

function setupBookingButton() {

    const bookButton =
        document.getElementById(
            "bookRideButton"
        );

    if (!bookButton) {
        return;
    }


    bookButton.addEventListener(
        "click",
        createBooking
    );
}


// =========================================
// CREATE BOOKING
// =========================================

async function createBooking() {

    const bookButton =
        document.getElementById(
            "bookRideButton"
        );

    const pickupTime =
        document.getElementById(
            "pickupTime"
        );

    const pickupInput =
        document.getElementById(
            "pickupInput"
        );

    const dropInput =
        document.getElementById(
            "dropInput"
        );

    const journeyDate =
        document.getElementById(
            "journeyDate"
        );

    const returnDate =
        document.getElementById(
            "returnDate"
        );

    const flightNumber =
        document.getElementById(
            "flightNumber"
        );


    // =====================================
    // LOGIN
    // =====================================

    const token =
        localStorage.getItem(
            "tripzovaToken"
        );


    if (!token) {

        const returnTo =
            encodeURIComponent(
                window.location.pathname +
                window.location.search
            );

        window.location.href =
            `login.html?redirect=${returnTo}`;

        return;
    }


    // =====================================
    // VEHICLE
    // =====================================

    if (!vehicleId) {

        showBookingMessage(
            "No vehicle was selected. Please select a vehicle first."
        );

        return;
    }


    if (!selectedVehicle) {

        showBookingMessage(
            "Vehicle details are still loading. Please try again."
        );

        return;
    }


    // =====================================
    // PICKUP
    // =====================================

    const pickup =
        pickupInput
            ?.value
            .trim();


    if (!pickup) {

        showBookingMessage(
            "Please select a pickup location."
        );

        pickupInput?.focus();

        return;
    }


    // =====================================
    // DROP
    // =====================================

    const drop =
        dropInput
            ?.value
            .trim();


    if (!drop) {

        showBookingMessage(
            "Please select a drop location."
        );

        dropInput?.focus();

        return;
    }


    // =====================================
    // DATE
    // =====================================

    const date =
        journeyDate
            ?.value;


    if (!date) {

        showBookingMessage(
            "Please select your journey date."
        );

        journeyDate?.focus();

        return;
    }


    // =====================================
    // PICKUP TIME
    // =====================================

    if (
        !pickupTime ||
        !pickupTime.value
    ) {

        showBookingMessage(
            "Please select a pickup time."
        );

        pickupTime?.focus();

        return;
    }


    // =====================================
    // ROUND TRIP RETURN DATE
    // =====================================

    const tripType =
        getTripType();


    if (
        tripType === "round_trip"
    ) {

        if (
            !returnDate ||
            !returnDate.value
        ) {

            showBookingMessage(
                "Please select your return date."
            );

            returnDate?.focus();

            return;
        }


        if (
            returnDate.value <
            date
        ) {

            showBookingMessage(
                "Return date cannot be before the journey date."
            );

            returnDate?.focus();

            return;
        }
    }


    // =====================================
    // ROUTE
    // =====================================

    if (
        !pickupPlace ||
        !dropPlace
    ) {

        showBookingMessage(
            "Please select valid pickup and drop locations from the map suggestions."
        );

        return;
    }


    if (
        !routeDistanceKm ||
        routeDistanceKm <= 0
    ) {

        showBookingMessage(
            "Please wait for the route distance to be calculated."
        );

        calculateRoute();

        return;
    }


    // =====================================
    // CAPACITY
    // =====================================

    const totalGuests =
        adults + kids;


    const seatCapacity =
        Number(
            selectedVehicle.seatCapacity || 0
        );


    if (
        seatCapacity > 0 &&
        totalGuests > seatCapacity
    ) {

        showBookingMessage(
            `This vehicle can accommodate only ${seatCapacity} passengers.`
        );

        return;
    }


    // =====================================
    // PARTNER
    // =====================================

    const partner =
        selectedVehicle.partner;


    const partnerId =
        typeof partner === "object"
            ? partner?._id
            : partner;


    if (!partnerId) {

        showBookingMessage(
            "This vehicle does not have a valid partner."
        );

        return;
    }


    // =====================================
    // ESTIMATE AMOUNT
    // =====================================

    const pricePerKm =
        Number(
            selectedVehicle.pricePerKm || 0
        );

    const minimumKm =
        Number(
            selectedVehicle.minimumKm || 0
        );


    const chargeableKm =
        Math.max(
            routeDistanceKm,
            minimumKm
        );


    let amount =
        chargeableKm *
        pricePerKm;


    if (
        tripType === "round_trip"
    ) {

        amount *= 2;
    }


    amount =
        Math.round(
            amount
        );


    // =====================================
    // NOTES
    // =====================================

    const notes =
        [
            destinationParam
                ? `Destination: ${destinationParam}`
                : "",

            drop
                ? `Drop: ${drop}`
                : ""
        ]
            .filter(Boolean)
            .join(" | ");


    // =====================================
    // REQUEST BODY
    // =====================================

    const bookingData = {

        partner:
            partnerId,

        vehicle:
            selectedVehicle._id ||
            vehicleId,

        serviceType:
            "ride",

        serviceName:
            selectedVehicle.vehicleName ||
            "Ride",

        pickup,

        drop,

        travelDate:
            date,

        returnDate:
            tripType === "round_trip"
                ? returnDate.value
                : null,

        tripType,

        pickupTime:
            pickupTime.value,

        flightNumber:
            flightNumber
                ? flightNumber.value.trim()
                : "",

        distanceKm:
            Number(
                routeDistanceKm.toFixed(2)
            ),

        guests:
            totalGuests,

        amount,

        paymentMethod:
            "pending",

        notes
    };


    console.log(
        "Creating booking:",
        bookingData
    );


    // =====================================
    // BUTTON LOADING
    // =====================================

    if (bookButton) {

        bookButton.disabled =
            true;

        bookButton.dataset.originalText =
            bookButton.textContent;

        bookButton.textContent =
            "CREATING BOOKING...";
    }


    clearBookingMessage();


    // =====================================
    // API REQUEST
    // =====================================

    try {

        const response =
            await fetch(
                "/api/bookings",
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(
                            bookingData
                        )
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to create booking."
            );
        }


        console.log(
            "Booking created:",
            data
        );


        // =================================
        // SUCCESS
        // =================================

        const booking =
            data.booking || {};


        const bookingNumber =
            booking.bookingNumber ||
            "";


        showBookingSuccess(
            bookingNumber
        );


    } catch (error) {

        console.error(
            "Create booking error:",
            error
        );


        showBookingMessage(
            error.message ||
            "Unable to create booking. Please try again."
        );


        if (bookButton) {

            bookButton.disabled =
                false;

            bookButton.textContent =
                bookButton.dataset.originalText ||
                "BOOK YOUR RIDE";
        }
    }
}


// =========================================
// BOOKING SUCCESS
// =========================================

function showBookingSuccess(
    bookingNumber
) {

    const message =
        document.getElementById(
            "bookingMessage"
        );


    if (!message) {
        return;
    }


    message.className =
        "booking-message success";


    message.innerHTML = `

        <strong>
            Booking request created successfully!
        </strong>

        ${
            bookingNumber
                ? `
                    <br>
                    <span>
                        Booking Number:
                        <strong>
                            ${escapeHTML(bookingNumber)}
                        </strong>
                    </span>
                  `
                : ""
        }

        <br>

        <span>
            Your selected partner will review your request.
        </span>

    `;


    message.classList.add(
        "active"
    );


    const bookButton =
        document.getElementById(
            "bookRideButton"
        );


    if (bookButton) {

        bookButton.disabled =
            true;

        bookButton.textContent =
            "BOOKING CREATED";
    }


    // Optional redirect if a customer bookings
    // page exists.
    /*
    setTimeout(() => {
        window.location.href = "my-bookings.html";
    }, 2500);
    */
}


// =========================================
// BOOKING MESSAGE
// =========================================

function showBookingMessage(
    text
) {

    const message =
        document.getElementById(
            "bookingMessage"
        );


    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        "booking-message error";


    message.classList.add(
        "active"
    );
}


function clearBookingMessage() {

    const message =
        document.getElementById(
            "bookingMessage"
        );


    if (!message) {
        return;
    }


    message.textContent =
        "";

    message.className =
        "booking-message";
}


// =========================================
// HTML ESCAPE
// =========================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// =========================================
// PREFILL PAGE DATA
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        prefillLocations();

    }
);


// =========================================
// LOGIN PROTECTION
// =========================================

const token =
    localStorage.getItem(
        "tripzovaToken"
    );

if (!token) {

    window.location.href =
        "login.html";
}