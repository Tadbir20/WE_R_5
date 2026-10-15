const fs = require("fs");
const path = require("path");
const Member = require("../models/Member");
const Deposit = require("../models/Deposit");
const Expense = require("../models/Expense");
const Meal = require("../models/Meal");

const BACKUP_DIR = path.join(__dirname, "..", "backups");

// Ensure backups directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Helper: Get list of YYYY-MM for the last 3 months
function getLast3Months(baseDate = new Date()) {
  const months = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
  }
  return months;
}

// Generate backup for a specific month
async function generateMonthBackup(monthStr) {
  // Query all members
  const members = await Member.find().lean();
  
  // Regex to match dates starting with YYYY-MM
  const monthRegex = new RegExp(`^${monthStr}`);

  // Query records for this month
  const [deposits, expenses, meals] = await Promise.all([
    Deposit.find({ date: monthRegex }).lean(),
    Expense.find({ date: monthRegex }).lean(),
    Meal.find({ date: monthRegex }).lean(),
  ]);

  // Calculations
  const totalDeposits = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalMeals = meals.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
  const mealRate = totalMeals > 0 ? Number((totalExpenses / totalMeals).toFixed(2)) : 0;

  // Member-wise breakdown
  const memberSummaries = members.map((m) => {
    const mIdStr = m._id.toString();
    const memDeposits = deposits.filter((d) => d.memberId.toString() === mIdStr);
    const memMeals = meals.filter((meal) => meal.memberId.toString() === mIdStr);

    const mTotalDeposit = memDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const mSokal = memMeals.reduce((sum, meal) => sum + (Number(meal.sokal) || 0), 0);
    const mRat = memMeals.reduce((sum, meal) => sum + (Number(meal.rat) || 0), 0);
    const mTotalMeals = mSokal + mRat;
    const mMealCost = Number((mTotalMeals * mealRate).toFixed(2));
    const mBalance = Number((mTotalDeposit - mMealCost).toFixed(2));

    return {
      memberId: m._id,
      name: m.name,
      phone: m.phone,
      room: m.room,
      totalDeposit: mTotalDeposit,
      sokalMeals: mSokal,
      ratMeals: mRat,
      totalMeals: mTotalMeals,
      mealCost: mMealCost,
      balance: mBalance,
    };
  });

  const backupData = {
    month: monthStr,
    generatedAt: new Date().toISOString(),
    summary: {
      totalDeposits,
      totalExpenses,
      totalMeals,
      mealRate,
      memberCount: members.length,
    },
    memberSummaries,
    deposits,
    expenses,
    meals,
    members,
  };

  const filePath = path.join(BACKUP_DIR, `backup-${monthStr}.json`);
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf8");
  return filePath;
}

// Backup last 3 months and prune files older than 3 months
async function backupLast3Months() {
  const allowedMonths = getLast3Months();
  const createdFiles = [];

  for (const month of allowedMonths) {
    try {
      const file = await generateMonthBackup(month);
      createdFiles.push(file);
    } catch (err) {
      console.error(`Error generating backup for ${month}:`, err);
    }
  }

  // Cleanup files older than the last 3 months
  try {
    const existingFiles = fs.readdirSync(BACKUP_DIR);
    existingFiles.forEach((file) => {
      if (file.startsWith("backup-") && file.endsWith(".json")) {
        const fileMonth = file.replace("backup-", "").replace(".json", "");
        if (!allowedMonths.includes(fileMonth)) {
          fs.unlinkSync(path.join(BACKUP_DIR, file));
          console.log(`Pruned old backup file: ${file}`);
        }
      }
    });
  } catch (err) {
    console.error("Error during old backup pruning:", err);
  }

  return allowedMonths;
}

// List all existing backups
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  const files = fs.readdirSync(BACKUP_DIR);
  const backups = [];

  files.forEach((file) => {
    if (file.startsWith("backup-") && file.endsWith(".json")) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const month = file.replace("backup-", "").replace(".json", "");
      
      let summary = null;
      try {
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
        summary = content.summary;
      } catch (e) {}

      backups.push({
        month,
        fileName: file,
        sizeKb: (stats.size / 1024).toFixed(1),
        lastModified: stats.mtime,
        summary,
      });
    }
  });

  return backups.sort((a, b) => b.month.localeCompare(a.month));
}

// Get full backup file path
function getBackupFilePath(monthStr) {
  const filePath = path.join(BACKUP_DIR, `backup-${monthStr}.json`);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

module.exports = {
  backupLast3Months,
  generateMonthBackup,
  listBackups,
  getBackupFilePath,
  getLast3Months,
  BACKUP_DIR,
};
