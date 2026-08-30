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

const partnerSignup =
    document.getElementById("partnerSignup");

const googleSignup =
    document.getElementById("googleSignup");

const createAccountBtn =
    document.querySelector(".create-account-btn");


/* =========================================
   REGISTRATION TYPE
========================================= */

let registrationType = "customer";


/* =========================================
   PARTNER FIELDS
========================================= */

const phoneGroup =
    document.getElementById("phoneGroup");

const cityGroup =
    document.getElementById("cityGroup");

const addressGroup =
    document.getElementById("addressGroup");

const phoneInput =
    document.getElementById("phone");

const cityInput =
    document.getElementById("city");

const addressInput =
    document.getElementById("address");


/* =========================================
   SHOW / HIDE PARTNER FIELDS
========================================= */

function showPartnerMode() {

    registrationType = "partner";

    if (phoneGroup) {
        phoneGroup.style.display = "block";
    }

    if (cityGroup) {
        cityGroup.style.display = "block";
    }

    if (addressGroup) {
        addressGroup.style.display = "block";
    }


    if (phoneInput) {
        phoneInput.required = true;
    }

    if (cityInput) {
        cityInput.required = true;
    }

    if (addressInput) {
        addressInput.required = true;
    }


    if (createAccountBtn) {
        createAccountBtn.textContent =
            "Apply as partner";
    }


    if (partnerSignup) {
        partnerSignup.style.display = "none";
    }


    message.innerHTML = "";
}


/* =========================================
   PARTNER BUTTON
========================================= */

if (partnerSignup) {

    partnerSignup.addEventListener(
        "click",
        showPartnerMode
    );

}


/* =========================================
   SHOW / HIDE PASSWORD
========================================= */

if (togglePassword && passwordInput) {

    togglePassword.addEventListener(
        "click",
        () => {

            const isPassword =
                passwordInput.type === "password";

            passwordInput.type =
                isPassword
                    ? "text"
                    : "password";


            togglePassword.setAttribute(
                "aria-label",
                isPassword
                    ? "Hide password"
                    : "Show password"
            );

        }
    );

}


/* =========================================
   REGISTER
========================================= */

if (registerForm) {

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
                    passwordInput.value,

                role:
                    registrationType

            };


            /* =====================================
               PARTNER INFORMATION
            ===================================== */

            if (registrationType === "partner") {

                userData.phone =
                    phoneInput.value.trim();

                userData.city =
                    cityInput.value.trim();

                userData.address =
                    addressInput.value.trim();


                if (
                    !userData.phone ||
                    !userData.city ||
                    !userData.address
                ) {

                    showError(
                        "Please complete all partner information."
                    );

                    return;
                }

            }


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

                if (createAccountBtn) {

                    createAccountBtn.disabled = true;

                    createAccountBtn.textContent =
                        registrationType === "partner"
                            ? "Submitting application..."
                            : "Creating account...";

                }


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


                    resetButton();

                    return;
                }


                /* =================================
                   SAVE TOKEN
                ================================= */

                if (data.token) {

                    localStorage.setItem(
                        "tripzovaToken",
                        data.token
                    );

                }


                /* =================================
                   SAVE USER
                ================================= */

                if (data.user) {

                    localStorage.setItem(
                        "tripzovaUser",
                        JSON.stringify(data.user)
                    );

                }


                /* =================================
                   PARTNER SUCCESS
                ================================= */

                if (registrationType === "partner") {

                    message.innerHTML = `
                        <div class="message-success">
                            Partner application submitted successfully.
                            Your application is now under review.
                        </div>
                    `;

                }

                else {

                    message.innerHTML = `
                        <div class="message-success">
                            Account created successfully.
                            Redirecting...
                        </div>
                    `;

                }


                /* =================================
                   REDIRECT
                ================================= */

                setTimeout(() => {

                    window.location.href =
                        "user/index.html";

                }, 1200);

            }


            catch (error) {

                console.error(
                    "Registration request failed:",
                    error
                );


                showError(
                    "Unable to connect to TRIPZOVA. Please try again."
                );


                resetButton();

            }

        }
    );

}


/* =========================================
   RESET BUTTON
========================================= */

function resetButton() {

    if (!createAccountBtn) {
        return;
    }

    createAccountBtn.disabled = false;

    createAccountBtn.textContent =
        registrationType === "partner"
            ? "Apply as partner"
            : "Create account";

}


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