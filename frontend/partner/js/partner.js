// =====================================================
// TRIPZOVA PARTNER PANEL - COMMON JAVASCRIPT
// =====================================================

(function () {
    "use strict";


    // =================================================
    // AUTHENTICATION
    // =================================================

    function getPartnerToken() {
        return localStorage.getItem("tripzovaToken");
    }


    function getStoredUser() {
        try {
            const user = localStorage.getItem("tripzovaUser");

            if (!user) {
                return null;
            }

            return JSON.parse(user);
        } catch (error) {
            console.error("Unable to read stored user:", error);
            return null;
        }
    }


    function requirePartnerLogin() {
        const token = getPartnerToken();

        if (!token) {
            window.location.href = "../login.html";
            return false;
        }

        return true;
    }


    // =================================================
    // API
    // =================================================

    async function partnerFetch(url, options = {}) {
        const token = getPartnerToken();

        if (!token) {
            window.location.href = "../login.html";
            throw new Error("Authentication required.");
        }

        const requestOptions = {
            ...options,
            headers: {
                ...(options.headers || {}),
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        };

        const response = await fetch(url, requestOptions);

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (!response.ok) {
            throw new Error(
                data.message || "Partner request failed."
            );
        }

        return data;
    }


    // =================================================
    // HELPERS
    // =================================================

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }


    function formatNumber(value) {
        const number = Number(value || 0);

        return number.toLocaleString("en-IN");
    }


    function formatCurrency(value) {
        const number = Number(value || 0);

        return `₹${number.toLocaleString("en-IN")}`;
    }


    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function getInitials(name) {
        if (!name) {
            return "P";
        }

        const words = String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 1) {
            return words[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            words[0].charAt(0) +
            words[words.length - 1].charAt(0)
        ).toUpperCase();
    }


    function getStatusClass(status) {
        const normalized = String(status || "")
            .toLowerCase();

        switch (normalized) {
            case "approved":
                return "partner-status-approved";

            case "active":
                return "partner-status-active";

            case "pending":
                return "partner-status-pending";

            case "rejected":
                return "partner-status-rejected";

            case "blocked":
                return "partner-status-blocked";

            case "inactive":
                return "partner-status-inactive";

            case "confirmed":
                return "partner-status-confirmed";

            default:
                return "partner-status-inactive";
        }
    }


    function formatStatus(status) {
        if (!status) {
            return "Unknown";
        }

        return String(status)
            .replace(/_/g, " ")
            .replace(/\b\w/g, function (letter) {
                return letter.toUpperCase();
            });
    }


    // =================================================
    // SIDEBAR
    // =================================================

    function initializeSidebar() {
        const sidebar =
            document.getElementById("partnerSidebar");

        const menuToggle =
            document.getElementById("partnerMenuToggle");

        const overlay =
            document.getElementById(
                "partnerSidebarOverlay"
            );

        if (!sidebar) {
            return;
        }


        function openSidebar() {
            sidebar.classList.add("open");

            if (overlay) {
                overlay.classList.add("show");
            }

            document.body.style.overflow = "hidden";
        }


        function closeSidebar() {
            sidebar.classList.remove("open");

            if (overlay) {
                overlay.classList.remove("show");
            }

            document.body.style.overflow = "";
        }


        if (menuToggle) {
            menuToggle.addEventListener(
                "click",
                function () {
                    if (
                        sidebar.classList.contains("open")
                    ) {
                        closeSidebar();
                    } else {
                        openSidebar();
                    }
                }
            );
        }


        if (overlay) {
            overlay.addEventListener(
                "click",
                closeSidebar
            );
        }


        const sidebarLinks =
            sidebar.querySelectorAll(
                ".partner-nav-link"
            );

        sidebarLinks.forEach(function (link) {
            link.addEventListener(
                "click",
                function () {
                    if (
                        window.innerWidth <= 991
                    ) {
                        closeSidebar();
                    }
                }
            );
        });


        window.addEventListener(
            "resize",
            function () {
                if (window.innerWidth > 991) {
                    closeSidebar();
                }
            }
        );
    }


    // =================================================
    // ACTIVE SIDEBAR LINK
    // =================================================

    function initializeActiveLink() {
        const currentPage =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();

        const links =
            document.querySelectorAll(
                ".partner-nav-link"
            );

        links.forEach(function (link) {
            const href =
                link.getAttribute("href");

            if (!href || href === "#") {
                return;
            }

            const linkPage =
                href.split("/")
                    .pop()
                    .toLowerCase();

            if (
                linkPage === currentPage
            ) {
                link.classList.add("active");
            }
        });
    }


    // =================================================
    // LOGOUT
    // =================================================

    function initializeLogout() {
        const logoutButton =
            document.getElementById(
                "partnerLogoutBtn"
            );

        if (!logoutButton) {
            return;
        }

        logoutButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                localStorage.removeItem(
                    "tripzovaToken"
                );

                localStorage.removeItem(
                    "tripzovaUser"
                );

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


    // =================================================
    // PARTNER PROFILE IN NAVBAR
    // =================================================

    async function loadNavbarProfile() {
        const storedUser =
            getStoredUser();

        if (storedUser) {
            const storedName =
                `${storedUser.firstName || ""} ${storedUser.lastName || ""}`
                    .trim();

            if (storedName) {
                setText(
                    "partnerNavbarName",
                    storedName
                );

                setText(
                    "welcomePartnerName",
                    storedName
                );

                const initials =
                    getInitials(storedName);

                setText(
                    "partnerNavbarInitials",
                    initials
                );
            }
        }


        const profileName =
            document.getElementById(
                "partnerNavbarName"
            );

        const avatar =
            document.getElementById(
                "partnerNavbarAvatar"
            );

        try {
            const data =
                await partnerFetch(
                    "/api/partners/profile"
                );

            const profile =
                data.profile;

            if (!profile) {
                return;
            }


            if (
                profile.displayName
            ) {
                setText(
                    "partnerNavbarName",
                    profile.displayName
                );

                setText(
                    "welcomePartnerName",
                    profile.displayName
                );

                setText(
                    "partnerNavbarInitials",
                    getInitials(
                        profile.displayName
                    )
                );
            }


            if (
                profile.profilePicture &&
                avatar
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


            const profileButton =
                document.getElementById(
                    "partnerNavbarProfile"
                );

            if (profileButton) {
                profileButton.addEventListener(
                    "click",
                    function () {
                        window.location.href =
                            "profile.html";
                    }
                );
            }

        } catch (error) {
            console.error(
                "Unable to load navbar profile:",
                error
            );

            if (profileName) {
                profileName.textContent =
                    "Partner";
            }
        }
    }


    // =================================================
    // PARTNER APPROVAL STATUS
    // =================================================

    async function loadPartnerApprovalStatus() {
        const alert =
            document.getElementById(
                "partnerApprovalAlert"
            );

        const message =
            document.getElementById(
                "partnerApprovalMessage"
            );

        if (!alert || !message) {
            return;
        }

        try {
            const data =
                await partnerFetch(
                    "/api/partners/profile"
                );

            const profile =
                data.profile;

            const user =
                profile?.user;

            if (!user) {
                return;
            }

            const status =
                user.partnerStatus;

            alert.style.display = "block";


            if (status === "approved") {

                alert.className =
                    "partner-alert partner-alert-success mb-4";

                message.innerHTML =
                    "<strong>Partner account approved.</strong> You can add and manage your vehicles.";

            } else if (status === "pending") {

                alert.className =
                    "partner-alert partner-alert-warning mb-4";

                message.innerHTML =
                    "<strong>Partner application under review.</strong> Vehicle listing will become available after approval.";

            } else if (status === "rejected") {

                alert.className =
                    "partner-alert partner-alert-danger mb-4";

                message.innerHTML =
                    "<strong>Partner application rejected.</strong> Please contact TRIPZOVA support for more information.";

            } else {

                alert.className =
                    "partner-alert partner-alert-info mb-4";

                message.innerHTML =
                    "Complete your partner profile to get started.";

            }

        } catch (error) {
            console.error(
                "Unable to load partner status:",
                error
            );
        }
    }


    // =================================================
    // GLOBAL INITIALIZATION
    // =================================================

    async function initializePartner() {

        if (!requirePartnerLogin()) {
            return;
        }


        initializeSidebar();

        initializeActiveLink();

        initializeLogout();

        await loadNavbarProfile();

        await loadPartnerApprovalStatus();
    }


    // =================================================
    // GLOBAL EXPORTS
    // =================================================

    window.getPartnerToken =
        getPartnerToken;

    window.getStoredUser =
        getStoredUser;

    window.requirePartnerLogin =
        requirePartnerLogin;

    window.partnerFetch =
        partnerFetch;

    window.setText =
        setText;

    window.formatNumber =
        formatNumber;

    window.formatCurrency =
        formatCurrency;

    window.escapeHTML =
        escapeHTML;

    window.getInitials =
        getInitials;

    window.getStatusClass =
        getStatusClass;

    window.formatStatus =
        formatStatus;


    // =================================================
    // START
    // =================================================

    document.addEventListener(
        "DOMContentLoaded",
        initializePartner
    );

})();