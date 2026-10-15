require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const apiRoutes = require("./routes/api");
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (html, css, js)
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API Routes
app.use("/api", apiRoutes);

// MongoDB Connection
async function startServer() {
  let mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.log("No MONGO_URI found. Starting in-memory MongoDB for testing...");
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
  }

  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log(`MongoDB connected successfully at ${mongoUri}`);
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => console.log("MongoDB connection error:", err));
}

startServer();
