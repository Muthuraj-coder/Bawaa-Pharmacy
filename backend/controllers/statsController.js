const Medicine = require("../models/Medicine");
const MedicineVariant = require("../models/MedicineVariant");
const Invoice = require("../models/Invoice");

/**
 * GET /api/stats
 * Returns { totalMedicines, invoicesToday, lowStockCount } for dashboard.
 */
async function getStats(req, res) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalMedicines, invoicesToday, lowStockCount] = await Promise.all([
      Medicine.countDocuments(),
      Invoice.countDocuments({
        invoiceDate: { $gte: todayStart, $lte: todayEnd },
      }),
      MedicineVariant.countDocuments({
        $expr: { $lte: ["$quantity", "$minThreshold"] },
      }),
    ]);

    return res.json({
      totalMedicines,
      invoicesToday,
      lowStockCount,
    });
  } catch (err) {
    console.error("getStats error:", err);
    return res.status(500).json({ detail: "Failed to fetch stats" });
  }
}

module.exports = { getStats };
