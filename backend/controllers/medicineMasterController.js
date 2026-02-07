const MedicineMaster = require("../models/MedicineMaster");
const MedicineVariant = require("../models/MedicineVariant");

/**
 * GET /api/medicines/search?q=
 *
 * - Case-insensitive partial search by brandName
 * - Limit 10
 * - Sort alphabetically by brandName
 * - Return only: _id, brandName, dosage, form, packing
 * - If q is empty -> []
 */
async function searchMedicines(req, res) {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.json([]);
    }

    const results = await MedicineMaster.find({
      brandName: { $regex: q, $options: "i" },
    })
      .select("_id brandName dosage form packing")
      .sort({ brandName: 1 })
      .limit(10)
      .lean();

    return res.json(results);
  } catch (err) {
    console.error("searchMedicines error:", err);
    return res.status(500).json({ detail: "Failed to search medicines" });
  }
}

/**
 * GET /api/medicines/low-stock
 *
 * Returns variants where quantity <= minThreshold, sorted by quantity asc.
 * Fields: _id, brandName, dosage, form, packing, quantity, minThreshold
 */
async function getLowStockMedicines(req, res) {
  try {
    const results = await MedicineVariant.find({
      $expr: { $lte: ["$quantity", "$minThreshold"] },
    })
      .select("_id brandName dosage form packing quantity minThreshold")
      .sort({ quantity: 1 })
      .lean();

    return res.json(results);
  } catch (err) {
    console.error("getLowStockMedicines error:", err);
    return res
      .status(500)
      .json({ detail: "Failed to fetch low stock medicines" });
  }
}

module.exports = { searchMedicines, getLowStockMedicines };

