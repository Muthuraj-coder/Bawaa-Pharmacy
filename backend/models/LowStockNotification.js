const mongoose = require("mongoose");

const lowStockNotificationSchema = new mongoose.Schema(
  {
    medicineVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineVariant",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    minThreshold: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "LowStockNotification",
  lowStockNotificationSchema
);

