const bcrypt = require("bcryptjs");
const Owner = require("../models/Owner");

/**
 * Creates the single OWNER account if none exists.
 * Uses env vars so credentials are never committed.
 */
async function seedOwner() {
  const email = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  // Support both OWNER_PASSWORD (preferred) and PASSWORD (backwards compatible)
  const password =
    process.env.OWNER_PASSWORD || process.env.PASSWORD || "";

  const existingCount = await Owner.countDocuments();
  if (existingCount > 0) return;

  if (!email || !password) {
    // No owner exists, but we also don't have seed creds. Leave DB empty.
    // Login will fail until an owner is created (via env seed or one-time signup).
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await Owner.create({ email, password: passwordHash, role: "OWNER" });
}

module.exports = seedOwner;

