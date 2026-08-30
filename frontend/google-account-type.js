/* =========================================
   GOOGLE ACCOUNT TYPE
========================================= */

const travellerBtn =
    document.getElementById("travellerBtn");

const partnerBtn =
    document.getElementById("partnerBtn");

const message =
    document.getElementById("message");

const userInfo =
    document.getElementById("userInfo");


/* =========================================
   GET GOOGLE DATA
========================================= */

const params =
    new URLSearchParams(window.location.search);

const encodedData =
    params.get("data");


if (!encodedData) {

    showError(
        "Google signup information is missing. Please try again."
    );

} else {

    try {

        const googleUser =
            JSON.parse(
                decodeURIComponent(encodedData)
            );


        /* Display Google email */

        if (googleUser.email) {

            userInfo.textContent =
                `Signing up with ${googleUser.email}`;

        }


        /* =====================================
           TRAVELLER
        ===================================== */

        travellerBtn.addEventListener(
            "click",
            () => {

                createGoogleAccount(
                    googleUser,
                    "traveller"
                );

            }
        );


        /* =====================================
           PARTNER
        ===================================== */

        partnerBtn.addEventListener(
            "click",
            () => {

                window.location.href =
                    `google-partner-register.html?data=${encodeURIComponent(
                        JSON.stringify(googleUser)
                    )}`;

            }
        );

    }

    catch (error) {

        console.error(
            "Google account data error:",
            error
        );

        showError(
            "Unable to read Google account information."
        );

    }

}


/* =========================================
   CREATE GOOGLE TRAVELLER
========================================= */

async function createGoogleAccount(
    googleUser,
    role
) {

    travellerBtn.disabled = true;
    partnerBtn.disabled = true;

    travellerBtn.innerHTML =
        "Creating Traveller account...";


    try {

        const response =
            await fetch(
                "/api/auth/google/create",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        googleId:
                            googleUser.googleId,

                        email:
                            googleUser.email,

                        firstName:
                            googleUser.firstName,

                        lastName:
                            googleUser.lastName,

                        role

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            showError(
                data.message ||
                "Unable to create account."
            );

            travellerBtn.disabled = false;
            partnerBtn.disabled = false;

            travellerBtn.innerHTML =
                "Continue as Traveller";

            return;
        }


        /* Save authentication */

        localStorage.setItem(
            "tripzovaToken",
            data.token
        );


        localStorage.setItem(
            "tripzovaUser",
            JSON.stringify(data.user)
        );


        window.location.href =
            "/user/";

    }

    catch (error) {

        console.error(
            "Google account creation error:",
            error
        );

        showError(
            "Unable to connect to TRIPZOVA. Please try again."
        );

        travellerBtn.disabled = false;
        partnerBtn.disabled = false;

        travellerBtn.innerHTML =
            "Continue as Traveller";

    }

}


/* =========================================
   ERROR
========================================= */

function showError(text) {

    message.innerHTML = `
        <div class="message-error">
            ${text}
        </div>
    `;

}