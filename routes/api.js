const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Member = require("../models/Member");
const Deposit = require("../models/Deposit");
const Expense = require("../models/Expense");
const Meal = require("../models/Meal");

// Configure Multer for Member File/Photo uploads
const uploadDir = path.join(__dirname, "..", "uploads", "members");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `member-${req.params.id}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ----- Members API -----
router.get("/members", async (req, res) => {
  try {
    res.json(await Member.find());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/members/:id", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json(member);
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

// Update Member details (Admin Only)
router.put("/members/:id", async (req, res) => {
  try {
    const updated = await Member.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Photo / NID / Document for a Member (Admin Only)
router.post(
  "/members/:id/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "কোনো ফাইল সিলেক্ট করা হয়নি!" });
      }

      const member = await Member.findById(req.params.id);
      if (!member) return res.status(404).json({ error: "Member not found" });

      const fileUrl = `/uploads/members/${req.file.filename}`;
      const uploadType = req.body.uploadType || "photo"; // 'photo', 'nidPic', 'document'

      if (uploadType === "photo") {
        member.photo = fileUrl;
      } else if (uploadType === "nidPic") {
        member.nidPic = fileUrl;
      } else {
        member.documents.push({
          title: req.body.title || req.file.originalname,
          fileUrl: fileUrl,
          uploadedAt: new Date(),
        });
      }

      await member.save();
      res.json({ success: true, member, fileUrl });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Delete uploaded document
router.delete("/members/:id/document/:docId", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });

    member.documents = member.documents.filter(
      (doc) => doc._id.toString() !== req.params.docId
    );
    await member.save();
    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/members/:id", async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
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

// ----- Backup API (Last 3 Months) -----
const backupService = require("../services/backupService");

router.get("/backups", (req, res) => {
  try {
    const list = backupService.listBackups();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/backups/create", async (req, res) => {
  try {
    const months = await backupService.backupLast3Months();
    const list = backupService.listBackups();
    res.json({ success: true, backedUpMonths: months, backups: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/backups/download/:month", (req, res) => {
  try {
    const filePath = backupService.getBackupFilePath(req.params.month);
    if (!filePath) {
      return res.status(404).json({ error: "Backup file not found for this month" });
    }
    res.download(filePath, `mess-backup-${req.params.month}.json`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/backups/data/:month", (req, res) => {
  try {
    const data = backupService.getBackupData(req.params.month);
    if (!data) {
      return res.status(404).json({ error: "Backup data not found for this month" });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
