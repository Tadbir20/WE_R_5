const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  room: { type: String, default: "" },
  pin: { type: String, default: "1234" }, // For login
  role: { type: String, default: "member" }, // "admin" or "member"
  photo: { type: String, default: "" }, // Profile photo URL/path
  nidPic: { type: String, default: "" }, // NID / Student ID photo URL/path
  nid: { type: String, default: "" }, // NID or Student ID Number
  fatherName: { type: String, default: "" }, // Father's Name
  fatherPhone: { type: String, default: "" }, // Father's / Guardian Phone Number
  emergencyContact: { type: String, default: "" }, // Guardian / Emergency contact
  presentAddress: { type: String, default: "" }, // Present Address
  address: { type: String, default: "" }, // Permanent Address
  documents: [
    {
      title: { type: String, default: "নথি / ছবি" },
      fileUrl: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  activeMonths: {
    type: [String],
    default: [], // e.g. ["2026-10", "2026-11"]
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Member", memberSchema);
