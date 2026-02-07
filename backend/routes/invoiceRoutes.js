const express = require("express");
const {
  createInvoice,
  previewInvoice,
  listInvoices,
  getInvoiceById,
} = require("../controllers/invoiceController");

const router = express.Router();

// POST /api/invoices/preview - returns totals without saving
router.post("/preview", previewInvoice);
// GET /api/invoices - list (must be before /:id)
router.get("/", listInvoices);
// GET /api/invoices/:id
router.get("/:id", getInvoiceById);
// POST /api/invoices
router.post("/", createInvoice);

module.exports = router;
