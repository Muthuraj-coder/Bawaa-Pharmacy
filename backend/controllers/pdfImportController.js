const fs = require("fs");
const path = require("path");
const { parseInvoicePdf } = require("../utils/pdfParser");
const { generateExcelBuffer } = require("../utils/excelGenerator");

async function parsePdf(req, res) {
  if (!req.file) {
    return res.status(400).json({ detail: "PDF file is required" });
  }

  const filePath = req.file.path;

  try {
    const buffer = await fs.promises.readFile(filePath);
    const items = await parseInvoicePdf(buffer);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ detail: "No items parsed from PDF" });
    }

    return res.json({ items });
  } catch (err) {
    console.error("parsePdf error:", err);
    return res.status(500).json({ detail: "Failed to parse PDF" });
  } finally {
    if (filePath) {
      fs.unlink(filePath, () => {});
    }
  }
}

async function exportExcel(req, res) {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ detail: "Items array is required to generate Excel" });
    }

    const excelBuffer = await generateExcelBuffer(items);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ADC_Sheet.xlsx"'
    );

    return res.send(excelBuffer);
  } catch (err) {
    console.error("exportExcel error:", err);
    return res.status(500).json({ detail: "Failed to generate Excel file" });
  }
}

module.exports = {
  parsePdf,
  exportExcel,
};
