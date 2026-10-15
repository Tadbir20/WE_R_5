const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  note: { type: String },
});

module.exports = mongoose.model("Expense", expenseSchema);
