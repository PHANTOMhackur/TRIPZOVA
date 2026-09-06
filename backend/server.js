const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const sanitizeInput = require("./middleware/sanitizeInput");

/* =========================================
   LOAD ENVIRONMENT VARIABLES FIRST
========================================= */

dotenv.config({
    path: path.join(__dirname, ".env")
});


/* =========================================
   FAIL FAST IF CRITICAL SECRETS ARE MISSING
========================================= */

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 20) {
    console.error(
        "FATAL: JWT_SECRET is missing or too weak. Set a long random value in backend/.env before starting the server."
    );
    process.exit(1);
}


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
const vehicleSearchRoutes = require("./routes/vehicleSearchRoutes");


const app = express();

const PORT = process.env.PORT || 5000;

// Needed for correct client IPs / rate limiting behind a proxy (Render, Nginx, etc.)
app.set("trust proxy", 1);


/* =========================================
   CONNECT DATABASE
========================================= */

connectDatabase();


/* =========================================
   SECURITY MIDDLEWARE
========================================= */

// Sets safe HTTP security headers (X-Frame-Options, HSTS, no X-Powered-By, etc.)
app.use(
    helmet({
        contentSecurityPolicy: false // frontend loads Bootstrap/Google Maps from external CDNs
    })
);

app.use(express.json({ limit: "1mb" }));

// Strip out any keys starting with "$" or containing "." from user input
// to block NoSQL / MongoDB operator injection (e.g. { "email": { "$ne": null } }).
app.use(sanitizeInput);

app.use(passport.initialize());


/* =========================================
   RATE LIMITING (BRUTE FORCE / ABUSE PROTECTION)
========================================= */

// Generic API limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many requests. Please try again later."
    }
});

// Tighter limiter for authentication / OTP / password-reset endpoints,
// which are the usual targets for brute-force and credential-stuffing attacks.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many attempts. Please wait a few minutes and try again."
    }
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);


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

app.use("/api/vehicles", vehicleSearchRoutes);


/* =========================================
   HOME PAGE
   Registered BEFORE the static middleware so it
   always wins over express.static's automatic
   "serve index.html for /" behaviour, which used
   to serve the placeholder test page instead of
   the real TRIPZOVA homepage at /user/.
========================================= */

app.get("/", (req, res) => {
    res.redirect(302, "/user/");
});


/* =========================================
   FRONTEND (STATIC FILES)
========================================= */

app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);


/* =========================================
   404 FOR UNKNOWN API ROUTES
========================================= */

app.use("/api", (req, res) => {
    res.status(404).json({
        message: "API route not found."
    });
});


/* =========================================
   START SERVER
========================================= */

app.listen(PORT, () => {

    console.log(
        `TRIPZOVA server running on http://localhost:${PORT}`
    );

});
