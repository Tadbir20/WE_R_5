require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const apiRoutes = require("./routes/api");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (html, css, js)
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API Routes
app.use("/api", apiRoutes);

// MongoDB Connection
async function startServer() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("Error: MONGO_URI is not defined in .env file!");
    process.exit(1);
  }

  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log(`MongoDB connected successfully at ${mongoUri}`);
      
      // Auto-run backup for the last 12 months
      const backupService = require("./services/backupService");
      try {
        const backedUp = await backupService.backupLast12Months();
        console.log(`Auto-backup initialized for last 12 months: ${backedUp.join(", ")}`);
      } catch (backupErr) {
        console.error("Initial backup error:", backupErr);
      }

      // Schedule daily backup check (every 24 hours)
      setInterval(async () => {
        try {
          await backupService.backupLast12Months();
          console.log("Daily 12-month rolling backup completed.");
        } catch (e) {
          console.error("Daily backup error:", e);
        }
      }, 24 * 60 * 60 * 1000);

      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => console.log("MongoDB connection error:", err));
}

startServer();
