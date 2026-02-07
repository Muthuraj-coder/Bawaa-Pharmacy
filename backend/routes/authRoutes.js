const express = require("express");
const { loginOwner } = require("../controllers/authController");

const router = express.Router();

// Main login route used by mobile app (current code uses /auth/login)
router.post("/login", loginOwner);

module.exports = router;

