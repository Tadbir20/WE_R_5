const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  amount: { type: Number, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
});

module.exports = mongoose.model("Deposit", depositSchema);
