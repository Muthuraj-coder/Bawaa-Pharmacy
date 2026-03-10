const ExcelJS = require("exceljs");

function parseExpiryDate(expStr) {
  if (!expStr) return null;
  const parts = expStr.split("-");
  if (parts.length !== 2) return null;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mIndex = months.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
  if (mIndex === -1) return null;
  const yearStr = parts[1].length === 2 ? `20${parts[1]}` : parts[1];
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) return null;
  return new Date(year, mIndex + 1, 0); // Last day of the expiry month
}

async function generateExcelBuffer(items) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("ADC Sheet");

  // 1. COLUMN ORDER & 2. COLUMN WIDTHS
  worksheet.columns = [
    { header: "S.No", key: "slNo", width: 6 },
    { header: "Medicine Name", key: "description", width: 45 },
    { header: "Batch No", key: "batchNo", width: 15 },
    { header: "MFD DATE", key: "mfdDate", width: 12 },
    { header: "Expiry Date", key: "expDate", width: 12 },
    { header: "Qty", key: "qty", width: 10 },
    { header: "Amount", key: "amount", width: 15 },
  ];

  // 3. FREEZE HEADER ROW
  worksheet.views = [
    { state: "frozen", ySplit: 1 }
  ];

  // 7. ENABLE FILTERS
  worksheet.autoFilter = {
    from: "A1",
    to: "G1"
  };

  // 4. HEADER STYLING
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEFEFEF" }
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  let totalQty = 0;
  let totalAmount = 0;
  const today = new Date();
  const threeMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
  const sixMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());

  items.forEach((item) => {
    const qty = parseFloat(item.qty) || 0;
    const amount = parseFloat(item.amount) || 0;

    totalQty += qty;
    totalAmount += amount;

    const row = worksheet.addRow({
      slNo: item.slNo ?? "",
      description: item.description ?? "",
      batchNo: item.batchNo ?? "",
      mfdDate: item.mfdDate ?? "",
      expDate: item.expDate ?? "",
      qty: item.qty ?? "",
      amount: item.amount ?? "",
    });

    // 5. ALIGNMENT RULES & 6. WRAP LONG MEDICINE NAMES
    row.getCell("description").alignment = { horizontal: "left", wrapText: true };
    row.getCell("batchNo").alignment = { horizontal: "center" };
    row.getCell("mfdDate").alignment = { horizontal: "center" };
    row.getCell("expDate").alignment = { horizontal: "center" };
    row.getCell("qty").alignment = { horizontal: "right" };
    row.getCell("amount").alignment = { horizontal: "right" };

    // 8. EXPIRY DATE HIGHLIGHTING
    if (item.expDate) {
      const expDateObj = parseExpiryDate(item.expDate);
      if (expDateObj) {
        let bgColor = null;
        if (expDateObj < threeMonthsFromNow) {
          bgColor = "FFFF0000"; // Red
        } else if (expDateObj < sixMonthsFromNow) {
          bgColor = "FFFFFF00"; // Yellow
        }

        if (bgColor) {
          row.getCell("expDate").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: bgColor }
          };
        }
      }
    }
  });

  // 9. ADD TOTAL ROW
  // Adding an empty row first for spacing
  worksheet.addRow({});
  
  const summaryRow1 = worksheet.addRow({
    expDate: "Total Qty:",
    qty: totalQty
  });
  summaryRow1.getCell("expDate").font = { bold: true };
  summaryRow1.getCell("expDate").alignment = { horizontal: "right" };
  summaryRow1.getCell("qty").font = { bold: true };
  summaryRow1.getCell("qty").alignment = { horizontal: "right", vertical: "middle" };

  const summaryRow2 = worksheet.addRow({
    qty: "Total Amount:",
    amount: `₹${totalAmount.toLocaleString("en-IN")}`
  });
  summaryRow2.getCell("qty").font = { bold: true };
  summaryRow2.getCell("qty").alignment = { horizontal: "right" };
  summaryRow2.getCell("amount").font = { bold: true };
  summaryRow2.getCell("amount").alignment = { horizontal: "right", vertical: "middle" };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = {
  generateExcelBuffer,
};
