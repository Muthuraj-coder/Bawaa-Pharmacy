/* One-time script to import medicine master data
 * from the Excel file: PRODUCTS LIST.xls
 *
 * Usage:
 *   cd backend
 *   node scripts/importMedicineMaster.js
 */

const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("../config/db");
const MedicineMaster = require("../models/MedicineMaster");
const xlsx = require("xlsx");

async function main() {
  console.log("Starting MedicineMaster import...");

  try {
    await connectDB();
    console.log("Connected to MongoDB");

    const filePath = path.join(__dirname, "..", "PRODUCTS LIST.xls");
    console.log(`Reading Excel file: ${filePath}`);

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // First, read as a 2D array to locate the actual header row.
    const matrix = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    const headerRowIndex = matrix.findIndex((row) => {
      if (!row || row.length < 2) return false;
      const c0 = String(row[0]).trim().toLowerCase();
      const c1 = String(row[1]).trim().toLowerCase();
      return c0 === "productname" && c1 === "pack";
    });

    if (headerRowIndex === -1) {
      console.error(
        "Could not find header row with columns: ProductName | Pack"
      );
      return;
    }

    // Now read again, mapping exactly to ProductName/Pack,
    // starting from the header row (as requested).
    const rows = xlsx.utils.sheet_to_json(sheet, {
      header: ["ProductName", "Pack"],
      range: headerRowIndex,
      defval: "",
    });

    // Temporary: log first 3 rows to verify keys
    console.log("Sample parsed rows:", rows.slice(0, 3));

    let processed = 0;
    let inserted = 0;
    let duplicates = 0;

    for (const row of rows) {
      processed += 1;

      const productName = String(row.ProductName || "").trim();
      const pack = String(row.Pack || "").trim();

      if (!productName || productName.toLowerCase() === "productname") {
        continue;
      }

      const parsed = parseProduct(productName, pack);

      if (!parsed.brandName) continue;

      const { brandName, dosage, form, packing, category } = parsed;

      try {
        const existing = await MedicineMaster.findOne({
          brandName,
          dosage,
          form,
        });

        if (existing) {
          duplicates += 1;
          continue;
        }

        await MedicineMaster.create({
          brandName,
          dosage,
          form,
          packing,
          category,
        });

        inserted += 1;
      } catch (err) {
        if (err && err.code === 11000) {
          duplicates += 1;
        } else {
          console.error("Error inserting row:", err);
        }
      }
    }

    console.log("=== Import complete ===");
    console.log(`Total rows processed: ${processed}`);
    console.log(`Inserted medicines  : ${inserted}`);
    console.log(`Duplicates skipped  : ${duplicates}`);
  } catch (err) {
    console.error("Fatal import error:", err);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

/**
 * Parses product name into brand, dosage and form
 * Examples:
 *  - "CLOPILET 75mg TAB"
 *  - "DOLO 650 TAB"
 *  - "OMEPR AZOLE 20 CAP"
 */
function parseProduct(productName, pack) {
  const original = String(productName).trim();
  const upper = original.toUpperCase();

  // --- FORM ---
  let form = "";
  if (/\bTAB\b/i.test(upper)) form = "Tablet";
  else if (/\bCAP\b/i.test(upper)) form = "Capsule";
  else if (/\bSYP\b/i.test(upper)) form = "Syrup";
  else if (/\bINJ\b/i.test(upper)) form = "Injection";

  // --- DOSAGE ---
  let dosage = "";
  const dosageMatch = upper.match(/\d+(\.\d+)?\s*(MG|MCG|G)/i);
  if (dosageMatch) {
    dosage = dosageMatch[0].replace(/\s+/g, "").toUpperCase();
  }

  // --- BRAND NAME CLEANUP ---
  let brandName = original;

  if (dosageMatch) {
    brandName = brandName.replace(dosageMatch[0], "");
  }

  brandName = brandName
    .replace(/\bTAB\b|\bCAP\b|\bSYP\b|\bINJ\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return {
    brandName,
    dosage,
    form,
    packing: String(pack || "").trim(),
    category: "",
  };
}

// Execute only when called directly
if (require.main === module) {
  main();
}
