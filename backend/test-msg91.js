require("dotenv").config({
    path: "./backend/.env"
});

const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) => {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
};

async function testMSG91Token() {

    const authKey =
        String(
            process.env.MSG91_AUTHKEY || ""
        ).trim();

    if (!authKey) {
        console.error(
            "MSG91_AUTHKEY is missing."
        );

        process.exit(1);
    }

    const token =
        String(
            await ask(
                "Paste the MSG91 access token here: "
            )
        ).trim();

    rl.close();

    if (!token) {
        console.error(
            "Access token is empty."
        );

        process.exit(1);
    }

    console.log("");
    console.log(
        "Testing MSG91 verifyAccessToken..."
    );

    console.log(
        "Authkey:",
        "LOADED"
    );

    console.log(
        "Token length:",
        token.length
    );

    const body =
        new URLSearchParams();

    body.append(
        "authkey",
        authKey
    );

    body.append(
        "access-token",
        token
    );

    console.log(
        "Body contains authkey:",
        body.toString().includes("authkey=")
    );

    console.log(
        "Body contains access-token:",
        body.toString().includes("access-token=")
    );

    console.log("");

    try {

        const response =
            await fetch(
                "https://control.msg91.com/api/v5/widget/verifyAccessToken",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",
                        "Accept":
                            "application/json"
                    },

                    body:
                        body.toString()
                }
            );

        const text =
            await response.text();

        console.log(
            "HTTP STATUS:",
            response.status
        );

        console.log(
            "MSG91 RESPONSE:"
        );

        console.log(
            text
        );

    } catch (error) {

        console.error(
            "REQUEST ERROR:"
        );

        console.error(
            error
        );

    }
}

testMSG91Token();