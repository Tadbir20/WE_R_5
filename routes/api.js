const express = require("express");
const router = express.Router();

const Member = require("../models/Member");
const Deposit = require("../models/Deposit");
const Expense = require("../models/Expense");
const Meal = require("../models/Meal");

// ----- Members API -----
router.get("/members", async (req, res) => {
  try {
    const members = await Member.find().select("-pin"); // Don't send pin back if not needed, but frontend needs pin for login check? Wait, login should happen in backend.
    // Actually, for simplicity and compatibility with existing frontend, we'll send it all or create a login endpoint.
    res.json(await Member.find());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/members", async (req, res) => {
  try {
    const newMember = new Member(req.body);
    await newMember.save();
    res.json(newMember);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/members/:id", async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    // Optionally delete associated deposits, expenses, meals
    await Deposit.deleteMany({ memberId: req.params.id });
    await Expense.deleteMany({ memberId: req.params.id });
    await Meal.deleteMany({ memberId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login API
router.post("/login", async (req, res) => {
  const { password, phone } = req.body;
  
  if (phone === "admin") {
    if (password === "1234") {
      // Admin pin from env later
      return res.json({ success: true, user: { role: "admin" } });
    }
    return res.status(401).json({ error: "Invalid admin pin" });
  } else {
    try {
      const member = await Member.findOne({ phone: phone });
      if (member && member.pin === password) {
        return res.json({
          success: true,
          user: { role: "member", memberId: member._id, name: member.name },
        });
      }
      return res.status(401).json({ error: "Invalid credentials" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
});

// ----- Deposits API -----
router.get("/deposits", async (req, res) => {
  try {
    res.json(await Deposit.find());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/deposits", async (req, res) => {
  try {
    const newDeposit = new Deposit(req.body);
    await newDeposit.save();
    res.json(newDeposit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/deposits/:id", async (req, res) => {
  try {
    await Deposit.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- Expenses API -----
router.get("/expenses", async (req, res) => {
  try {
    res.json(await Expense.find());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/expenses", async (req, res) => {
  try {
    const newExpense = new Expense(req.body);
    await newExpense.save();
    res.json(newExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/expenses/:id", async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- Meals API -----
router.get("/meals", async (req, res) => {
  try {
    res.json(await Meal.find());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/meals", async (req, res) => {
  // We expect an array of meal objects for a specific date
  try {
    const meals = req.body; // array
    if (!meals || meals.length === 0) return res.json({ success: true });

    const date = meals[0].date;
    // Delete existing meals for this date
    await Meal.deleteMany({ date: date });

    // Insert new meals
    await Meal.insertMany(meals);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
