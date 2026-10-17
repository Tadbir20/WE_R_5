// js/app.js
// Main Initialization for MongoDB

async function initApp() {
  // Load data from MongoDB
  await loadData();

  // Render UI
  renderMembers();
  renderDeposits();
  renderExpenses();
  updateDropdowns();
  if (typeof initDashboardMonth === "function") initDashboardMonth();
  updateDashboard();
  if (typeof initMonthlyMemberPicker === "function") initMonthlyMemberPicker();
  if (typeof initMyMealForm === "function") initMyMealForm();

  // Start Auth Flow
  checkAuth();
}

initApp();
