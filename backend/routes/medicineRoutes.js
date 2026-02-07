const express = require("express");
const {
  addOrGetMedicine,
  addMedicineVariant,
  getMedicinesWithVariants,
  updateStockQuantity,
  reduceStockOnSale,
} = require("../controllers/medicineController");

const router = express.Router();

// Create or return a generic medicine
router.post("/stock/medicines", addOrGetMedicine);

// Add a specific stock variant for a medicine
router.post("/stock/medicines/:medicineId/variants", addMedicineVariant);

// List all medicines with their variants
router.get("/stock/medicines-with-variants", getMedicinesWithVariants);

// Update absolute quantity for a variant
router.patch("/stock/variants/:variantId/quantity", updateStockQuantity);

// Reduce quantity for a sale (billing integration point)
router.post("/stock/variants/:variantId/reduce", reduceStockOnSale);

module.exports = router;

