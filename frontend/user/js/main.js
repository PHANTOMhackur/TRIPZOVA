/* =========================================
   TRIPZOVA USER WEBSITE
   MAIN JAVASCRIPT
========================================= */


/* =========================================
   ACCORDION
========================================= */

const accordionButtons =
    document.querySelectorAll(".accordion-button");


accordionButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const currentItem =
            button.closest(".accordion-item");


        const isAlreadyOpen =
            currentItem.classList.contains("active");


        // Close every accordion item
        document
            .querySelectorAll(".accordion-item")
            .forEach((item) => {

                item.classList.remove("active");

                const itemButton =
                    item.querySelector(".accordion-button");

                if (itemButton) {
                    itemButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }

            });


        // Open clicked item
        if (!isAlreadyOpen) {

            currentItem.classList.add("active");

            button.setAttribute(
                "aria-expanded",
                "true"
            );

        }

    });

});


/* =========================================
   MOBILE NAVIGATION
========================================= */

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const navLinks =
    document.querySelector(".nav-links");

const authButtons =
    document.querySelector(".auth-buttons");


if (mobileMenuButton) {

    mobileMenuButton.addEventListener(
        "click",
        () => {

            navLinks.classList.toggle(
                "mobile-active"
            );

            authButtons.classList.toggle(
                "mobile-active"
            );

        }
    );

}


/* =========================================
   CLOSE MOBILE MENU AFTER CLICK
========================================= */

document
    .querySelectorAll(".nav-links a")
    .forEach((link) => {

        link.addEventListener("click", () => {

            navLinks.classList.remove(
                "mobile-active"
            );

            authButtons.classList.remove(
                "mobile-active"
            );

        });

    });

    /* =========================================
   AUTHENTICATION STATE
========================================= */

const guestButtons =
    document.getElementById("guestButtons");

const userButtons =
    document.getElementById("userButtons");

const userGreeting =
    document.getElementById("userGreeting");

const logoutButton =
    document.getElementById("logoutButton");


function updateAuthenticationState() {

    const token =
        localStorage.getItem("tripzovaToken");

    const storedUser =
        localStorage.getItem("tripzovaUser");


    // User is logged in
    if (token && storedUser) {

        try {

            const user =
                JSON.parse(storedUser);

            guestButtons.style.display = "none";

            userButtons.style.display = "flex";


            const name =
                user.name ||
                user.firstName ||
                user.email ||
                "User";


            userGreeting.textContent =
                `Hi, ${name}`;


        } catch (error) {

            console.error(
                "Unable to read user data:",
                error
            );

            showGuestButtons();
        }

    } else {

        showGuestButtons();
    }
}


function showGuestButtons() {

    guestButtons.style.display = "flex";

    userButtons.style.display = "none";
}


/* =========================================
   LOGOUT
========================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "tripzovaToken"
            );

            localStorage.removeItem(
                "tripzovaUser"
            );

            window.location.href =
                "/user/";
        }
    );

}


/* =========================================
   INITIALIZE AUTH STATE
========================================= */

updateAuthenticationState();

/* =========================================
   BOOKING WIDGET
========================================= */

const roundTripBtn = document.getElementById("roundTripBtn");
const oneWayBtn = document.getElementById("oneWayBtn");
const returnDateField = document.getElementById("returnDateField");

const journeyDate = document.getElementById("journeyDate");
const returnDate = document.getElementById("returnDate");

const passengerButton = document.getElementById("passengerButton");
const passengerMenu = document.getElementById("passengerMenu");

const passengerText = document.getElementById("passengerText");

const adultCount = document.getElementById("adultCount");
const kidCount = document.getElementById("kidCount");

const adultMinus = document.getElementById("adultMinus");
const adultPlus = document.getElementById("adultPlus");

const kidMinus = document.getElementById("kidMinus");
const kidPlus = document.getElementById("kidPlus");

const bookRideButton = document.getElementById("bookRideButton");
const bookingMessage = document.getElementById("bookingMessage");

let adults = 1;
let kids = 0;


/* Trip type */

roundTripBtn.addEventListener("click", () => {

    roundTripBtn.classList.add("active");
    oneWayBtn.classList.remove("active");

    returnDateField.style.display = "block";
});


oneWayBtn.addEventListener("click", () => {

    oneWayBtn.classList.add("active");
    roundTripBtn.classList.remove("active");

    returnDateField.style.display = "none";

    returnDate.value = "";
});


/* Passenger menu */

passengerButton.addEventListener("click", (event) => {

    event.stopPropagation();

    passengerMenu.classList.toggle("show");

});


document.addEventListener("click", (event) => {

    if (
        !passengerMenu.contains(event.target) &&
        !passengerButton.contains(event.target)
    ) {
        passengerMenu.classList.remove("show");
    }

});


/* Passenger count */

function updatePassengers() {

    adultCount.textContent = adults;
    kidCount.textContent = kids;

    passengerText.textContent =
        `${adults} Adult${adults !== 1 ? "s" : ""}, ` +
        `${kids} Kid${kids !== 1 ? "s" : ""}`;
}


adultMinus.addEventListener("click", () => {

    if (adults > 1) {
        adults--;
        updatePassengers();
    }

});


adultPlus.addEventListener("click", () => {

    adults++;
    updatePassengers();

});


kidMinus.addEventListener("click", () => {

    if (kids > 0) {
        kids--;
        updatePassengers();
    }

});


kidPlus.addEventListener("click", () => {

    kids++;
    updatePassengers();

});


/* Minimum journey date */

const today = new Date().toISOString().split("T")[0];

journeyDate.min = today;
returnDate.min = today;


/* Journey date changes */

journeyDate.addEventListener("change", () => {

    returnDate.min = journeyDate.value;

});


/* Book */

bookRideButton.addEventListener("click", () => {

    const pickup =
        document.getElementById("pickupInput").value.trim();

    const drop =
        document.getElementById("dropInput").value.trim();

    const flight =
        document.getElementById("flightNumber").value.trim();

    const journey =
        journeyDate.value;

    const returnDateValue =
        returnDate.value;


    if (!pickup || !drop || !journey) {

        bookingMessage.textContent =
            "Please enter pickup, drop location and journey date.";

        return;
    }


    if (
        roundTripBtn.classList.contains("active") &&
        !returnDateValue
    ) {

        bookingMessage.textContent =
            "Please select a return date.";

        return;
    }


    bookingMessage.textContent =
        "Booking details are ready.";

    console.log({
        tripType:
            roundTripBtn.classList.contains("active")
                ? "round-trip"
                : "one-way",

        pickup,
        drop,
        flight,
        journeyDate: journey,
        returnDate: returnDateValue,
        adults,
        kids
    });

});