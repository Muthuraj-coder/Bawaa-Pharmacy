const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    hsnCode: {
      type: String,
      trim: true,
      default: "3004",
    },
    gstRate: {
      type: Number,
      default: 5,
      enum: [0, 5, 12, 18],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);

