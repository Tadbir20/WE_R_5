// js/app.js
// Main Initialization for MongoDB

async function initApp() {
  // Load data from MongoDB
  await loadData();

  // Initialize Month Pickers to current month
  if (typeof initDashboardMonth === "function") initDashboardMonth();
  if (typeof initDepositMonth === "function") initDepositMonth();
  if (typeof initExpenseMonth === "function") initExpenseMonth();
  if (typeof initMonthlyMemberPicker === "function") initMonthlyMemberPicker();

  // Render UI
  renderMembers();
  renderDeposits();
  renderExpenses();
  updateDropdowns();
  updateDashboard();
  if (typeof initMyMealForm === "function") initMyMealForm();

  // Start Auth Flow
  checkAuth();
}

initApp();
