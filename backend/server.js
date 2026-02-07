require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const seedOwner = require("./config/seedOwner");
const authRoutes = require("./routes/authRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const medicineMasterRoutes = require("./routes/medicineMasterRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const statsRoutes = require("./routes/statsRoutes");

const app = express();

// Basic CORS - safe default for mobile apps
app.use(
  cors({
    origin: "*", // React Native apps are not browser-origin bound
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Auth routes:
// - /api/auth/login (for future clients)
// - /auth/login (matches current frontend BASE_URL usage)
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

// Medicine stock management routes
// Mounted under /api so frontend can call /api/stock/...
app.use("/api", medicineRoutes);

// Medicine master search routes (imported one-time, used for selection/search)
app.use("/api/medicines", medicineMasterRoutes);

// Invoice routes
app.use("/api/invoices", invoiceRoutes);

// Dashboard stats
app.use("/api/stats", statsRoutes);

// Global error handler fallback (keeps responses JSON)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ detail: "Internal server error" });
});

const PORT = process.env.PORT || 8000;

async function start() {
  try {
    await connectDB();
    await seedOwner();

    app.listen(PORT, () => {
      console.log(`Backend server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

