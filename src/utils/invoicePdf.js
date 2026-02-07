import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const SHOP_HEADER = `
BAWAA PHARMACY<br/>
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
    .map((it) => {
      const desc = [it.brandName, it.dosage].filter(Boolean).join(" ");
      const mrp = n2(it.sellingPrice);
      const qty = it.quantity;
      const amount = n2((it.taxableValue || 0) + (it.cgstAmount || 0) + (it.sgstAmount || 0));
      const batch = it.batchNumber || "—";
      const exp = formatDate(it.expiryDate);
      return `<tr>
        <td>${escapeHtml(desc)}</td>
        <td>—</td>
        <td>${mrp}</td>
        <td>${qty}</td>
        <td>${amount}</td>
        <td>${escapeHtml(batch)}</td>
        <td>${exp}</td>
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
    .header { text-align: center; margin-bottom: 14px; line-height: 1.4; }
    .meta { margin: 12px 0; }
    .meta table { width: 100%; }
    .meta td { padding: 2px 8px 2px 0; }
    table.items { width: 100%; border-collapse: collapse; margin: 10px 0; }
    table.items th, table.items td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
    table.items th { background: #f0f0f0; font-size: 10px; }
    table.items td { font-size: 10px; }
    .totals { margin-top: 12px; }
    .totals table { width: 280px; margin-left: auto; }
    .totals td { padding: 2px 8px; }
    .totals .total-row { font-weight: bold; font-size: 12px; }
    .footer { margin-top: 20px; font-size: 9px; line-height: 1.5; color: #444; }
  </style>
</head>
<body>
  <div class="header">
    ${SHOP_HEADER.split("<br/>").map((l) => `<div>${l}</div>`).join("")}
  </div>

  <div class="meta">
    <table>
      <tr><td><b>Bill No</b></td><td>${escapeHtml(billNo)}</td></tr>
      <tr><td><b>Bill Dt</b></td><td>${billDt}</td></tr>
      <tr><td><b>Sold To</b></td><td>${escapeHtml(soldTo)}</td></tr>
      <tr><td><b>Dr</b></td><td>${escapeHtml(dr)}</td></tr>
    </table>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th>Loc</th>
        <th>MRP</th>
        <th>Qty</th>
        <th>Amount</th>
        <th>Batch No</th>
        <th>Expiry Date</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Total Items</td><td>${totalItems}</td></tr>
      <tr><td>SGST</td><td>₹${sgst}</td></tr>
      <tr><td>CGST</td><td>₹${cgst}</td></tr>
      <tr><td>Discount</td><td>₹${discount}</td></tr>
      <tr class="total-row"><td>Total Amount</td><td>₹${totalAmount}</td></tr>
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
