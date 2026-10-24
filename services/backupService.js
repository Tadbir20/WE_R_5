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

// Helper: Get list of YYYY-MM for the last 12 months
function getLast12Months(baseDate = new Date()) {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
  }
  return months;
}

// Backward compatibility alias
const getLast3Months = getLast12Months;

// Generate backup for a specific month
async function generateMonthBackup(monthStr) {
  // Query all members
  const allMembers = await Member.find().lean();
  
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

  // Filter only active members for this specific month (or members with activity in this month)
  const activeMembers = allMembers.filter((m) => {
    const inActiveMonths = Array.isArray(m.activeMonths) && m.activeMonths.includes(monthStr);
    const mIdStr = m._id.toString();
    const hasActivity =
      meals.some((meal) => meal.memberId.toString() === mIdStr && Number(meal.count) > 0) ||
      deposits.some((d) => d.memberId.toString() === mIdStr && Number(d.amount) > 0);
    return inActiveMonths || hasActivity;
  });

  // Member-wise breakdown for active members of this month
  const memberSummaries = activeMembers.map((m) => {
    const mIdStr = m._id.toString();
    const memDeposits = deposits.filter((d) => d.memberId.toString() === mIdStr);
    const memMeals = meals.filter((meal) => meal.memberId.toString() === mIdStr);

    const mTotalDeposit = memDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const mSokal = memMeals.reduce((sum, meal) => sum + (Number(meal.sokal) || 0), 0);
    const mRat = memMeals.reduce((sum, meal) => sum + (Number(meal.rat) || 0), 0);
    const mTotalMeals = memMeals.reduce(
      (sum, meal) => sum + (meal.count !== undefined ? Number(meal.count) : (Number(meal.sokal) || 0) + (Number(meal.rat) || 0)),
      0
    );
    const rawRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
    const mMealCost = Number((mTotalMeals * rawRate).toFixed(2));
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
      memberCount: activeMembers.length,
      allRegisteredMembersCount: allMembers.length,
    },
    memberSummaries,
    deposits,
    expenses,
    meals,
    members: activeMembers,
    allMembers,
  };

  const filePath = path.join(BACKUP_DIR, `backup-${monthStr}.json`);
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf8");
  return filePath;
}

// Backup last 12 months and prune files older than 12 months
async function backupLast12Months() {
  const allowedMonths = getLast12Months();
  const createdFiles = [];

  for (const month of allowedMonths) {
    try {
      const file = await generateMonthBackup(month);
      createdFiles.push(file);
    } catch (err) {
      console.error(`Error generating backup for ${month}:`, err);
    }
  }

  // Cleanup files older than the last 12 months
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

// Backward compatibility alias
const backupLast3Months = backupLast12Months;

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

// Get backup JSON content
function getBackupData(monthStr) {
  const filePath = getBackupFilePath(monthStr);
  if (!filePath) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Error reading backup data for ${monthStr}:`, err);
    return null;
  }
}

module.exports = {
  backupLast12Months,
  backupLast3Months,
  generateMonthBackup,
  listBackups,
  getBackupFilePath,
  getBackupData,
  getLast12Months,
  getLast3Months,
  BACKUP_DIR,
};
