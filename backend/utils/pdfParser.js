const pdfParse = require("pdf-parse");

/* -------------------------------------------------- */
/* SERIAL LINE DETECTION (e.g. "1 BUDESONIDE ...")   */
/* -------------------------------------------------- */
const serialRegex = /^\s*(\d+)\s+/;

function isSerialLine(line) {
  return /^\s*\d+\s+/.test(line);
}

/* -------------------------------------------------- */
/* SPLIT LINES SAFELY                                */
/* -------------------------------------------------- */
function splitLines(rawText) {
  if (!rawText) return [];

  return rawText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function isTableHeaderLine(line) {
  const upper = String(line || "").toUpperCase();
  return (
    upper.includes("SL NO") &&
    upper.includes("DESCRIPTION OF GOODS") &&
    upper.includes("QTY") &&
    upper.includes("BATCH") &&
    upper.includes("MFD") &&
    upper.includes("EXPIRY") &&
    upper.includes("AMOUNT")
  );
}

function shouldSkipLine(line) {
  const upper = String(line || "").toUpperCase();

  // Page break footer (middle pages)
  if (upper.includes("CURRENT PAGE NO")) return true;
  if (upper.includes("CONTINUE TO PAGE")) return true;

  // Repeating headers
  const headerWords = [
    "EXPORT INVOICE",
    "STANES ROAD",
    "TIRUPPUR",
    "IEC NO",
    "PAN NO",
    "BUYER",
    "CONSIGNEE",
    "TEL",
    "PAYMENT",
    "DELIVERY",
  ];
  if (headerWords.some((w) => upper.includes(w))) return true;

  // Final footer (last page)
  const footerWords = [
    "BANK DETAILS",
    "EXCHANGE RATE",
    "AUTHORIZED SIGNATORY",
    "DECLARATION",
    "TWENTY",
  ];
  if (footerWords.some((w) => upper.includes(w))) return true;

  return false;
}

function splitMergedMedicineRows(line) {
  const raw = String(line || "");
  if (!raw) return [];

  const upper = raw.toUpperCase();
  const brandCount = (upper.match(/BRAND\s*:/g) || []).length;
  if (brandCount <= 1) return [raw];

  // If the serial number is present at the start, keep it on all split rows.
  const serialMatch = raw.match(/^\s*(\d+)\s+/);
  const serialPrefix = serialMatch ? `${serialMatch[1]} ` : "";
  const tail = serialMatch ? raw.replace(/^\s*\d+\s+/, "") : raw;

  const parts = tail
    .split(/(?=BRAND\s*:)/i)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.map((p) => `${serialPrefix}${p}`);
}

function removeHeaderContent(text) {
  const t = String(text || "");
  const stopWords = [
    "E X P O R T",
    "EXPORT",
    "DL NO",
    "CI/",
    "Buyer",
    "Consignee",
    "TEL",
    "Pre-Carriage",
    "Vessel",
    "Payment",
    "Final Destination",
    "NET SR PRODUCT",
  ];

  for (const word of stopWords) {
    const index = t.indexOf(word);
    if (index !== -1) {
      return t.substring(0, index).trim();
    }
  }

  return t;
}

function cleanDescription(text) {
  let t = removeHeaderContent(text);

  return String(t || "")
    .replace(/Current Page No.*$/i, "")
    .replace(/Continue To Page.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------------------------------------- */
/* GROUP BLOCKS PER SERIAL                           */
/* -------------------------------------------------- */
function groupBlocks(lines) {
  const blocks = [];
  let current = null;

  console.log("----- BLOCK DETECTION START -----");

  for (const line of lines) {
    if (isSerialLine(line)) {
      console.log("New block detected:", line);
      if (current) blocks.push(current);
      current = [line];
    } else if (current) {
      current.push(line);
    }
  }

  if (current) blocks.push(current);

  console.log("Total blocks detected:", blocks.length);

  return blocks;
}

/* -------------------------------------------------- */
/* EXTRACT SL NO                                     */
/* -------------------------------------------------- */
function extractSlNo(firstLine) {
  const match = firstLine.match(/^\s*(\d+)/);
  if (!match) return null;
  return Number(match[1]);
}

/* -------------------------------------------------- */
/* EXTRACT DESCRIPTION (product on same line as SL) */
/* -------------------------------------------------- */
function extractDescription(block) {
  if (!block || !block.length) return "";

  const firstLine = block[0];

  const productLine = firstLine.replace(/^\s*\d+\s+/, "");

  let brandLine = "";

  for (const line of block) {
    if (line.toUpperCase().includes("BRAND")) {
      brandLine = line.trim();
      break;
    }
  }

  if (brandLine) {
    return `${productLine}\n${brandLine}`;
  }

  return productLine;
}

/* -------------------------------------------------- */
/* EXTRACT QTY (from first line numeric structure)   */
/* -------------------------------------------------- */
function extractQty(block) {
  if (!block.length) return null;

  const firstLine = block[0];

  const tokens = firstLine.split(/\s+/);

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const n = Number(token);
      if (!Number.isNaN(n) && n > 0) return n;
    }
  }

  return null;
}

/* -------------------------------------------------- */
/* EXTRACT BATCH NO                                  */
/* -------------------------------------------------- */
function extractBatchNo(block) {
  for (const line of block) {
    if (line.toUpperCase().includes("BATCH")) {
      const match = line.match(/Batch\s*:\s*([A-Za-z0-9]+)/i);
      if (match) return match[1];
    }
  }
  return "";
}

/* -------------------------------------------------- */
/* EXTRACT MFD & EXP                                 */
/* -------------------------------------------------- */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function normalizeMonthYear(month, year) {
  let m = month;
  let y = year;

  const index = MONTHS.findIndex(
    (name) => name.toLowerCase() === m.toLowerCase().slice(0, 3)
  );

  if (index === -1) return "";

  if (y.length === 4) y = y.slice(2);

  return `${MONTHS[index]}-${y}`;
}

function extractMfdAndExpiry(block) {
  const joined = block.join(" ");

  const pattern =
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/ ](\d{2}|\d{4})\b/gi;

  const matches = [...joined.matchAll(pattern)];

  if (!matches.length) {
    return { mfdDate: "", expDate: "" };
  }

  const first = matches[0];
  const second = matches[1];

  return {
    mfdDate: normalizeMonthYear(first[1], first[2]),
    expDate: second
      ? normalizeMonthYear(second[1], second[2])
      : "",
  };
}

/* -------------------------------------------------- */
/* EXTRACT AMOUNT (INR)                              */
/* -------------------------------------------------- */
function extractAmount(block) {
  if (!block.length) return null;

  const firstLine = block[0];

  const numbers = firstLine.match(/\d+(?:\.\d+)?/g);

  if (!numbers || numbers.length < 2) return null;

  if (numbers.length >= 3) {
    return Number(numbers[numbers.length - 3]);
  }

  return Number(numbers[numbers.length - 1]);
}

/* -------------------------------------------------- */
/* PARSE SINGLE BLOCK                                */
/* -------------------------------------------------- */
function parseBlock(block) {
  if (!block || !block.length) return [];

  const toUpper = (s) => String(s || "").toUpperCase();

  const brandIndexes = [];
  block.forEach((line, i) => {
    if (/BRAND\s*:/i.test(line)) {
      brandIndexes.push(i);
    }
  });

  const subBlocks = [];
  if (brandIndexes.length > 1) {
    console.log("MULTIPLE MEDICINES DETECTED:", brandIndexes.length);
    for (let i = 0; i < brandIndexes.length; i++) {
      const start = i === 0 ? 0 : brandIndexes[i];
      const end = brandIndexes[i + 1] || block.length;
      const subBlock = block.slice(start, end);
      console.log("SUB BLOCK:", subBlock);
      subBlocks.push(subBlock);
    }
  } else {
    subBlocks.push(block);
  }

  const results = [];

  for (const sub of subBlocks) {
    // Find the numeric summary line:
    // Example: "3960 21.760 .085 336.600 29991.06 ..."
    const numericLineIndex = sub.findIndex((line) => {
      const hasLeadingNumber = /^\s*\d+/.test(line);
      const hasDecimal = /\d+\.\d+/.test(line);
      return hasLeadingNumber && hasDecimal;
    });
    const numericLine =
      numericLineIndex >= 0 ? sub[numericLineIndex] : sub[0];

    // Quantity: first number from numeric line
    const qtyMatch = String(numericLine).match(/^\s*(\d+)/);
    const qty = qtyMatch ? Number(qtyMatch[1]) : 0;

    // Amount: largest decimal number in numeric line
    const decimals = String(numericLine).match(/\d+\.\d+/g) || [];
    const amount =
      decimals.length > 0 ? Math.max(...decimals.map(Number)) : 0;

    // Batch number: line after "Batch :"
    let batchNo = "";
    for (let i = 0; i < sub.length; i += 1) {
      const line = sub[i];
      if (/Batch\s*:/i.test(line)) {
        const next = sub[i + 1] || "";
        batchNo = String(next).trim();
        break;
      }
    }

    // MFD Date: line after "Mfg Dt :"
    let mfdDate = "";
    for (let i = 0; i < sub.length; i += 1) {
      const line = sub[i];
      if (/Mfg\s*Dt\s*:/i.test(line)) {
        const next = sub[i + 1] || "";
        const m = String(next).match(/[A-Z][a-z]{2}-\d{2}/);
        mfdDate = m ? m[0] : String(next).trim();
        break;
      }
    }

    // EXP Date: line after "Exp Dt :"
    let expDate = "";
    for (let i = 0; i < sub.length; i += 1) {
      const line = sub[i];
      if (/Exp\s*Dt\s*:/i.test(line)) {
        const next = sub[i + 1] || "";
        const m = String(next).match(/[A-Z][a-z]{2}-\d{2}/);
        expDate = m ? m[0] : String(next).trim();
        break;
      }
    }

    // Description:
    // - Append lines to description buffer until the numeric column line
    // - Skip page navigation fragments
    // - Retain BRAND, Batch, HSN, Mfg, Exp within the description
    const headerKeywords = [
      "EXPORT",
      "INVOICE",
      "BARAKAH",
      "GSTIN",
      "PORT",
      "COUNTRY",
      "TOTAL",
      "DECLARATION",
    ];

    const descriptionLines = [];
    for (let i = 0; i < sub.length; i += 1) {
      if (numericLineIndex > 0 && i >= numericLineIndex) {
        // Small description buffer: keep appending lines until the numeric column
        // (Qty/Pack/Amount) starts. Once reached, break to ignore footer data.
        break;
      }

      // Fallback if numericLineIndex === 0 (skip the numeric line from description)
      if (i === numericLineIndex) continue;

      const line = sub[i];
      const upper = toUpper(line);
      const trimmed = String(line).trim();

      // 1. Detect if a line begins with a serial number; if it does while we
      // already have description items, it means the next row has started.
      if (/^\s*\d+\s+/.test(line) && descriptionLines.length > 0) {
        console.log("ROW BREAK DETECTED:", line);
        break;
      }

      // 2. Stop description merging if footer content appears
      const footerBreakKeywords = [
        "DATE :",
        "PO-",
        "WIRE TRANSFER",
        "DAR ES SALAAM",
        "TANZANIA",
      ];
      if (footerBreakKeywords.some((k) => upper.includes(k))) {
        console.log("FOOTER BREAK DETECTED:", line);
        break;
      }

      if (!trimmed) continue;

      // Ignore page navigation lines within a block
      if (upper.includes("CURRENT PAGE") || upper.includes("CONTINUE TO PAGE")) continue;

      if (headerKeywords.some((k) => upper.includes(k))) continue;

      // Skip pure numeric / numeric-like fragments without useful text
      if (!/[A-Za-z]/.test(line)) continue;

      // Keep all text: Product Names, BRAND, Batch, HSN, Mfg, Exp
      // Avoid very short fragments
      if (trimmed.length <= 1) continue;

      descriptionLines.push(trimmed);
    }

    let rawDescription = descriptionLines.join(" ");

    // Manufacturer text split across lines is merged (fix known splits)
    rawDescription = rawDescription.replace(/LABO\s+RATORIES/gi, "LABORATORIES");
    rawDescription = rawDescription.replace(/PHARMACEUT\s+CALS/gi, "PHARMACEUTICALS");
    rawDescription = rawDescription.replace(/HARMACEUT\s+CALS/gi, "PHARMACEUTICALS");
    rawDescription = rawDescription.replace(/BI\s+OCEUTICAL/gi, "BIOCEUTICAL");
    rawDescription = rawDescription.replace(/\bI\s+NDIA\b/gi, "INDIA");

    const description = rawDescription.replace(/\s+/g, " ").trim();

    results.push({
      description: cleanDescription(description),
      batchNo,
      mfdDate,
      expDate,
      qty,
      amount,
    });
  }

  return results;
}

/* -------------------------------------------------- */
/* MAIN FUNCTION                                     */
/* -------------------------------------------------- */
async function parseInvoicePdf(buffer) {
  const result = await pdfParse(buffer);
  const rawText = result?.text || "";

  console.log("===== RAW PDF TEXT PREVIEW =====");
  console.log(rawText.slice(0, 1000));
  console.log("================================");

  let lines = splitLines(rawText);
  console.log("TOTAL LINES:", lines.length);

  // STEP 1 — Find table start and parse after it
  const tableStartIndex = lines.findIndex((l) => isTableHeaderLine(l));
  if (tableStartIndex >= 0) {
    lines = lines.slice(tableStartIndex + 1);
  }

  // STEP 2/3/4/5 — Skip header/footer/page-break lines and split merged rows
  const processedLines = [];
  for (const line of lines) {
    console.log("RAW LINE:", line);

    if (isTableHeaderLine(line)) continue;
    if (shouldSkipLine(line)) continue;

    const splitRows = splitMergedMedicineRows(line);
    console.log("SPLIT MEDICINES:", splitRows);
    for (const row of splitRows) {
      if (shouldSkipLine(row)) continue;

      const cleaned = cleanDescription(row);
      console.log("CLEAN DESCRIPTION:", cleaned);

      if (cleaned) {
        processedLines.push(cleaned);
      }
    }
  }

  const blocks = groupBlocks(processedLines);

  const items = [];

  // STEP 1: serial counter (do not derive slNo from block content)
  let serial = 1;

  for (const block of blocks) {
    console.log("BLOCK CONTENT:", block);

    const parsedArray = parseBlock(block);

    for (const parsed of parsedArray) {
      if (parsed) {
        const item = {
          slNo: serial++,
          description: parsed.description,
          batchNo: parsed.batchNo,
          mfdDate: parsed.mfdDate,
          expDate: parsed.expDate,
          qty: parsed.qty,
          amount: parsed.amount,
        };

        console.log("------------");
        console.log("Description:", item.description);
        console.log("Batch:", item.batchNo);
        console.log("MFG:", item.mfdDate);
        console.log("EXP:", item.expDate);
        console.log("Qty:", item.qty);
        console.log("Amount:", item.amount);

        console.log("Parsed item:", item);
        console.log("PARSED ROW:", item);
        items.push(item);
      } else {
        console.log("FAILED TO PARSE BLOCK OR SUBBLOCK");
      }
    }
  }

  console.log("FINAL PARSED ITEMS COUNT:", items.length);
  console.log("FINAL ITEMS:", items);
  console.log("TOTAL PARSED ITEMS:", items.length);

  return items;
}

module.exports = {
  parseInvoicePdf,
};
