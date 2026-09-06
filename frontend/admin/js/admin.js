/* =========================================================
   TRIPZOVA ADMIN
   Shared Admin JavaScript
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    if (!enforceAdminAccess()) {
        return;
    }

    initializeAdmin();

});


/* =========================================================
   ACCESS GUARD

   Runs before anything else renders. This is a UX guard so
   a customer or partner who types /admin/ in the address bar
   doesn't see the admin shell at all - real protection is
   still enforced server-side by adminMiddleware on every
   /api/admin/* call, since a client-side check alone can
   always be bypassed by someone editing localStorage.
========================================================= */

function enforceAdminAccess() {

    const token =
        localStorage.getItem("tripzovaToken");

    if (!token) {

        const returnTo =
            encodeURIComponent(
                window.location.pathname +
                window.location.search
            );

        window.location.replace(
            `../login.html?redirect=${returnTo}`
        );

        return false;
    }


    let user = null;

    try {

        const storedUser =
            localStorage.getItem("tripzovaUser");

        user =
            storedUser
                ? JSON.parse(storedUser)
                : null;

    } catch (error) {

        user = null;
    }


    if (!user || user.role !== "admin") {

        window.location.replace("/user/");

        return false;
    }


    return true;
}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeAdmin() {

    setupSidebar();
    setupLogout();
    setupAdminProfile();
    setCurrentDate();
    loadAdminUser();

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const sidebar =
        document.getElementById("adminSidebar");

    const overlay =
        document.getElementById("sidebarOverlay");

    const mobileButton =
        document.getElementById("mobileMenuBtn");

    const closeButton =
        document.getElementById("sidebarClose");


    if (mobileButton) {

        mobileButton.addEventListener(
            "click",
            () => {

                sidebar.classList.add("open");
                overlay.classList.add("active");

            }
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeSidebar
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    function closeSidebar() {

        sidebar.classList.remove("open");
        overlay.classList.remove("active");

    }


    /*
        Close mobile sidebar after
        clicking a navigation link.
    */

    document
        .querySelectorAll(".sidebar-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <= 991
                    ) {
                        closeSidebar();
                    }

                }
            );

        });

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutButton =
        document.getElementById("logoutButton");


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        () => {

            const confirmed =
                window.confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmed) {
                return;
            }


            /*
                Remove TRIPZOVA authentication.
            */

            localStorage.removeItem(
                "tripzovaToken"
            );

            localStorage.removeItem(
                "tripzovaUser"
            );


            /*
                Future admin-specific token
                can also be removed here.
            */

            localStorage.removeItem(
                "tripzovaAdminToken"
            );

            localStorage.removeItem(
                "tripzovaAdmin"
            );


            window.location.href =
                "../login.html";

        }
    );

}


/* =========================================================
   ADMIN PROFILE
========================================================= */

function setupAdminProfile() {

    const profile =
        document.querySelector(".admin-profile");


    if (!profile) {
        return;
    }


    profile.addEventListener(
        "click",
        () => {

            /*
                Profile dropdown can be added
                here later.
            */

        }
    );

}


/* =========================================================
   LOAD ADMIN USER
========================================================= */

function loadAdminUser() {

    const adminName =
        document.getElementById("adminName");


    if (!adminName) {
        return;
    }


    let user = null;


    try {

        const storedUser =
            localStorage.getItem(
                "tripzovaUser"
            );


        if (storedUser) {

            user =
                JSON.parse(storedUser);

        }

    } catch (error) {

        console.error(
            "Could not read TRIPZOVA user:",
            error
        );

    }


    if (!user) {
        return;
    }


    const firstName =
        user.firstName || "";

    const lastName =
        user.lastName || "";


    const fullName =
        `${firstName} ${lastName}`.trim();


    if (fullName) {

        adminName.textContent =
            fullName;

    }

}


/* =========================================================
   CURRENT DATE
========================================================= */

function setCurrentDate() {

    const dateElement =
        document.getElementById("currentDate");


    if (!dateElement) {
        return;
    }


    const now =
        new Date();


    const formatted =
        now.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    dateElement.textContent =
        formatted;

}


/* =========================================================
   API HELPER
========================================================= */

async function adminFetch(url, options = {}) {

    const token =
        localStorage.getItem("tripzovaToken");


    if (!token) {

        window.location.href =
            "../login.html";

        throw new Error(
            "Admin login session expired."
        );

    }


    const fetchOptions = {
        ...options,

        headers: {
            ...(options.headers || {}),
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    };


    try {

        const response =
            await fetch(url, fetchOptions);


        const text =
            await response.text();


        let data = {};


        try {

            data =
                text
                    ? JSON.parse(text)
                    : {};

        } catch {

            data = {
                message: text
            };

        }


        console.log(
            "ADMIN API:",
            url,
            response.status,
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Admin request failed (${response.status}).`
            );

        }


        return data;

    } catch (error) {

        console.error(
            "ADMIN API ERROR:",
            url,
            error
        );

        throw error;

    }

}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(value) {

    const number =
        Number(value) || 0;


    return number.toLocaleString(
        "en-IN"
    );

}


/* =========================================================
   CURRENCY FORMAT
========================================================= */

function formatCurrency(value) {

    const number =
        Number(value) || 0;


    return number.toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    switch (
        String(status || "")
            .toLowerCase()
    ) {

        case "approved":
        case "active":
        case "completed":
        case "success":
        case "paid":
            return "status-approved";


        case "pending":
        case "processing":
            return "status-pending";


        case "rejected":
        case "blocked":
        case "cancelled":
        case "failed":
        case "refunded":
            return "status-rejected";


        case "suspended":
            return "status-suspended";


        default:
            return "status-default";

    }

}


/* =========================================================
   GLOBAL HELPERS
========================================================= */

window.adminFetch =
    adminFetch;

window.formatNumber =
    formatNumber;

window.formatCurrency =
    formatCurrency;

window.escapeHTML =
    escapeHTML;

window.getStatusClass =
    getStatusClass;