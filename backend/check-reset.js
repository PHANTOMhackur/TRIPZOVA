const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/User");

dotenv.config({
    path: __dirname + "/.env"
});

async function checkReset() {
    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected.\n");

        const users = await User.find(
            {},
            {
                email: 1,
                resetPasswordToken: 1,
                resetPasswordExpires: 1
            }
        );

        console.log("RESET PASSWORD DATA:\n");

        users.forEach((user) => {

            console.log({
                email: user.email,
                resetPasswordToken:
                    user.resetPasswordToken,
                resetPasswordExpires:
                    user.resetPasswordExpires
            });

        });

        await mongoose.disconnect();

    } catch (error) {

        console.error(
            "Database check failed:",
            error.message
        );

    }
}

checkReset();