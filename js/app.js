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
  updateDashboard();
  if (typeof initMyMealForm === "function") initMyMealForm();

  // Start Auth Flow
  checkAuth();
}

initApp();
