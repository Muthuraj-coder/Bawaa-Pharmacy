const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true, // hashed password
    },
    role: {
      type: String,
      default: "OWNER",
      enum: ["OWNER"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Owner", ownerSchema);

