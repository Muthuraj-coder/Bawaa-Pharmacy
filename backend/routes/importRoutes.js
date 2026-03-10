const express = require("express");
const multer = require("multer");
const os = require("os");
const path = require("path");
const { parsePdf, exportExcel } = require("../controllers/pdfImportController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || "") || ".pdf";
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      path.extname(file.originalname || "").toLowerCase() === ".pdf";

    if (!isPdf) {
      return cb(new Error("Only PDF files are allowed"));
    }

    cb(null, true);
  },
});

router.post(
  "/parse-pdf",
  upload.single("file"),
  parsePdf
);

router.post(
  "/export-excel",
  exportExcel
);

module.exports = router;
