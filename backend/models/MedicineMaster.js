const mongoose = require("mongoose");

const medicineMasterSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      trim: true,
    },
    form: {
      type: String,
      trim: true,
    },
    packing: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Prevent duplicates by brandName + dosage + form
medicineMasterSchema.index(
  { brandName: 1, dosage: 1, form: 1 },
  { unique: true }
);

module.exports = mongoose.model("MedicineMaster", medicineMasterSchema);

