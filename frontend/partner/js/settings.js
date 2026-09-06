// =====================================================
// TRIPZOVA PARTNER - SETTINGS
// =====================================================

(function () {
    "use strict";


    async function loadSettings() {

        hideError();

        try {

            const data = await partnerFetch("/api/partners/profile");

            const profile = data.profile || {};
            const user = profile.user || {};

            const name =
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                profile.displayName || "-";

            setText("pSettingsName", name);
            setText("pSettingsEmail", user.email || profile.email || "-");
            setText("pSettingsPhone", user.phone || profile.phone || "-");
            setText("pSettingsCity", user.city || profile.city || "-");
            setText(
                "pSettingsStatus",
                formatStatus(user.accountStatus || "active")
            );

        } catch (error) {

            console.error("Load partner settings error:", error);

            showError(
                error.message || "Unable to load your account details."
            );
        }
    }


    async function sendResetLink() {

        const email =
            document.getElementById("pSettingsEmail")?.textContent.trim();

        if (!email || email === "-") {
            showMessage("Unable to find your account email.", "danger");
            return;
        }

        const button = document.getElementById("pSendResetLinkBtn");

        if (button) {
            button.disabled = true;
            button.textContent = "Sending...";
        }

        try {

            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Unable to send reset email.");
            }

            showMessage(
                "If that email exists, a reset link has been sent.",
                "success"
            );

        } catch (error) {

            console.error("Send reset link error:", error);
            showMessage(error.message || "Unable to send reset email.", "danger");

        } finally {

            if (button) {
                button.disabled = false;
                button.innerHTML =
                    '<i class="bi bi-envelope"></i> Send Password Reset Email';
            }
        }
    }


    // =================================================
    // HELPERS
    // =================================================

    function showMessage(text, type) {
        const el = document.getElementById("pSettingsMessage");
        if (!el) return;
        el.style.display = "block";
        el.className =
            `partner-alert partner-alert-${type === "success" ? "success" : "danger"} mb-3`;
        el.textContent = text;
    }

    function showError(message) {
        const el = document.getElementById("settingsError");
        if (el) {
            el.style.display = "block";
            el.className = "partner-alert partner-alert-danger mb-4";
            el.textContent = message;
        }
    }

    function hideError() {
        const el = document.getElementById("settingsError");
        if (el) el.style.display = "none";
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

        loadSettings();

        document.getElementById("pSendResetLinkBtn")
            ?.addEventListener("click", sendResetLink);
    });

})();
