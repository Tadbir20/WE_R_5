const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  date: { type: String, required: true },
  sokal: { type: Number, default: 0 },
  rat: { type: Number, default: 0 },
  count: { type: Number, default: 0 }, // total
});

module.exports = mongoose.model("Meal", mealSchema);
