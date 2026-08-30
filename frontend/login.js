const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const message = document.getElementById("message");


/* =========================================
   SHOW / HIDE PASSWORD
========================================= */

togglePassword.addEventListener("click", () => {

    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";

    togglePassword.textContent = isPassword ? "◉" : "◉";

    togglePassword.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
    );
});


/* =========================================
   NORMAL LOGIN
========================================= */

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    message.innerHTML = "";

    const email =
        document.getElementById("email").value.trim();

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


    try {

        const response = await fetch(
            "/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            message.innerHTML = `
                <div class="message-error">
                    ${data.message || "Invalid email or password."}
                </div>
            `;

            return;
        }


        /* Store authentication */

        localStorage.setItem(
            "tripzovaToken",
            data.token
        );

        localStorage.setItem(
            "tripzovaUser",
            JSON.stringify(data.user)
        );


        message.innerHTML = `
            <div class="message-success">
                Login successful. Redirecting...
            </div>
        `;


        /* Redirect */

       const redirect =
       new URLSearchParams(window.location.search).get("redirect");

        setTimeout(() => {

    /* =========================================
       PARTNER
    ========================================= */

        if (data.user.role === "partner") {

            window.location.href =
                "/partner/";

            return;
        }


        /* =========================================
        ADMIN
        ========================================= */

        if (data.user.role === "admin") {

            window.location.href =
                "/admin/";

            return;
        }


        /* =========================================
        CUSTOMER / TRAVELLER
        ========================================= */

        if (redirect) {

            window.location.href = redirect;

        } else {

            window.location.href =
                "/user/";
        }

    }, 800);


    } catch (error) {

        console.error("Login error:", error);

        message.innerHTML = `
            <div class="message-error">
                Unable to connect to TRIPZOVA.
                Please try again.
            </div>
        `;
    }

});


/* =========================================
   GOOGLE LOGIN
========================================= */

const googleLogin =
    document.getElementById("googleLogin");


if (googleLogin) {

    googleLogin.addEventListener("click", () => {

        /*
         * Google authentication will be connected
         * after the Google OAuth backend is configured.
         */

        window.location.href =
            "/api/auth/google";

    });

}


// /* =========================================
//    PARTNER LOGIN
// ========================================= */

// const partnerLogin =
//     document.getElementById("partnerLogin");


// if (partnerLogin) {

//     partnerLogin.addEventListener("click", () => {

//         window.location.href =
//             "partner-login.html";

//     });

// }