/* =========================================
   TRIPZOVA REGISTER
========================================= */

const registerForm =
    document.getElementById("registerForm");

const message =
    document.getElementById("message");

const togglePassword =
    document.getElementById("togglePassword");

const passwordInput =
    document.getElementById("password");


/* =========================================
   SHOW / HIDE PASSWORD
========================================= */

if (togglePassword && passwordInput) {

    togglePassword.addEventListener("click", () => {

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type =
            isPassword ? "text" : "password";

        togglePassword.setAttribute(
            "aria-label",
            isPassword
                ? "Hide password"
                : "Show password"
        );

    });

}


/* =========================================
   REGISTER
========================================= */

registerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        message.innerHTML = "";


        const userData = {

            firstName:
                document
                    .getElementById("firstName")
                    .value
                    .trim(),

            lastName:
                document
                    .getElementById("lastName")
                    .value
                    .trim(),

            email:
                document
                    .getElementById("email")
                    .value
                    .trim()
                    .toLowerCase(),

            password:
                passwordInput.value

        };


        /* =====================================
           BASIC VALIDATION
        ===================================== */

        if (
            !userData.firstName ||
            !userData.lastName ||
            !userData.email ||
            !userData.password
        ) {

            showError(
                "Please fill in all required fields."
            );

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/users/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(userData)
                    }
                );


            const data =
                await response.json();


            /* =================================
               REGISTRATION FAILED
            ================================= */

            if (!response.ok) {

                showError(
                    data.message ||
                    "Unable to create your account."
                );

                return;
            }


            /* =================================
               REGISTRATION SUCCESS
            ================================= */

            /*
             * If the backend returns a token and
             * user, save them immediately.
             */

            if (data.token) {

                localStorage.setItem(
                    "tripzovaToken",
                    data.token
                );
            }


            if (data.user) {

                localStorage.setItem(
                    "tripzovaUser",
                    JSON.stringify(data.user)
                );
            }


            message.innerHTML = `
                <div class="message-success">
                    Account created successfully.
                    Redirecting...
                </div>
            `;


            /* =================================
               REDIRECT TO USER WEBSITE
            ================================= */

            setTimeout(() => {

                window.location.href =
                    "user/index.html";

            }, 800);

        }


        catch (error) {

            console.error(
                "Registration request failed:",
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