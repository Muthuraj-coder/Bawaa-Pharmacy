const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Owner = require("../models/Owner");

/**
 * POST /api/auth/login
 * POST /auth/login
 *
 * Body: { email, password }
 * Success: { access_token }
 * Error: { detail }
 */
async function loginOwner(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ detail: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const owner = await Owner.findOne({ email: normalizedEmail });

    if (!owner) {
      return res.status(401).json({ detail: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, owner.password);
    if (!passwordMatch) {
      return res.status(401).json({ detail: "Invalid email or password" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ detail: "Server configuration error (missing JWT_SECRET)" });
    }

    const tokenPayload = {
      sub: owner._id.toString(),
      email: owner.email,
      role: owner.role,
    };

    const accessToken = jwt.sign(tokenPayload, secret, {
      expiresIn: "12h",
    });

    return res.json({ access_token: accessToken });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ detail: "Internal server error" });
  }
}

module.exports = {
  loginOwner,
};

