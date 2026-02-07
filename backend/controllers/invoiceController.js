const mongoose = require("mongoose");
const Medicine = require("../models/Medicine");
const MedicineVariant = require("../models/MedicineVariant");
const Invoice = require("../models/Invoice");
const LowStockNotification = require("../models/LowStockNotification");

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Build invoice items and totals from cart + discount. Optionally validate stock.
 * Returns { invoiceItems, subTotal, discountAmount, taxableAmount, cgstTotal, sgstTotal, totalAmount }.
 */
async function buildInvoiceTotals(items, discountAmount, { validateStock = true } = {}) {
  const variantIds = items.map((item) => item.medicineVariantId);
  const variants = await MedicineVariant.find({ _id: { $in: variantIds } })
    .populate("medicine")
    .lean();

  if (variants.length !== variantIds.length) {
    const err = new Error("One or more medicine variants not found");
    err.status = 400;
    throw err;
  }

  const variantMap = new Map();
  variants.forEach((v) => variantMap.set(String(v._id), v));

  const parsedDiscount = Math.max(0, Number(discountAmount) || 0);
  const invoiceItems = [];
  let subTotal = 0;

  for (const cartItem of items) {
    const { medicineVariantId, quantity } = cartItem;

    if (!medicineVariantId || !quantity || quantity <= 0) {
      const err = new Error("Each item must have medicineVariantId and quantity > 0");
      err.status = 400;
      throw err;
    }

    const variant = variantMap.get(String(medicineVariantId));
    if (!variant) {
      const err = new Error(`Medicine variant ${medicineVariantId} not found`);
      err.status = 400;
      throw err;
    }

    if (validateStock && variant.quantity < quantity) {
      const err = new Error(
        `Insufficient stock for ${variant.brandName} ${variant.dosage}. Available: ${variant.quantity}, Requested: ${quantity}`
      );
      err.status = 400;
      throw err;
    }

    const gstRate = variant.medicine?.gstRate ?? 5;
    const hsnCode = variant.medicine?.hsnCode || "3004";
    // Selling Price is inclusive of GST (essentially MRP-based or below)
    const lineTotal = round2(variant.sellingPrice * quantity);
    subTotal += lineTotal;

    invoiceItems.push({
      medicineVariant: variant._id,
      brandName: variant.brandName,
      dosage: variant.dosage,
      batchNumber: variant.batchNumber,
      expiryDate: variant.expiryDate,
      sellingPrice: variant.sellingPrice,
      quantity,
      lineTotal,
      gstRate,
      hsnCode,
    });
  }

  for (const it of invoiceItems) {
    // 1. Apportion discount
    const lineDiscount =
      subTotal > 0 ? round2((it.lineTotal / subTotal) * parsedDiscount) : 0;
    it.discountAmount = lineDiscount;

    // 2. Net amount for this line (inclusive of tax)
    const netLineAmount = it.lineTotal - lineDiscount;

    // 3. Reverse-calculate Taxable Value
    // Formula: InclusiveAmount / (1 + Rate/100)
    it.taxableValue = round2(netLineAmount / (1 + it.gstRate / 100));

    // 4. Calculate Tax Component
    const totalTax = round2(netLineAmount - it.taxableValue);
    it.cgstAmount = round2(totalTax / 2);
    it.sgstAmount = round2(totalTax / 2);

    // Note: Due to rounding, cgst+sgst might slightly differ from totalTax,
    // but in Indian accounting, we usually just display the rounded halves.
  }

  const taxableAmount = round2(
    invoiceItems.reduce((s, it) => s + it.taxableValue, 0)
  );
  const cgstTotal = round2(
    invoiceItems.reduce((s, it) => s + it.cgstAmount, 0)
  );
  const sgstTotal = round2(
    invoiceItems.reduce((s, it) => s + it.sgstAmount, 0)
  );

  // Grand Total is simply the collected amount (Subtotal - Global Discount)
  // The tax is internal to this amount.
  const totalAmount = round2(subTotal - parsedDiscount);

  return {
    invoiceItems,
    subTotal,
    discountAmount: parsedDiscount,
    taxableAmount,
    cgstTotal,
    sgstTotal,
    totalAmount,
  };
}

/**
 * POST /api/invoices/preview
 * Body: { items: [{ medicineVariantId, quantity }], discountAmount? }
 * Returns same totals as create (no stock check, no persist).
 */
async function previewInvoice(req, res) {
  try {
    const { items, discountAmount = 0 } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ detail: "items array is required" });
    }
    const result = await buildInvoiceTotals(items, discountAmount, {
      validateStock: false,
    });
    return res.json({
      subTotal: result.subTotal,
      discountAmount: result.discountAmount,
      taxableAmount: result.taxableAmount,
      cgst: result.cgstTotal,
      sgst: result.sgstTotal,
      totalAmount: result.totalAmount,
      items: result.invoiceItems.map((it) => ({
        brandName: it.brandName,
        dosage: it.dosage,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
        taxableValue: it.taxableValue,
        gstRate: it.gstRate,
        cgstAmount: it.cgstAmount,
        sgstAmount: it.sgstAmount,
      })),
    });
  } catch (err) {
    const status = err.status || 500;
    return res
      .status(status)
      .json({ detail: err.message || "Preview failed" });
  }
}

/**
 * GET /api/invoices
 * Query: sort=dateDesc|dateAsc, fromDate, toDate, customerName, invoiceNumber
 */
async function listInvoices(req, res) {
  try {
    const { sort = "dateDesc", fromDate, toDate, customerName, invoiceNumber } = req.query || {};
    const filter = {};
    if (fromDate || toDate) {
      filter.invoiceDate = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        filter.invoiceDate.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.invoiceDate.$lte = end;
      }
    }
    if (customerName && String(customerName).trim()) {
      filter.customerName = { $regex: String(customerName).trim(), $options: "i" };
    }
    if (invoiceNumber && String(invoiceNumber).trim()) {
      filter.invoiceNumber = { $regex: String(invoiceNumber).trim(), $options: "i" };
    }
    const order = sort === "dateAsc" ? 1 : -1;
    const invoices = await Invoice.find(filter)
      .sort({ invoiceDate: order })
      .select("invoiceNumber invoiceDate customerName totalAmount paymentMode")
      .lean();
    return res.json(invoices);
  } catch (err) {
    console.error("listInvoices error:", err);
    return res.status(500).json({ detail: "Failed to fetch invoices" });
  }
}

/**
 * GET /api/invoices/:id
 */
async function getInvoiceById(req, res) {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) {
      return res.status(404).json({ detail: "Invoice not found" });
    }
    return res.json(invoice);
  } catch (err) {
    console.error("getInvoiceById error:", err);
    return res.status(500).json({ detail: "Failed to fetch invoice" });
  }
}

/**
 * POST /api/invoices
 * Body: {
 *   items: [{ medicineVariantId, quantity }],
 *   customerName?,
 *   doctorName?,
 *   discountAmount?,
 *   paymentMode
 * }
 */
async function createInvoice(req, res) {
  try {
    const {
      items,
      customerName,
      doctorName,
      discountAmount = 0,
      paymentMode,
    } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ detail: "items array is required" });
    }

    if (!paymentMode || !["Cash", "Card", "UPI"].includes(paymentMode)) {
      return res
        .status(400)
        .json({ detail: "paymentMode must be Cash, Card, or UPI" });
    }

    const result = await buildInvoiceTotals(items, discountAmount, {
      validateStock: true,
    });
    const {
      invoiceItems,
      subTotal,
      taxableAmount,
      cgstTotal,
      sgstTotal,
      totalAmount,
    } = result;
    const parsedDiscount = result.discountAmount;

    // Standalone MongoDB does not support transactions; create invoice then reduce stock.
    // If stock reduction fails, delete the invoice and throw (best-effort rollback).
    const newInvoice = await Invoice.create({
      customerName: customerName?.trim() || undefined,
      doctorName: doctorName?.trim() || undefined,
      items: invoiceItems,
      subTotal,
      discountAmount: parsedDiscount,
      taxableAmount,
      cgst: cgstTotal,
      sgst: sgstTotal,
      totalAmount,
      paymentMode,
    });

    try {
      const updatedVariants = [];
      for (const item of invoiceItems) {
        const variant = await MedicineVariant.findById(item.medicineVariant);
        if (!variant) {
          await Invoice.findByIdAndDelete(newInvoice._id);
          return res.status(500).json({
            detail: `Medicine variant ${item.medicineVariant} not found during stock reduction`,
          });
        }
        const newQuantity = Math.max(0, variant.quantity - item.quantity);
        variant.quantity = newQuantity;
        await variant.save();
        updatedVariants.push(variant);
      }

      for (const variant of updatedVariants) {
        if (variant.quantity <= variant.minThreshold) {
          try {
            await LowStockNotification.create({
              medicineVariant: variant._id,
              quantity: variant.quantity,
              minThreshold: variant.minThreshold,
            });
          } catch (notifErr) {
            console.error("Low stock notification error:", notifErr);
          }
        }
      }

      return res.status(201).json(newInvoice);
    } catch (err) {
      try {
        await Invoice.findByIdAndDelete(newInvoice._id);
      } catch (delErr) {
        console.error("Rollback: could not delete invoice after stock error:", delErr);
      }
      console.error("createInvoice stock reduction error:", err);
      return res.status(500).json({
        detail: err.message || "Failed to reduce stock",
      });
    }
  } catch (err) {
    console.error("createInvoice error:", err);
    const status = err.status || 500;
    return res
      .status(status)
      .json({ detail: err.message || "Failed to create invoice" });
  }
}

module.exports = { createInvoice, previewInvoice, listInvoices, getInvoiceById };
