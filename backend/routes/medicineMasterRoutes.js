const express = require("express");
const {
  searchMedicines,
  getLowStockMedicines,
} = require("../controllers/medicineMasterController");

const router = express.Router();

// GET /api/medicines/search?q=
router.get("/search", searchMedicines);

// GET /api/medicines/low-stock
router.get("/low-stock", getLowStockMedicines);

module.exports = router;

