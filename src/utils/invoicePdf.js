import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { LOGO_BASE64 } from "../constants/logoBase64";

const SHOP_HEADER = `
<b>BAWAA PHARMACY</b><br/>
346, Avinashi Road, Pushpa Theatre Bus Stop, Tirupur 64160<br/>
Ph No: 0421 2200313, 9442160313<br/>
GST No: 33AAKFB1720E1Z3<br/>
DL. Nos.: CBE/8587 20&21, CBE/5522 20B, CBE/5437 21B
`;

const FOOTER = `
E. & O.E. Kindly take a xerox for future reference<br/>
Prices charged are inclusive of tax suffered; any discrepancies are rectifiable<br/>
We undertake to refund anything excess charged than the controlled price<br/>
Bawaa Pharmacy - Delivery available entire Tamil Nadu
`;

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function n2(v) {
  return Number(v).toFixed(2);
}

/**
 * Build HTML for Bawaa Pharmacy invoice (exact format). Uses invoice from backend.
 */
export function buildInvoiceHtml(invoice) {
  if (!invoice || !invoice.items) {
    return "<html><body><p>Invalid invoice data.</p></body></html>";
  }

  const billNo = invoice.invoiceNumber || "—";
  const billDt = formatDate(invoice.invoiceDate);
  const soldTo = invoice.customerName || "Walk-in Customer";
  const dr = invoice.doctorName || "—";
  const totalItems = invoice.items.length;
  const sgst = invoice.sgst != null ? n2(invoice.sgst) : "0.00";
  const cgst = invoice.cgst != null ? n2(invoice.cgst) : "0.00";
  const discount = invoice.discountAmount != null ? n2(invoice.discountAmount) : "0.00";
  const totalAmount = invoice.totalAmount != null ? n2(invoice.totalAmount) : "0.00";

  const rows = invoice.items
    .map((it, idx) => {
      const sno = idx + 1;
      const desc = [it.brandName, it.dosage].filter(Boolean).join(" ");
      const mrp = n2(it.sellingPrice);
      const qty = it.quantity;
      const amount = n2((it.taxableValue || 0) + (it.cgstAmount || 0) + (it.sgstAmount || 0));
      const batch = it.batchNumber || "—";
      const exp = formatDate(it.expiryDate);
      return `<tr>
        <td class="center">${sno}</td>
        <td>${escapeHtml(desc)}</td>
        <td class="center">${escapeHtml(batch)}</td>
        <td class="center">${exp}</td>
        <td class="num">${qty}</td>
        <td class="num">${mrp}</td>
        <td class="num amount">${amount}</td>
      </tr>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; padding: 12px; color: #111; }
    .header-container { display: flex; flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: 20px; line-height: 1.5; }
    .header-logo { height: 70px; width: auto; margin-right: 20px; object-fit: contain; }
    .header-info { text-align: right; }
    .header-info b { font-size: 14px; display: block; margin-bottom: 4px; }
    .meta { margin: 12px 0; }
    .meta table { width: 100%; }
    .meta td { padding: 2px 8px 2px 0; }
    table.items { width: 100%; border-collapse: collapse; margin: 10px 0; }
    table.items th, table.items td { border: 1px solid #333; padding: 6px 6px; text-align: left; }
    table.items th { background: #f0f0f0; font-size: 10px; }
    table.items td { font-size: 10px; }
    .center { text-align: center !important; }
    .num { text-align: right !important; }
    .amount { font-weight: bold; font-size: 11px; }
    .totals { margin-top: 16px; border-top: 2px solid #333; padding-top: 8px; }
    .totals table { width: 240px; margin-left: auto; border-collapse: separate; border-spacing: 0 4px; }
    .totals td { padding: 4px 8px; text-align: right; }
    .totals td.tot-label { text-align: right; padding-right: 16px; width: 120px; }
    .totals .total-row td { font-weight: bold; font-size: 14px; border-top: 1px dashed #777; padding-top: 6px; }
    .footer { margin-top: 24px; text-align: center; font-size: 9px; line-height: 1.5; color: #444; border-top: 1px solid #ccc; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header-container">
    <img src="${LOGO_BASE64}" class="header-logo" />
    <div class="header-info">
      ${SHOP_HEADER.split("<br/>").map((l) => `<div>${l}</div>`).join("")}
    </div>
  </div>

  <div class="meta">
    <table>
      <tr><td><b>Bill No:</b> ${escapeHtml(billNo)}</td><td style="text-align:right;"><b>Date:</b> ${billDt}</td></tr>
      <tr><td><b>Sold To:</b> ${escapeHtml(soldTo)}</td><td style="text-align:right;"><b>Dr:</b> ${escapeHtml(dr)}</td></tr>
    </table>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th class="center" style="width: 5%;">S.No</th>
        <th style="width: 45%;">Description</th>
        <th class="center" style="width: 10%;">Batch</th>
        <th class="center" style="width: 10%;">Expiry</th>
        <th class="num" style="width: 6%;">Qty</th>
        <th class="num" style="width: 12%;">MRP</th>
        <th class="num amount" style="width: 12%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td class="tot-label">Items</td><td>${totalItems}</td></tr>
      <tr><td class="tot-label">SGST</td><td>₹${sgst}</td></tr>
      <tr><td class="tot-label">CGST</td><td>₹${cgst}</td></tr>
      <tr><td class="tot-label">Discount</td><td>₹${discount}</td></tr>
      <tr class="total-row"><td class="tot-label">TOTAL AMOUNT</td><td>₹${totalAmount}</td></tr>
    </table>
  </div>

  <div class="footer">
    ${FOOTER.split("<br/>").map((l) => `<div>${l}</div>`).join("")}
  </div>
</body>
</html>`;

  return html;
}

function escapeHtml(s) {
  if (s == null) return "";
  const str = String(s);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generate PDF from invoice and share (or save). Uses backend invoice object.
 * Returns { uri } on success. Throws on failure.
 */
export async function generateAndShareInvoicePdf(invoice) {
  const html = buildInvoiceHtml(invoice);
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Save or share invoice",
    });
  }
  return { uri };
}
