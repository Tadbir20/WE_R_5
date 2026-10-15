const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  room: { type: String, required: true },
  pin: { type: String, required: true }, // For login
  role: { type: String, default: "member" }, // "admin" or "member"
  photo: { type: String, default: "" }, // Profile photo URL/path
  nidPic: { type: String, default: "" }, // NID / Student ID photo URL/path
  nid: { type: String, default: "" }, // NID or Student ID Number
  emergencyContact: { type: String, default: "" }, // Guardian / Emergency contact
  address: { type: String, default: "" }, // Permanent address
  documents: [
    {
      title: { type: String, default: "নথি / ছবি" },
      fileUrl: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Member", memberSchema);
