/* =========================================
   TRIPZOVA FORGOT PASSWORD
========================================= */

const forgotPasswordForm =
    document.getElementById("forgotPasswordForm");

const message =
    document.getElementById("message");


forgotPasswordForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        message.innerHTML = "";


        const email =
            document
                .getElementById("email")
                .value
                .trim()
                .toLowerCase();


        /* =====================================
           BASIC VALIDATION
        ===================================== */

        if (!email) {

            showError(
                "Please enter your email address."
            );

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/auth/forgot-password",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email
                        })
                    }
                );


            const data =
                await response.json();


            /* =================================
               BACKEND ERROR
            ================================= */

            if (!response.ok) {

                showError(
                    data.message ||
                    "Unable to process your request."
                );

                return;
            }


            /* =================================
               SUCCESS
            ================================= */

            message.innerHTML = `
                <div class="message-success">
                    ${data.message ||
                    "If an account exists with this email, a password reset link has been sent."}
                </div>
            `;

            forgotPasswordForm.reset();

        }


        catch (error) {

            console.error(
                "Forgot password error:",
                error
            );

            showError(
                "Unable to connect to TRIPZOVA. Please try again."
            );

        }

    }
);


/* =========================================
   ERROR MESSAGE
========================================= */

function showError(text) {

    message.innerHTML = `
        <div class="message-error">
            ${text}
        </div>
    `;

}