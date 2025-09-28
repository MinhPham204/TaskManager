const dotenv = require("dotenv")
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");


const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");
const app = express();

// Load environment
dotenv.config();
// Middleware to handle CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        method: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)

// Connect Database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);



// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
