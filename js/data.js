// js/data.js
// API and State Management for MongoDB Backend

let members = [];
let deposits = [];
let meals = [];
let expenses = [];
let currentUser = JSON.parse(localStorage.getItem("mess_user")) || null;

const API_BASE = "http://localhost:3000/api";

// Fetch all data from MongoDB
async function loadData() {
  try {
    const [memRes, depRes, mealRes, expRes] = await Promise.all([
      fetch(`${API_BASE}/members`),
      fetch(`${API_BASE}/deposits`),
      fetch(`${API_BASE}/meals`),
      fetch(`${API_BASE}/expenses`),
    ]);

    members = await memRes.json();
    deposits = await depRes.json();
    meals = await mealRes.json();
    expenses = await expRes.json();

    // Normalize IDs since MongoDB uses _id instead of id
    members = members.map((m) => ({ ...m, id: m._id }));
    deposits = deposits.map((d) => ({ ...d, id: d._id }));
    meals = meals.map((m) => ({ ...m, id: m._id }));
    expenses = expenses.map((e) => ({ ...e, id: e._id }));
  } catch (err) {
    console.error("Error loading data from MongoDB:", err);
  }
}

// Set current date in inputs
document.getElementById("depositDate").valueAsDate = new Date();
document.getElementById("expenseDate").valueAsDate = new Date();
document.getElementById("mealEntryDate").valueAsDate = new Date();
