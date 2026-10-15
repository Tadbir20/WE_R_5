const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  room: { type: String, required: true },
  pin: { type: String, required: true }, // For login
  role: { type: String, default: "member" }, // "admin" or "member"
});

module.exports = mongoose.model("Member", memberSchema);
