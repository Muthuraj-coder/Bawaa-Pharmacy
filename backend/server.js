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
const importRoutes = require("./routes/importRoutes");

const app = express();

// Basic CORS - safe default for mobile apps
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running"
  });
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

// PDF to Excel import routes (isolated from billing/stock modules)
app.use("/api/import", importRoutes);

// Global error handler fallback (keeps responses JSON)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    await seedOwner();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

