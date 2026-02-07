const Medicine = require("../models/Medicine");
const MedicineVariant = require("../models/MedicineVariant");
const LowStockNotification = require("../models/LowStockNotification");

async function checkLowStock(variant) {
  if (!variant) return;

  if (variant.quantity <= variant.minThreshold) {
    try {
      await LowStockNotification.create({
        medicineVariant: variant._id,
        quantity: variant.quantity,
        minThreshold: variant.minThreshold,
      });
    } catch (err) {
      // Do not block core flow if notification creation fails
      console.error("Low stock notification error:", err);
    }
  }
}

/**
 * POST /api/stock/medicines
 * Body: { name, category? }
 * Creates a generic medicine if not exists (by exact name),
 * or returns the existing one.
 */
async function addOrGetMedicine(req, res) {
  try {
    const { name, category } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ detail: "Medicine name is required" });
    }

    const trimmedName = name.trim();

    let medicine = await Medicine.findOne({ name: trimmedName });

    if (!medicine) {
      medicine = await Medicine.create({
        name: trimmedName,
        category: category?.trim() || undefined,
        hsnCode: req.body.hsnCode?.trim() || undefined,
        gstRate: req.body.gstRate != null ? Number(req.body.gstRate) : undefined,
      });
    }

    return res.status(201).json(medicine);
  } catch (err) {
    console.error("addOrGetMedicine error:", err);
    return res.status(500).json({ detail: "Failed to add medicine" });
  }
}

async function addMedicineVariant(req, res) {
  try {
    const { medicineId } = req.params;
    const {
      brandName,
      dosage,
      form,
      packing,
      batchNumber,
      expiryDate,
      purchasePrice,
      mrp,
      sellingPrice,
      quantity,
      minThreshold,
    } = req.body || {};

    if (!medicineId) {
      return res.status(400).json({ detail: "medicineId is required" });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ detail: "Medicine not found" });
    }

    if (
      !brandName ||
      !dosage ||
      !form ||
      !packing ||
      !batchNumber ||
      expiryDate == null
    ) {
      return res.status(400).json({
        detail:
          "brandName, dosage, form, packing, batchNumber and expiryDate are required",
      });
    }

    const parsedPurchase = Number(purchasePrice);
    const parsedMrp = Number(mrp);
    const parsedSelling = Number(sellingPrice);
    const parsedQuantity = Number(quantity) || 0;

    if (
      Number.isNaN(parsedPurchase) ||
      Number.isNaN(parsedMrp) ||
      Number.isNaN(parsedSelling) ||
      Number.isNaN(parsedQuantity) ||
      parsedPurchase < 0 ||
      parsedMrp < 0 ||
      parsedSelling < 0 ||
      parsedQuantity < 0
    ) {
      return res.status(400).json({
        detail:
          "purchasePrice, mrp, sellingPrice, and quantity must be numbers >= 0",
      });
    }

    if (parsedSelling > parsedMrp) {
      return res.status(400).json({
        detail: `Selling price (${parsedSelling}) cannot be greater than MRP (${parsedMrp})`,
      });
    }

    // Normalize expiryDate to start of day (00:00:00.000) for consistent matching
    // This ensures same calendar date always matches, regardless of time component
    const expiryDateObj = new Date(expiryDate);
    expiryDateObj.setHours(0, 0, 0, 0);

    // Query for same day (handles existing records with non-normalized times)
    const startOfDay = new Date(expiryDateObj);
    const endOfDay = new Date(expiryDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if variant with same medicine + batchNumber + expiryDate exists
    const trimmedBatch = batchNumber.trim();

    const existingVariant = await MedicineVariant.findOne({
      medicine: medicine._id,
      batchNumber: trimmedBatch,
      expiryDate: { $gte: startOfDay, $lte: endOfDay },
    });

    let variant;
    let wasUpdated = false;

    if (existingVariant) {
      // Merge stock: increment quantity, update prices
      existingVariant.quantity += parsedQuantity;
      existingVariant.purchasePrice = parsedPurchase;
      existingVariant.mrp = parsedMrp;
      existingVariant.sellingPrice = parsedSelling;
      // Normalize expiryDate to start of day for consistency
      existingVariant.expiryDate = expiryDateObj;
      // Update minThreshold if provided (keep existing if not provided)
      if (minThreshold != null) {
        existingVariant.minThreshold = Number(minThreshold) || 0;
      }
      await existingVariant.save();
      variant = existingVariant;
      wasUpdated = true;
    } else {
      // Create new variant
      variant = await MedicineVariant.create({
        medicine: medicine._id,
        brandName: brandName.trim(),
        dosage: dosage.trim(),
        form,
        packing: packing.trim(),
        batchNumber: trimmedBatch,
        expiryDate: expiryDateObj,
        purchasePrice: parsedPurchase,
        mrp: parsedMrp,
        sellingPrice: parsedSelling,
        quantity: parsedQuantity,
        minThreshold: Number(minThreshold) || 0,
      });
      wasUpdated = false;
    }

    await checkLowStock(variant);

    return res.status(wasUpdated ? 200 : 201).json({
      updated: wasUpdated,
      created: !wasUpdated,
      variant,
    });
  } catch (err) {
    console.error("addMedicineVariant error:", err);
    return res.status(500).json({ detail: "Failed to add medicine variant" });
  }
}

/**
 * GET /api/stock/medicines-with-variants
 * Returns an array of { medicine, variants: [] }
 */
async function getMedicinesWithVariants(req, res) {
  try {
    const medicines = await Medicine.find().lean();
    const variants = await MedicineVariant.find().lean();

    const variantsByMedicine = variants.reduce((acc, variant) => {
      const key = String(variant.medicine);
      if (!acc[key]) acc[key] = [];
      acc[key].push(variant);
      return acc;
    }, {});

    const result = medicines.map((medicine) => ({
      medicine,
      variants: variantsByMedicine[String(medicine._id)] || [],
    }));

    return res.json(result);
  } catch (err) {
    console.error("getMedicinesWithVariants error:", err);
    return res
      .status(500)
      .json({ detail: "Failed to fetch medicines and variants" });
  }
}

/**
 * PATCH /api/stock/variants/:variantId/quantity
 * Body: { quantity }  // new absolute quantity
 */
async function updateStockQuantity(req, res) {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body || {};

    if (quantity == null) {
      return res.status(400).json({ detail: "quantity is required" });
    }

    const updated = await MedicineVariant.findByIdAndUpdate(
      variantId,
      { $set: { quantity: Number(quantity) } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ detail: "Variant not found" });
    }

    await checkLowStock(updated);

    return res.json(updated);
  } catch (err) {
    console.error("updateStockQuantity error:", err);
    return res.status(500).json({ detail: "Failed to update stock quantity" });
  }
}

/**
 * POST /api/stock/variants/:variantId/reduce
 * Body: { quantity }  // quantity sold
 */
async function reduceStockOnSale(req, res) {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body || {};

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return res
        .status(400)
        .json({ detail: "quantity must be a positive number" });
    }

    const variant = await MedicineVariant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ detail: "Variant not found" });
    }

    if (variant.quantity < qty) {
      return res
        .status(400)
        .json({ detail: "Insufficient stock for this sale" });
    }

    variant.quantity -= qty;
    await variant.save();

    await checkLowStock(variant);

    return res.json(variant);
  } catch (err) {
    console.error("reduceStockOnSale error:", err);
    return res.status(500).json({ detail: "Failed to reduce stock" });
  }
}

module.exports = {
  addOrGetMedicine,
  addMedicineVariant,
  getMedicinesWithVariants,
  updateStockQuantity,
  reduceStockOnSale,
};

