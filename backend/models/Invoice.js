const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    medicineVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineVariant",
      required: true,
    },
    brandName: {
      type: String,
      required: true,
      trim: true,
    },
    hsnCode: {
      type: String,
      trim: true,
      default: "3004",
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxableValue: {
      type: Number,
      required: true,
      min: 0,
    },
    gstRate: {
      type: Number,
      required: true,
      min: 0,
    },
    cgstAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    sgstAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    customerName: {
      type: String,
      trim: true,
    },
    doctorName: {
      type: String,
      trim: true,
    },
    items: {
      type: [invoiceItemSchema],
      required: true,
      default: [],
    },
    subTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    cgst: {
      type: Number,
      required: true,
      min: 0,
    },
    sgst: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      required: true,
      enum: ["Cash", "Card", "UPI"],
    },
  },
  { timestamps: true }
);

// Auto-generate invoiceNumber before saving if not provided
invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const invoiceDate = this.invoiceDate || new Date();
    const dateStr = invoiceDate.toISOString().slice(0, 10).replace(/-/g, "");
    const startOfDay = new Date(invoiceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(invoiceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await mongoose.model("Invoice").countDocuments({
      invoiceDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });
    this.invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);
