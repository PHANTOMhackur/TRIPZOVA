const resetPasswordForm =
    document.getElementById("resetPasswordForm");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const togglePassword =
    document.getElementById("togglePassword");

const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");

const message =
    document.getElementById("message");


// Get token from URL
const urlParams = new URLSearchParams(
    window.location.search
);

const token = urlParams.get("token");


// Check whether token exists
if (!token) {

    message.innerHTML = `
        <div class="message-error">
            This password reset link is invalid.
        </div>
    `;

    resetPasswordForm.style.display = "none";
}


// Show / hide password
togglePassword.addEventListener("click", () => {

    passwordInput.type =
        passwordInput.type === "password"
            ? "text"
            : "password";
});


// Show / hide confirm password
toggleConfirmPassword.addEventListener("click", () => {

    confirmPasswordInput.type =
        confirmPasswordInput.type === "password"
            ? "text"
            : "password";
});


// Submit reset form
resetPasswordForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        message.innerHTML = "";

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        // Check matching passwords
        if (password !== confirmPassword) {

            message.innerHTML = `
                <div class="message-error">
                    Passwords do not match.
                </div>
            `;

            return;
        }


        // Minimum password length
        if (password.length < 8) {

            message.innerHTML = `
                <div class="message-error">
                    Password must be at least 8 characters.
                </div>
            `;

            return;
        }


        try {

            const response = await fetch(
                "/api/auth/reset-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        token,
                        password
                    })
                }
            );

            const data =
                await response.json();


            if (!response.ok) {

                message.innerHTML = `
                    <div class="message-error">
                        ${data.message}
                    </div>
                `;

                return;
            }


            message.innerHTML = `
                <div class="message-success">
                    Password reset successfully.
                    Redirecting to login...
                </div>
            `;


            resetPasswordForm.reset();


            setTimeout(() => {

                window.location.href =
                    "login.html";

            }, 1500);


        } catch (error) {

            console.error(
                "Reset password error:",
                error
            );

            message.innerHTML = `
                <div class="message-error">
                    Unable to connect to TRIPZOVA.
                    Please try again.
                </div>
            `;
        }
    }
);
