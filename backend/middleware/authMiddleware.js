const jwt = require("jsonwebtoken");

/**
 * Simple JWT auth middleware.
 * Not yet used by existing frontend, but ready for protecting future routes.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ detail: "Missing authorization token" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res
      .status(500)
      .json({ detail: "Server configuration error (missing JWT_SECRET)" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
}

module.exports = {
  authenticate,
};

