// =====================================================
// TRIPZOVA ADMIN - SETTINGS
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();

    loadProfile();

    document.getElementById("sendResetLinkBtn")
        ?.addEventListener("click", sendResetLink);
});


function loadProfile() {

    let user = null;

    try {
        const raw = localStorage.getItem("tripzovaUser");
        user = raw ? JSON.parse(raw) : null;
    } catch (error) {
        user = null;
    }

    if (!user) return;

    const name =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.name || "-";

    setText("settingsName", name);
    setText("settingsEmail", user.email || "-");
    setText("settingsRole", user.role ? capitalize(user.role) : "Admin");
}


async function sendResetLink() {

    let user = null;

    try {
        const raw = localStorage.getItem("tripzovaUser");
        user = raw ? JSON.parse(raw) : null;
    } catch (error) {
        user = null;
    }

    if (!user || !user.email) {
        showMessage("Unable to find your account email.", "danger");
        return;
    }

    const button = document.getElementById("sendResetLinkBtn");

    if (button) {
        button.disabled = true;
        button.textContent = "Sending...";
    }

    try {

        const response = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email })
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


// =========================================================
// HELPERS
// =========================================================

function showMessage(text, type) {
    const el = document.getElementById("settingsMessage");
    if (!el) return;
    el.style.display = "block";
    el.className = `admin-error mb-3 ${type === "success" ? "text-success" : ""}`;
    el.textContent = text;
}

function capitalize(value) {
    if (!value) return "-";
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent =
            value === undefined || value === null || value === "" ? "-" : value;
    }
}
