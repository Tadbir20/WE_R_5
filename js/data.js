// js/data.js
// API and State Management for MongoDB Backend

let members = [];
let deposits = [];
let meals = [];
let expenses = [];
let isMemberAccountsVisible = true;
let currentUser = JSON.parse(localStorage.getItem("mess_user")) || null;

const API_BASE = window.location.origin.startsWith("http")
  ? `${window.location.origin}/api`
  : "http://localhost:3000/api";

// Fetch all data from MongoDB
async function loadData() {
  try {
    const [memRes, depRes, mealRes, expRes, settingRes] = await Promise.all([
      fetch(`${API_BASE}/members`),
      fetch(`${API_BASE}/deposits`),
      fetch(`${API_BASE}/meals`),
      fetch(`${API_BASE}/expenses`),
      fetch(`${API_BASE}/settings/memberAccountsVisibility`).catch(() => null),
    ]);

    members = await memRes.json();
    deposits = await depRes.json();
    meals = await mealRes.json();
    expenses = await expRes.json();

    if (settingRes && settingRes.ok) {
      const settingData = await settingRes.json();
      if (settingData && typeof settingData.value === "boolean") {
        isMemberAccountsVisible = settingData.value;
      }
    }

    // Normalize IDs since MongoDB uses _id instead of id
    members = members.map((m) => ({ ...m, id: m._id }));
    deposits = deposits.map((d) => ({ ...d, id: d._id }));
    meals = meals.map((m) => ({ ...m, id: m._id }));
    expenses = expenses.map((e) => ({ ...e, id: e._id }));
  } catch (err) {
    console.error("Error loading data from MongoDB:", err);
  }
}

// Set current date in inputs safely
const today = new Date();
["depositDate", "expenseDate", "mealEntryDate"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.valueAsDate = today;
});
