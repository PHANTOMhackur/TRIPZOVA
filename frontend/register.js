/* =====================================================
   TRIPZOVA REGISTER
   MSG91 OTP CUSTOM UI
===================================================== */


/* =====================================================
   DOM ELEMENTS
===================================================== */

const registerForm =
    document.getElementById("registerForm");

const message =
    document.getElementById("message");

const firstNameInput =
    document.getElementById("firstName");

const lastNameInput =
    document.getElementById("lastName");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");

const phoneInput =
    document.getElementById("phone");

const sendOtpBtn =
    document.getElementById("sendOtpBtn");

const verifyOtpBtn =
    document.getElementById("verifyOtpBtn");

const otpInput =
    document.getElementById("otp");

const otpGroup =
    document.getElementById("otpGroup");

const otpStatus =
    document.getElementById("otpStatus");

const cityInput =
    document.getElementById("city");

const addressInput =
    document.getElementById("address");

const cityGroup =
    document.getElementById("cityGroup");

const addressGroup =
    document.getElementById("addressGroup");

const partnerSignup =
    document.getElementById("partnerSignup");

const googleSignup =
    document.getElementById("googleSignup");

const createAccountBtn =
    document.getElementById("createAccountBtn");

const termsCheckbox =
    document.getElementById("terms");


/* =====================================================
   REGISTRATION STATE
===================================================== */

let registrationType =
    "customer";


let phoneVerified =
    false;


let otpPhoneNumber =
    "";


let msg91AccessToken =
    "";


let otpRequestInProgress =
    false;


let otpVerifyInProgress =
    false;


/* =====================================================
   PAGE READY
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "TRIPZOVA registration page loaded."
        );

        waitForMSG91();

    }
);


/* =====================================================
   WAIT FOR MSG91
===================================================== */

function waitForMSG91() {

    let attempts =
        0;

    const maxAttempts =
        50;


    const timer =
        setInterval(
            function () {

                attempts++;


                if (
                    typeof window.sendOtp ===
                    "function"
                ) {

                    clearInterval(timer);

                    console.log(
                        "MSG91 sendOtp available."
                    );

                    console.log(
                        "MSG91 verifyOtp:",
                        typeof window.verifyOtp
                    );

                    console.log(
                        "MSG91 retryOtp:",
                        typeof window.retryOtp
                    );

                    return;

                }


                if (
                    attempts >= maxAttempts
                ) {

                    clearInterval(timer);

                    console.error(
                        "MSG91 methods were not loaded."
                    );

                    showError(
                        "Phone verification service could not be loaded. Please refresh the page."
                    );

                }

            },
            200
        );

}


/* =====================================================
   PARTNER MODE
===================================================== */

function showPartnerMode() {

    registrationType =
        "partner";


    if (cityGroup) {

        cityGroup.style.display =
            "block";

    }


    if (addressGroup) {

        addressGroup.style.display =
            "block";

    }


    if (cityInput) {

        cityInput.required =
            true;

    }


    if (addressInput) {

        addressInput.required =
            true;

    }


    if (createAccountBtn) {

        createAccountBtn.textContent =
            "Apply as partner";

    }


    if (partnerSignup) {

        partnerSignup.style.display =
            "none";

    }


    clearMessage();

}


/* =====================================================
   PARTNER BUTTON
===================================================== */

if (partnerSignup) {

    partnerSignup.addEventListener(
        "click",
        showPartnerMode
    );

}


/* =====================================================
   GOOGLE SIGNUP
===================================================== */

if (googleSignup) {

    googleSignup.addEventListener(
        "click",
        function () {

            window.location.href =
                "/api/auth/google";

        }
    );

}


/* =====================================================
   PASSWORD SHOW / HIDE
===================================================== */

if (
    togglePassword &&
    passwordInput
) {

    togglePassword.addEventListener(
        "click",
        function () {

            const isPassword =
                passwordInput.type ===
                "password";


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


/* =====================================================
   PHONE NORMALIZATION
===================================================== */

function normalizePhone(phone) {

    let value =
        String(phone || "")
            .trim()
            .replace(/\s+/g, "")
            .replace(/-/g, "")
            .replace(/\(/g, "")
            .replace(/\)/g, "");


    if (
        value.startsWith("+91")
    ) {

        value =
            value.substring(1);

    }


    if (
        value.startsWith("91") &&
        value.length === 12
    ) {

        return value;

    }


    if (
        /^\d{10}$/.test(value)
    ) {

        return "91" + value;

    }


    return value;

}


/* =====================================================
   PHONE VALIDATION
===================================================== */

function isValidIndianPhone(phone) {

    return /^91[6-9]\d{9}$/.test(
        phone
    );

}


/* =====================================================
   DISPLAY PHONE
===================================================== */

function displayPhone(phone) {

    const normalized =
        normalizePhone(phone);


    if (
        normalized.startsWith("91") &&
        normalized.length === 12
    ) {

        return "+" + normalized;

    }


    return phone;

}


/* =====================================================
   RESEND / COOLDOWN STATE
===================================================== */

let otpAlreadySent = false;
let resendCooldownTimer = null;

function startResendCooldown(seconds) {

    let remaining = seconds;

    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = "Resend OTP (" + remaining + "s)";

    clearInterval(resendCooldownTimer);

    resendCooldownTimer = setInterval(function () {

        remaining--;

        if (remaining <= 0) {

            clearInterval(resendCooldownTimer);
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = "Resend OTP";
            return;

        }

        sendOtpBtn.textContent = "Resend OTP (" + remaining + "s)";

    }, 1000);

}


/* =====================================================
   SEND OTP
===================================================== */

if (sendOtpBtn) {

    sendOtpBtn.addEventListener(
        "click",
        async function () {

            if (otpRequestInProgress) {

                return;

            }


            clearMessage();


            /* -----------------------------------------
               CHECK PHONE
            ----------------------------------------- */

            if (!phoneInput) {

                return;

            }


            const phone =
                normalizePhone(
                    phoneInput.value
                );


            console.log(
                "Phone entered:",
                phoneInput.value
            );


            console.log(
                "Phone sent to MSG91:",
                phone
            );


            /* -----------------------------------------
               VALIDATE PHONE
            ----------------------------------------- */

            if (
                !isValidIndianPhone(phone)
            ) {

                showError(
                    "Please enter a valid Indian mobile number."
                );

                return;

            }


            /* -----------------------------------------
               CHECK MSG91
            ----------------------------------------- */

            if (
                typeof window.sendOtp !==
                "function"
            ) {

                console.error(
                    "MSG91 sendOtp is unavailable."
                );

                showError(
                    "Phone verification service is still loading. Please wait a moment and try again."
                );

                return;

            }


            /* -----------------------------------------
               RESEND on an already-active session
               must use retryOtp(), not sendOtp()
               again - sendOtp() will not reliably
               trigger a fresh SMS for the same
               identifier while a session is open.
            ----------------------------------------- */

            if (
                otpAlreadySent &&
                phone === otpPhoneNumber &&
                typeof window.retryOtp === "function"
            ) {

                otpRequestInProgress = true;

                sendOtpBtn.disabled = true;
                sendOtpBtn.textContent = "Sending...";

                window.retryOtp(

                    11, /* 11 = resend via text SMS */

                    function (data) {

                        console.log(
                            "MSG91 OTP resent:",
                            data
                        );

                        otpRequestInProgress = false;

                        phoneVerified = false;
                        msg91AccessToken = "";

                        if (otpGroup) {
                            otpGroup.style.display = "block";
                        }

                        if (otpInput) {
                            otpInput.value = "";
                            otpInput.focus();
                        }

                        if (otpStatus) {
                            otpStatus.textContent = "OTP resent successfully.";
                            otpStatus.className = "otp-status success";
                        }

                        startResendCooldown(30);

                        showSuccess(
                            "OTP resent successfully to " +
                            displayPhone(phone)
                        );

                    },

                    function (error) {

                        console.error(
                            "MSG91 Retry OTP error:",
                            error
                        );

                        otpRequestInProgress = false;

                        sendOtpBtn.disabled = false;
                        sendOtpBtn.textContent = "Resend OTP";

                        showError(
                            getMSG91Error(error)
                        );

                    }

                );

                return;

            }


            /* -----------------------------------------
               SAVE PHONE
            ----------------------------------------- */

            otpPhoneNumber =
                phone;


            phoneVerified =
                false;


            msg91AccessToken =
                "";


            otpRequestInProgress =
                true;


            /* -----------------------------------------
               BUTTON
            ----------------------------------------- */

            sendOtpBtn.disabled =
                true;

            sendOtpBtn.textContent =
                "Sending...";


            /* -----------------------------------------
               SEND OTP
            ----------------------------------------- */

            try {

                window.sendOtp(

                    phone,

                    function (data) {

                        console.log(
                            "MSG91 OTP sent:",
                            data
                        );


                        otpRequestInProgress =
                            false;


                        /* -------------------------
                           SHOW OTP
                        ------------------------- */

                        if (otpGroup) {

                            otpGroup.style.display =
                                "block";

                        }


                        /* -------------------------
                           CLEAR OTP
                        ------------------------- */

                        if (otpInput) {

                            otpInput.value =
                                "";

                            otpInput.focus();

                        }


                        /* -------------------------
                           STATUS
                        ------------------------- */

                        if (otpStatus) {

                            otpStatus.textContent =
                                "OTP sent successfully.";

                            otpStatus.className =
                                "otp-status success";

                        }


                        /* -------------------------
                           BUTTON
                        ------------------------- */

                        otpAlreadySent =
                            true;

                        startResendCooldown(30);


                        showSuccess(
                            "OTP sent successfully to " +
                            displayPhone(phone)
                        );

                    },

                    function (error) {

                        console.error(
                            "MSG91 Send OTP error:",
                            error
                        );


                        otpRequestInProgress =
                            false;


                        sendOtpBtn.disabled =
                            false;


                        sendOtpBtn.textContent =
                            "Send OTP";


                        showError(
                            getMSG91Error(
                                error
                            )
                        );

                    }

                );

            }

            catch (error) {

                console.error(
                    "MSG91 sendOtp exception:",
                    error
                );


                otpRequestInProgress =
                    false;


                sendOtpBtn.disabled =
                    false;


                sendOtpBtn.textContent =
                    "Send OTP";


                showError(
                    getMSG91Error(
                        error
                    )
                );

            }

        }
    );

}


/* =====================================================
   VERIFY OTP
===================================================== */

if (verifyOtpBtn) {

    verifyOtpBtn.addEventListener(
        "click",
        async function () {

            if (otpVerifyInProgress) {

                return;

            }


            clearMessage();


            /* -----------------------------------------
               OTP VALUE
            ----------------------------------------- */

            const otp =
                otpInput
                    ? otpInput.value.trim()
                    : "";


            if (!otp) {

                showError(
                    "Please enter the OTP."
                );

                return;

            }


            if (
                !/^\d{4,9}$/.test(otp)
            ) {

                showError(
                    "Please enter a valid OTP."
                );

                return;

            }


            /* -----------------------------------------
               CHECK MSG91
            ----------------------------------------- */

            if (
                typeof window.verifyOtp !==
                "function"
            ) {

                console.error(
                    "MSG91 verifyOtp is unavailable."
                );

                showError(
                    "Phone verification service is not ready. Please refresh the page."
                );

                return;

            }


            otpVerifyInProgress =
                true;


            verifyOtpBtn.disabled =
                true;


            verifyOtpBtn.textContent =
                "Verifying...";


            /* -----------------------------------------
               VERIFY
            ----------------------------------------- */

            try {

                window.verifyOtp(

                    otp,

                    function (data) {

                        console.log(
                            "MSG91 OTP verified:",
                            data
                        );


                        otpVerifyInProgress =
                            false;


                        /* -------------------------
                           GET ACCESS TOKEN
                        ------------------------- */

                        const token =
                            extractAccessToken(
                                data
                            );


                        if (token) {

                            msg91AccessToken =
                                token;

                        }


                        /* -------------------------
                           MARK VERIFIED
                        ------------------------- */

                        phoneVerified =
                            true;


                        /* -------------------------
                           STATUS
                        ------------------------- */

                        if (otpStatus) {

                            otpStatus.textContent =
                                "✓ Phone number verified";

                            otpStatus.className =
                                "otp-status otp-verified";

                        }


                        /* -------------------------
                           LOCK PHONE
                        ------------------------- */

                        if (phoneInput) {

                            phoneInput.readOnly =
                                true;

                        }


                        /* -------------------------
                           HIDE BUTTON
                        ------------------------- */

                        if (sendOtpBtn) {

                            sendOtpBtn.style.display =
                                "none";

                        }


                        if (verifyOtpBtn) {

                            verifyOtpBtn.style.display =
                                "none";

                        }


                        /* -------------------------
                           LOCK OTP
                        ------------------------- */

                        if (otpInput) {

                            otpInput.readOnly =
                                true;

                        }


                        showSuccess(
                            "Phone number verified successfully."
                        );


                        console.log(
                            "Phone verification complete."
                        );


                        console.log(
                            "MSG91 access token:",
                            msg91AccessToken
                                ? "received"
                                : "not returned"
                        );

                    },

                    function (error) {

                        console.error(
                            "MSG91 Verify OTP error:",
                            error
                        );


                        otpVerifyInProgress =
                            false;


                        verifyOtpBtn.disabled =
                            false;


                        verifyOtpBtn.textContent =
                            "Verify OTP";


                        showError(
                            getMSG91Error(
                                error
                            )
                        );

                    }

                );

            }

            catch (error) {

                console.error(
                    "MSG91 verifyOtp exception:",
                    error
                );


                otpVerifyInProgress =
                    false;


                verifyOtpBtn.disabled =
                    false;


                verifyOtpBtn.textContent =
                    "Verify OTP";


                showError(
                    getMSG91Error(
                        error
                    )
                );

            }

        }
    );

}


/* =====================================================
   EXTRACT ACCESS TOKEN
===================================================== */

function extractAccessToken(data) {

    if (!data) {
        return "";
    }


    /* =========================================
       DIRECT STRING
    ========================================= */

    if (typeof data === "string") {

        const value = data.trim();

        /*
         * JWT normally contains 3 parts:
         * header.payload.signature
         */

        if (value.split(".").length === 3) {
            return value;
        }

        return "";
    }


    /* =========================================
       DIRECT ACCESS TOKEN
    ========================================= */

    if (data.accessToken) {
        return data.accessToken;
    }

    if (data.access_token) {
        return data.access_token;
    }

    if (data.token) {
        return data.token;
    }


    /* =========================================
       MSG91 CURRENT RESPONSE
       
       Your response is:

       {
           message: "eyJ....",
           type: "success"
       }

       So we MUST check message.
    ========================================= */

    if (
        data.message &&
        typeof data.message === "string"
    ) {

        const message =
            data.message.trim();

        /*
         * Do not treat normal messages
         * such as "OTP verified successfully"
         * as a token.
         */

        if (message.split(".").length === 3) {
            return message;
        }
    }


    /* =========================================
       NESTED DATA
    ========================================= */

    if (data.data) {

        if (
            typeof data.data === "string"
        ) {

            const value =
                data.data.trim();

            if (value.split(".").length === 3) {
                return value;
            }
        }


        if (
            data.data.accessToken
        ) {

            return data.data.accessToken;

        }


        if (
            data.data.access_token
        ) {

            return data.data.access_token;

        }


        if (
            data.data.token
        ) {

            return data.data.token;

        }


        if (
            data.data.message &&
            typeof data.data.message === "string"
        ) {

            const message =
                data.data.message.trim();

            if (message.split(".").length === 3) {
                return message;
            }
        }
    }


    /* =========================================
       NESTED RESULT
    ========================================= */

    if (data.result) {

        if (
            typeof data.result === "string"
        ) {

            const value =
                data.result.trim();

            if (value.split(".").length === 3) {
                return value;
            }
        }


        if (
            data.result.accessToken
        ) {

            return data.result.accessToken;

        }


        if (
            data.result.access_token
        ) {

            return data.result.access_token;

        }


        if (
            data.result.token
        ) {

            return data.result.token;

        }
    }


    return "";
}


/* =====================================================
   REGISTER ACCOUNT
===================================================== */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            clearMessage();


            /* -----------------------------------------
               TERMS
            ----------------------------------------- */

            if (
                termsCheckbox &&
                !termsCheckbox.checked
            ) {

                showError(
                    "Please agree to the Terms & Condition."
                );

                return;

            }


            /* -----------------------------------------
               BASIC DATA
            ----------------------------------------- */

            const firstName =
                firstNameInput
                    ? firstNameInput.value.trim()
                    : "";


            const lastName =
                lastNameInput
                    ? lastNameInput.value.trim()
                    : "";


            const email =
                emailInput
                    ? emailInput.value
                        .trim()
                        .toLowerCase()
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            const phone =
                phoneInput
                    ? normalizePhone(
                        phoneInput.value
                    )
                    : "";


            /* -----------------------------------------
               BASIC VALIDATION
            ----------------------------------------- */

            if (
                !firstName ||
                !lastName ||
                !email ||
                !password ||
                !phone
            ) {

                showError(
                    "Please fill in all required fields."
                );

                return;

            }


            /* -----------------------------------------
               EMAIL VALIDATION
            ----------------------------------------- */

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    email
                )
            ) {

                showError(
                    "Please enter a valid email address."
                );

                return;

            }


            /* -----------------------------------------
               PASSWORD
            ----------------------------------------- */

            if (
                password.length < 6
            ) {

                showError(
                    "Password must be at least 6 characters."
                );

                return;

            }


            /* -----------------------------------------
               PHONE
            ----------------------------------------- */

            if (
                !isValidIndianPhone(phone)
            ) {

                showError(
                    "Please enter a valid Indian mobile number."
                );

                return;

            }


            /* -----------------------------------------
               PHONE OTP
            ----------------------------------------- */

            if (!phoneVerified) {

                showError(
                    "Please verify your phone number with OTP before creating your account."
                );

                return;

            }


            /* -----------------------------------------
               PARTNER
            ----------------------------------------- */

            const userData = {

                firstName:
                    firstName,

                lastName:
                    lastName,

                email:
                    email,

                password:
                    password,

                phone:
                    "+" + phone,

                role:
                    registrationType,

                phoneVerified:
                    true,

                msg91AccessToken:
                    msg91AccessToken

            };


            if (
                registrationType ===
                "partner"
            ) {

                const city =
                    cityInput
                        ? cityInput.value.trim()
                        : "";


                const address =
                    addressInput
                        ? addressInput.value.trim()
                        : "";


                if (
                    !city ||
                    !address
                ) {

                    showError(
                        "Please complete your city and address."
                    );

                    return;

                }


                userData.city =
                    city;


                userData.address =
                    address;

            }


            /* -----------------------------------------
               BUTTON
            ----------------------------------------- */

            if (createAccountBtn) {

                createAccountBtn.disabled =
                    true;


                createAccountBtn.textContent =
                    registrationType ===
                    "partner"

                        ? "Submitting application..."

                        : "Creating account...";

            }


/* -----------------------------------------
   SEND TO TRIPZOVA SERVER
----------------------------------------- */

            try {

                console.log(
                    "Sending registration to TRIPZOVA backend..."
                );

                console.log(
                    "Registration email:",
                    email
                );

                console.log(
                    "Registration phone:",
                    "+" + phone
                );

                console.log(
                    "Registration role:",
                    registrationType
                );

                const response = await fetch(
                    "/api/users/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },

                        body: JSON.stringify(
                            userData
                        )
                    }
                );


                /* -----------------------------------------
                READ RESPONSE
                ----------------------------------------- */

                let data = {};

                try {

                    data =
                        await response.json();

                }

                catch (jsonError) {

                    console.error(
                        "Registration response was not JSON:",
                        jsonError
                    );

                }


                console.log(
                    "TRIPZOVA registration status:",
                    response.status
                );

                console.log(
                    "TRIPZOVA registration response:",
                    data
                );


                /* -----------------------------------------
                ERROR
                ----------------------------------------- */

                if (!response.ok) {

                    showError(
                        (data.message || "Unable to create your account.") +
                        (data.debug ? " (" + data.debug + ")" : "")
                    );

                    resetAccountButton();


                    /* -----------------------------------------
                       IF PHONE VERIFICATION FAILED ON THE
                       SERVER, THE MSG91 ACCESS TOKEN IS LIKELY
                       ALREADY CONSUMED / EXPIRED.

                       FORCE A FRESH OTP BEFORE THE USER
                       CAN RETRY, INSTEAD OF LETTING THEM
                       RESUBMIT THE SAME STALE TOKEN.
                    ----------------------------------------- */

                    if (
                        data.message &&
                        data.message.toLowerCase().includes("phone verification failed")
                    ) {

                        phoneVerified = false;
                        msg91AccessToken = "";

                        if (phoneInput) {
                            phoneInput.readOnly = false;
                        }

                        if (otpInput) {
                            otpInput.readOnly = false;
                            otpInput.value = "";
                        }

                        if (sendOtpBtn) {
                            sendOtpBtn.style.display = "";
                            sendOtpBtn.disabled = false;
                            sendOtpBtn.textContent = "Resend OTP";
                        }

                        if (verifyOtpBtn) {
                            verifyOtpBtn.style.display = "";
                            verifyOtpBtn.disabled = false;
                            verifyOtpBtn.textContent = "Verify OTP";
                        }

                        if (otpStatus) {
                            otpStatus.textContent =
                                "Verification expired. Please request a new OTP.";
                            otpStatus.className = "otp-status";
                        }

                    }

                    return;

                }


                /* -----------------------------------------
                SAVE TRIPZOVA JWT
                ----------------------------------------- */

                if (data.token) {

                    localStorage.setItem(
                        "tripzovaToken",
                        data.token
                    );

                }


                /* -----------------------------------------
                SAVE USER
                ----------------------------------------- */

                if (data.user) {

                    localStorage.setItem(
                        "tripzovaUser",
                        JSON.stringify(
                            data.user
                        )
                    );

                }


                /* -----------------------------------------
                SUCCESS
                ----------------------------------------- */

                if (
                    registrationType ===
                    "partner"
                ) {

                    showSuccess(
                        "Partner application submitted successfully. Your application is now under review."
                    );

                }

                else {

                    showSuccess(
                        "Account created successfully. Redirecting..."
                    );

                }


                /* -----------------------------------------
                REDIRECT
                ----------------------------------------- */

                setTimeout(
                    function () {

                        window.location.href =
                            "/user/index.html";

                    },
                    1200
                );

            }

            catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                showError(
                    "Unable to connect to TRIPZOVA. Please try again."
                );


                resetAccountButton();

            }

        }
    );

}


/* =====================================================
   RESET ACCOUNT BUTTON
===================================================== */

function resetAccountButton() {

    if (!createAccountBtn) {

        return;

    }


    createAccountBtn.disabled =
        false;


    createAccountBtn.textContent =
        registrationType ===
        "partner"

            ? "Apply as partner"

            : "Create account";

}


/* =====================================================
   CLEAR MESSAGE
===================================================== */

function clearMessage() {

    if (message) {

        message.innerHTML =
            "";

    }

}


/* =====================================================
   SUCCESS MESSAGE
===================================================== */

function showSuccess(text) {

    if (!message) {

        return;

    }


    message.innerHTML = `

        <div class="message-success">

            ${escapeHTML(text)}

        </div>

    `;

}


/* =====================================================
   ERROR MESSAGE
===================================================== */

function showError(text) {

    if (!message) {

        return;

    }


    message.innerHTML = `

        <div class="message-error">

            ${escapeHTML(text)}

        </div>

    `;

}


/* =====================================================
   MSG91 ERROR
===================================================== */

function getMSG91Error(error) {

    console.error(
        "Full MSG91 error:",
        error
    );


    if (!error) {

        return "Unable to complete OTP request. Please try again.";

    }


    if (
        typeof error ===
        "string"
    ) {

        return error;

    }


    if (
        error.message
    ) {

        return error.message;

    }


    if (
        error.error
    ) {

        if (
            typeof error.error ===
            "string"
        ) {

            return error.error;

        }


        if (
            error.error.message
        ) {

            return error.error.message;

        }

    }


    if (
        error.data
    ) {

        if (
            typeof error.data ===
            "string"
        ) {

            return error.data;

        }


        if (
            error.data.message
        ) {

            return error.data.message;

        }

    }


    return "Unable to complete OTP request. Please try again.";

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}