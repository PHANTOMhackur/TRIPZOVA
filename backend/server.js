const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const userRoutes = require("./routes/userRoutes");
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const connectDatabase = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const passport = require("./config/passport");

dotenv.config({
    path: path.join(__dirname, ".env")
});

const app = express();

const PORT = process.env.PORT || 5000;

// Connect MongoDB
connectDatabase();


// Middleware
app.use(express.json());

app.use(passport.initialize());

app.use("/api/auth", passwordRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Start server
app.listen(PORT, () => {
    console.log(`TRIPZOVA server running on http://localhost:${PORT}`);
});