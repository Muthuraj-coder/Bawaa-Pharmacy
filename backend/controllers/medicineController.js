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

    // Batch number and expiry date are critical for identifying the stock variant
    if (!batchNumber || !batchNumber.trim() || expiryDate == null) {
      return res.status(400).json({
        detail: "batchNumber and expiryDate are required",
      });
    }

    // Normalize expiryDate ensuring it represents the exact intended date (local day -> UTC 00:00)
    // Avoids timezone shift issues (e.g., 2026-04-02 becoming 2026-04-01T18:30)
    const inputDate = new Date(expiryDate);
    if (isNaN(inputDate.getTime())) {
      return res.status(400).json({ detail: "Invalid expiryDate" });
    }

    // Construct a pure UTC date from the local date components
    const expiryDateObj = new Date(Date.UTC(
      inputDate.getFullYear(),
      inputDate.getMonth(),
      inputDate.getDate()
    ));

    // Prepare search range for same day matching (UTC day) 
    const startOfDay = new Date(expiryDateObj);
    const endOfDay = new Date(expiryDateObj);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const trimmedBatch = batchNumber.trim();

    // Check if variant with same medicine + batchNumber + expiryDate exists
    let variant = await MedicineVariant.findOne({
      medicine: medicine._id,
      batchNumber: trimmedBatch,
      expiryDate: { $gte: startOfDay, $lte: endOfDay },
    });

    let wasUpdated = false;
    const parsedQuantity = quantity !== undefined ? Number(quantity) : 0;
    const parsedPurchase = purchasePrice !== undefined ? Number(purchasePrice) : NaN;
    const parsedMrp = mrp !== undefined ? Number(mrp) : NaN;
    const parsedSelling = sellingPrice !== undefined ? Number(sellingPrice) : NaN;

    if (variant) {
      // UPDATE EXISTING VARIANT
      if (!Number.isNaN(parsedQuantity) && parsedQuantity > 0) {
        variant.quantity += parsedQuantity;
      }

      // Optionally update prices if provided and valid
      if (!Number.isNaN(parsedPurchase) && parsedPurchase >= 0) {
        variant.purchasePrice = parsedPurchase;
      }
      if (!Number.isNaN(parsedMrp) && parsedMrp >= 0) {
        variant.mrp = parsedMrp;
      }
      if (!Number.isNaN(parsedSelling) && parsedSelling >= 0) {
        variant.sellingPrice = parsedSelling;
      }

      // Update minThreshold if provided
      if (minThreshold != null) {
        variant.minThreshold = Number(minThreshold) || 0;
      }

      // Ensure expiry date consistency
      variant.expiryDate = expiryDateObj;

      // Validate pricing constraint
      if (variant.sellingPrice > variant.mrp) {
        return res.status(400).json({
          detail: `Selling price (${variant.sellingPrice}) cannot be greater than MRP (${variant.mrp})`,
        });
      }

      await variant.save();
      wasUpdated = true;
    } else {
      // CREATE NEW VARIANT
      // Stricter validation for new creation
      if (!brandName || !dosage || !form || !packing) {
        return res.status(400).json({
          detail: "brandName, dosage, form, packing are required for new stock",
        });
      }

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
          detail: "purchasePrice, mrp, sellingPrice, and quantity must be numbers >= 0",
        });
      }

      if (parsedSelling > parsedMrp) {
        return res.status(400).json({
          detail: `Selling price (${parsedSelling}) cannot be greater than MRP (${parsedMrp})`,
        });
      }

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

