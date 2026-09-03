const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);

const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

dotenv.config({
    path: path.join(__dirname, ".env")
});

const User = require("./models/User");

const ADMIN_EMAIL = "admin@tripzova.com";
const ADMIN_PASSWORD = "ChangeThisPassword123!";
const ADMIN_FIRST_NAME = "TRIPZOVA";
const ADMIN_LAST_NAME = "Admin";

async function createAdmin() {
    try {
        console.log("Connecting to MongoDB...");

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully.");

        const existingAdmin = await User.findOne({
            email: ADMIN_EMAIL
        });

        if (existingAdmin) {
            console.log("");
            console.log("Admin account already exists.");

            if (existingAdmin.role !== "admin") {
                existingAdmin.role = "admin";
                existingAdmin.accountStatus = "active";
                existingAdmin.partnerStatus = "not_applicable";

                await existingAdmin.save();

                console.log("Existing account has been promoted to admin.");
            } else {
                console.log("This account is already an admin.");
            }

            await mongoose.disconnect();

            console.log("Done.");
            return;
        }

        const hashedPassword = await bcrypt.hash(
            ADMIN_PASSWORD,
            12
        );

        const admin = await User.create({
            firstName: ADMIN_FIRST_NAME,
            lastName: ADMIN_LAST_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            authProvider: "local",
            role: "admin",
            accountStatus: "active",
            partnerStatus: "not_applicable"
        });

        console.log("");
        console.log("=================================");
        console.log("TRIPZOVA ADMIN CREATED");
        console.log("=================================");
        console.log("Email:", admin.email);
        console.log("Password:", ADMIN_PASSWORD);
        console.log("Role:", admin.role);
        console.log("=================================");
        console.log("");

        await mongoose.disconnect();

        console.log("MongoDB disconnected.");
        console.log("Admin creation completed successfully.");

    } catch (error) {
        console.error("");
        console.error("=================================");
        console.error("ADMIN CREATION FAILED");
        console.error("=================================");
        console.error(error);
        console.error("=================================");

        try {
            await mongoose.disconnect();
        } catch (disconnectError) {}

        process.exit(1);
    }
}

createAdmin();