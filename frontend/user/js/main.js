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


            // Route the nav link to the right dashboard
            // for this account's role (customer/partner/admin).
            const dashboardLink =
                document.getElementById("dashboardLink");

            if (dashboardLink) {

                if (user.role === "admin") {

                    dashboardLink.href = "/admin/";
                    dashboardLink.textContent = "Admin Panel";

                } else if (user.role === "partner") {

                    dashboardLink.href = "/partner/";
                    dashboardLink.textContent = "Partner Panel";

                } else {

                    dashboardLink.href = "../customer-dashboard.html";
                    dashboardLink.textContent = "My Bookings";
                }
            }


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
   HOME SEARCH WIDGET

   Step 1 of the booking flow. This form lives
   only on the homepage - it collects pickup,
   drop, date and traveller count, then sends
   the person to the vehicle list page. Nobody
   reaches booking.html without a vehicle first,
   and nobody reaches the vehicle list without
   searching first.
========================================= */

const homeSearchForm =
    document.getElementById("homeSearchForm");

const searchFormMessage =
    document.getElementById("searchFormMessage");


if (homeSearchForm) {

    // Journey date can't be in the past.
    const searchDateInput =
        document.getElementById("searchDate");

    if (searchDateInput) {

        const today =
            new Date().toISOString().split("T")[0];

        searchDateInput.min = today;
    }


    homeSearchForm.addEventListener("submit", (event) => {

        event.preventDefault();

        const pickup =
            document.getElementById("searchPickup")
                ?.value.trim() || "";

        const drop =
            document.getElementById("searchDrop")
                ?.value.trim() || "";

        const travelDate =
            document.getElementById("searchDate")
                ?.value || "";

        const members =
            Number(
                document.getElementById("searchMembers")
                    ?.value || 1
            );


        if (!pickup || !drop || !travelDate) {

            if (searchFormMessage) {

                searchFormMessage.textContent =
                    "Please enter pickup, destination and journey date.";
            }

            return;
        }


        if (searchFormMessage) {
            searchFormMessage.textContent = "";
        }


        const params = new URLSearchParams();

        params.set("pickup", pickup);
        params.set("drop", drop);
        params.set("destination", drop);
        params.set("travelDate", travelDate);
        params.set(
            "members",
            String(
                Number.isFinite(members) && members > 0
                    ? members
                    : 1
            )
        );


        window.location.href =
            `../vehicle-list.html?${params.toString()}`;
    });

}