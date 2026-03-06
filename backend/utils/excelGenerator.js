const ExcelJS = require("exceljs");

async function generateExcelBuffer(items) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("ADC Sheet");

  worksheet.addRow([
    "SL NO",
    "DESCRIPTION OF GOODS",
    "Qty",
    "BATCH NO",
    "MFD DATE",
    "EXPIRY DATE",
    "AMOUNT (INR)",
  ]);

  items.forEach((item) => {
    worksheet.addRow([
      item.slNo ?? "",
      item.description ?? "",
      item.qty ?? "",
      item.batchNo ?? "",
      item.mfdDate ?? "",
      item.expDate ?? "",
      item.amount ?? "",
    ]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = {
  generateExcelBuffer,
};

