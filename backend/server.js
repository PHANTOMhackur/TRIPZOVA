const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

/* =========================================
   LOAD ENVIRONMENT VARIABLES FIRST
========================================= */

dotenv.config({
    path: path.join(__dirname, ".env")
});


/* =========================================
   IMPORT ROUTES / DATABASE
========================================= */

const connectDatabase = require("./config/database");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const otpRoutes = require("./routes/otpRoutes");
const passport = require("./config/passport");
const partnerRoutes = require("./routes/partnerRoutes");




const app = express();

const PORT = process.env.PORT || 5000;


/* =========================================
   CONNECT DATABASE
========================================= */

connectDatabase();


/* =========================================
   MIDDLEWARE
========================================= */

app.use(express.json());

app.use(passport.initialize());


/* =========================================
   API ROUTES
========================================= */

app.use("/api/auth", passwordRoutes);

app.use("/api/auth/otp", otpRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/partners", partnerRoutes);

/* =========================================
   FRONTEND
========================================= */

app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);


/* =========================================
   HOME PAGE
========================================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../frontend/index.html"
        )
    );

});


/* =========================================
   START SERVER
========================================= */

app.listen(PORT, () => {

    console.log(
        `TRIPZOVA server running on http://localhost:${PORT}`
    );

});