const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const message = document.getElementById("message");


/* =========================================
   MOBILE LOGIN TOGGLE
========================================= */

const phoneLoginToggle =
    document.getElementById("phoneLoginToggle");

const phoneLoginSection =
    document.getElementById("phoneLoginSection");


/*
   MSG91's captcha (hCaptcha) cannot render
   properly into a container that is
   "display: none" at the time init runs -
   it ends up with 0x0 size and silently
   breaks OTP sending.

   The #msg91-captcha container lives inside
   #phoneLoginSection, which is hidden by
   default. So we must NOT auto-init the
   widget on page load (no onload attribute
   on the otp-provider.js script tag). Instead
   we initialize it here, the first time the
   section is actually shown.
*/

let msg91WidgetInitialized = false;


function initMsg91WidgetIfNeeded() {

    if (msg91WidgetInitialized) {
        return;
    }

    if (typeof window.initSendOTP !== "function") {

        console.error(
            "MSG91 otp-provider.js has not loaded yet."
        );

        return;

    }

    if (typeof window.configuration === "undefined") {

        console.error(
            "MSG91 configuration is missing."
        );

        return;

    }

    window.initSendOTP(window.configuration);

    msg91WidgetInitialized = true;

}


if (phoneLoginToggle && phoneLoginSection) {

    phoneLoginToggle.addEventListener("click", () => {

        const isHidden =
            phoneLoginSection.style.display === "none";

        if (isHidden) {

            phoneLoginSection.style.display = "block";

            phoneLoginToggle.textContent =
                "Hide mobile login";

            initMsg91WidgetIfNeeded();

        } else {

            phoneLoginSection.style.display = "none";

            phoneLoginToggle.textContent =
                "Login with mobile number";

        }

    });

}


/* =========================================
   PASSWORD SHOW / HIDE
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
   MOBILE OTP ELEMENTS
========================================= */

const phoneInput =
    document.getElementById("loginPhone");

const sendOtpBtn =
    document.getElementById("sendLoginOtpBtn");

const otpGroup =
    document.getElementById("loginOtpGroup");

const otpInput =
    document.getElementById("loginOtp");

const verifyOtpBtn =
    document.getElementById("verifyLoginOtpBtn");

const otpStatus =
    document.getElementById("loginOtpStatus");


/* =========================================
   OTP STATE
========================================= */

let loginPhoneVerified = false;
let loginMsg91AccessToken = null;
let loginOtpPhoneNumber = null;


/* =========================================
   PHONE NORMALIZATION
========================================= */

function normalizePhoneNumber(phone) {

    phone = phone.trim();

    phone = phone.replace(/\D/g, "");


    /*
       10 digit Indian number
       Example:
       9876543210
       becomes:
       919876543210
    */

    if (phone.length === 10) {

        return "91" + phone;

    }


    /*
       91 + 10 digit number
    */

    if (
        phone.length === 12 &&
        phone.startsWith("91")
    ) {

        return phone;

    }


    return null;

}


/* =========================================
   PHONE VALIDATION
========================================= */

function isValidIndianPhone(phone) {

    return /^91[6-9]\d{9}$/.test(phone);

}


/* =========================================
   OTP STATUS
========================================= */

function setOtpStatus(text, type = "") {

    if (!otpStatus) {
        return;
    }

    otpStatus.textContent = text;

    otpStatus.className =
        "otp-status";

    if (type) {

        otpStatus.classList.add(type);

    }

}


/* =========================================
   EXTRACT MSG91 ACCESS TOKEN
========================================= */

function extractAccessToken(data) {

    if (!data) {
        return null;
    }


    /*
       Direct string
    */

    if (typeof data === "string") {

        const token =
            data.trim();

        if (token.split(".").length === 3) {

            return token;

        }

        return null;

    }


    /*
       Common MSG91 response formats
    */

    const token =
        data.accessToken ||
        data.access_token ||
        data.token ||
        data.jwt ||
        data?.data?.accessToken ||
        data?.data?.access_token ||
        data?.data?.token ||
        data?.data?.jwt ||
        data?.result?.accessToken ||
        data?.result?.access_token ||
        data?.result?.token ||
        data?.result?.jwt ||
        null;


    if (
        typeof token === "string" &&
        token.trim()
    ) {

        return token.trim();

    }


    /*
       MSG91 ACTUAL RESPONSE

       MSG91 verifyOtp success callback for this
       widget returns:

       {
           message: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
           type: "success"
       }

       The JWT access token is inside "message".
       Only treat it as a token if it actually looks
       like a JWT (3 dot-separated parts), so normal
       text messages are never mistaken for a token.
    */

    if (
        data.message &&
        typeof data.message === "string"
    ) {

        const message =
            data.message.trim();

        if (message.split(".").length === 3) {

            return message;

        }

    }


    if (
        data?.data?.message &&
        typeof data.data.message === "string"
    ) {

        const nestedMessage =
            data.data.message.trim();

        if (nestedMessage.split(".").length === 3) {

            return nestedMessage;

        }

    }


    return null;

}


/* =========================================
   SEND OTP
========================================= */

if (sendOtpBtn) {

    sendOtpBtn.addEventListener("click", async () => {

        message.innerHTML = "";

        const rawPhone =
            phoneInput.value.trim();

        const msg91Phone =
            normalizePhoneNumber(rawPhone);


        if (
            !msg91Phone ||
            !isValidIndianPhone(msg91Phone)
        ) {

            setOtpStatus(
                "Please enter a valid 10-digit Indian mobile number.",
                "error"
            );

            return;

        }


        sendOtpBtn.disabled = true;

        sendOtpBtn.textContent =
            "Sending...";


        setOtpStatus(
            "Sending verification code...",
            ""
        );


        try {

            /*
               Make sure MSG91 widget is loaded.
            */

            if (
                typeof window.sendOtp !==
                "function"
            ) {

                throw new Error(
                    "MSG91 OTP service is not loaded."
                );

            }


            /*
               Save phone number.
            */

            loginOtpPhoneNumber =
                msg91Phone;


            /*
               Reset previous OTP state.
            */

            loginPhoneVerified =
                false;

            loginMsg91AccessToken =
                null;


            /*
               Send OTP.
            */

            window.sendOtp(

                msg91Phone,

                function (data) {

                    console.log(
                        "MSG91 OTP sent:",
                        data
                    );


                    otpGroup.style.display =
                        "block";


                    setOtpStatus(
                        "OTP sent successfully. Check your phone.",
                        "success"
                    );


                    sendOtpBtn.disabled =
                        false;

                    sendOtpBtn.textContent =
                        "Resend OTP";

                },

                function (error) {

                    console.error(
                        "MSG91 Send OTP error:",
                        error
                    );


                    setOtpStatus(
                        "Unable to send OTP. Please try again.",
                        "error"
                    );


                    sendOtpBtn.disabled =
                        false;

                    sendOtpBtn.textContent =
                        "Send OTP";

                }

            );

        } catch (error) {

            console.error(
                "OTP error:",
                error
            );


            setOtpStatus(
                error.message ||
                "Unable to send OTP. Please try again.",
                "error"
            );


            sendOtpBtn.disabled =
                false;

            sendOtpBtn.textContent =
                "Send OTP";

        }

    });

}


/* =========================================
   VERIFY OTP
========================================= */

if (verifyOtpBtn) {

    verifyOtpBtn.addEventListener("click", () => {

        message.innerHTML = "";

        const otp =
            otpInput.value.trim();


        if (!otp) {

            setOtpStatus(
                "Please enter the OTP.",
                "error"
            );

            return;

        }


        if (!loginOtpPhoneNumber) {

            setOtpStatus(
                "Please request an OTP first.",
                "error"
            );

            return;

        }


        verifyOtpBtn.disabled =
            true;

        verifyOtpBtn.textContent =
            "Verifying...";


        setOtpStatus(
            "Verifying OTP...",
            ""
        );


        try {

            if (
                typeof window.verifyOtp !==
                "function"
            ) {

                throw new Error(
                    "MSG91 OTP service is not loaded."
                );

            }


            /*
               Verify OTP through MSG91.
            */

            window.verifyOtp(

                otp,

                async function (data) {

                    console.log(
                        "MSG91 OTP verified:",
                        data
                    );


                    /*
                       Extract JWT access token.
                    */

                    loginMsg91AccessToken =
                        extractAccessToken(data);


                    if (!loginMsg91AccessToken) {

                        console.error(
                            "MSG91 response did not contain an access token:",
                            data
                        );


                        loginPhoneVerified =
                            false;


                        setOtpStatus(
                            "OTP verified, but MSG91 did not return an access token. Please try again.",
                            "error"
                        );


                        verifyOtpBtn.disabled =
                            false;

                        verifyOtpBtn.textContent =
                            "Verify OTP";

                        return;

                    }


                    loginPhoneVerified =
                        true;


                    console.log(
                        "MSG91 access token: received"
                    );


                    setOtpStatus(
                        "Phone verified. Checking your TRIPZOVA account...",
                        "success"
                    );


                    /*
                       IMPORTANT:

                       Do NOT call MSG91 verifyAccessToken
                       from this frontend.

                       The TRIPZOVA backend does that using
                       MSG91_AUTHKEY from .env.
                    */

                    try {

                        const response =
                            await fetch(
                                "/api/auth/phone-login",
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify({
                                            phone:
                                                loginOtpPhoneNumber,

                                            msg91AccessToken:
                                                loginMsg91AccessToken
                                        })
                                }
                            );


                        const result =
                            await response.json();


                        console.log(
                            "TRIPZOVA phone login response:",
                            result
                        );


                        if (!response.ok) {

                            loginPhoneVerified =
                                false;

                            loginMsg91AccessToken =
                                null;


                            setOtpStatus(
                                result.message ||
                                "Unable to login with this phone number.",
                                "error"
                            );


                            verifyOtpBtn.disabled =
                                false;

                            verifyOtpBtn.textContent =
                                "Verify OTP";

                            return;

                        }


                        /*
                           Make sure backend returned
                           authentication token.
                        */

                        if (!result.token) {

                            console.error(
                                "TRIPZOVA backend did not return a token."
                            );


                            setOtpStatus(
                                "Login failed. Authentication token was not received.",
                                "error"
                            );


                            verifyOtpBtn.disabled =
                                false;

                            verifyOtpBtn.textContent =
                                "Verify OTP";

                            return;

                        }


                        /*
                           Store TRIPZOVA authentication.
                        */

                        localStorage.setItem(
                            "tripzovaToken",
                            result.token
                        );


                        if (result.user) {

                            localStorage.setItem(
                                "tripzovaUser",
                                JSON.stringify(
                                    result.user
                                )
                            );

                        }


                        setOtpStatus(
                            "Login successful.",
                            "success"
                        );


                        message.innerHTML = `
                            <div class="message-success">
                                Login successful. Redirecting...
                            </div>
                        `;


                        redirectAfterLogin(
                            result.user
                        );

                    } catch (error) {

                        console.error(
                            "Phone login connection error:",
                            error
                        );


                        setOtpStatus(
                            "Unable to connect to TRIPZOVA. Please try again.",
                            "error"
                        );


                        verifyOtpBtn.disabled =
                            false;

                        verifyOtpBtn.textContent =
                            "Verify OTP";

                    }

                },

                function (error) {

                    console.error(
                        "MSG91 Verify OTP error:",
                        error
                    );


                    loginPhoneVerified =
                        false;

                    loginMsg91AccessToken =
                        null;


                    setOtpStatus(
                        "Invalid or expired OTP. Please try again.",
                        "error"
                    );


                    verifyOtpBtn.disabled =
                        false;

                    verifyOtpBtn.textContent =
                        "Verify OTP";

                }

            );

        } catch (error) {

            console.error(
                "OTP verification error:",
                error
            );


            verifyOtpBtn.disabled =
                false;

            verifyOtpBtn.textContent =
                "Verify OTP";


            setOtpStatus(
                error.message ||
                "Unable to verify OTP.",
                "error"
            );

        }

    });

}


/* =========================================
   NORMAL EMAIL LOGIN
========================================= */

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        message.innerHTML = "";


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            passwordInput.value;


        if (!email || !password) {

            message.innerHTML = `
                <div class="message-error">
                    Please enter your email and password.
                </div>
            `;

            return;

        }


        const loginButton =
            loginForm.querySelector(".login-btn");


        if (loginButton) {

            loginButton.disabled =
                true;

            loginButton.textContent =
                "Logging in...";

        }


        try {

            const response =
                await fetch(
                    "/api/auth/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                email,
                                password
                            })
                    }
                );


            const data =
                await response.json();


            console.log(
                "TRIPZOVA email login response:",
                data
            );


            if (!response.ok) {

                message.innerHTML = `
                    <div class="message-error">
                        ${data.message ||
                        "Invalid email or password."}
                    </div>
                `;


                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "Log in";

                }

                return;

            }


            /*
               Make sure JWT exists.
            */

            if (!data.token) {

                message.innerHTML = `
                    <div class="message-error">
                        Login failed. Authentication token was not received.
                    </div>
                `;


                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "Log in";

                }

                return;

            }


            /*
               Store authentication.
            */

            localStorage.setItem(
                "tripzovaToken",
                data.token
            );


            if (data.user) {

                localStorage.setItem(
                    "tripzovaUser",
                    JSON.stringify(
                        data.user
                    )
                );

            }


            message.innerHTML = `
                <div class="message-success">
                    Login successful. Redirecting...
                </div>
            `;


            redirectAfterLogin(
                data.user
            );

        } catch (error) {

            console.error(
                "Email login error:",
                error
            );


            message.innerHTML = `
                <div class="message-error">
                    Unable to connect to TRIPZOVA.
                    Please try again.
                </div>
            `;


            if (loginButton) {

                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "Log in";

            }

        }

    });

}


/* =========================================
   REDIRECT AFTER LOGIN
========================================= */

function redirectAfterLogin(user) {

    const redirect =
        new URLSearchParams(
            window.location.search
        ).get("redirect");


    setTimeout(() => {

        /*
           PARTNER
        */

        if (
            user &&
            user.role === "partner"
        ) {

            window.location.href =
                "/partner/";

            return;

        }


        /*
           ADMIN
        */

        if (
            user &&
            user.role === "admin"
        ) {

            window.location.href =
                "/admin/";

            return;

        }


        /*
           CUSTOMER / TRAVELLER
        */

        if (redirect) {

            window.location.href =
                redirect;

        } else {

            window.location.href =
                "/user/";

        }

    }, 800);

}


/* =========================================
   GOOGLE LOGIN
========================================= */

const googleLogin =
    document.getElementById("googleLogin");


if (googleLogin) {

    googleLogin.addEventListener("click", () => {

        window.location.href =
            "/api/auth/google";

    });

}


/* =========================================
   OPTIONAL PARTNER LOGIN
========================================= */

// const partnerLogin =
//     document.getElementById("partnerLogin");

// if (partnerLogin) {

//     partnerLogin.addEventListener(
//         "click",
//         () => {

//             window.location.href =
//                 "partner-login.html";

//         }
//     );