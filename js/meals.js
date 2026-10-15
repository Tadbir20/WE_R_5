// js/meals.js
// Meal Tracking (Morning and Night) with MongoDB

document
  .getElementById("mealEntryDate")
  .addEventListener("change", renderMealInputs);

function renderMealInputs() {
  const date = document.getElementById("mealEntryDate").value;
  const tbody = document.getElementById("mealInputTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  members.forEach((m) => {
    const existingMeal = meals.find(
      (meal) => meal.memberId === m.id && meal.date === date,
    );
    const sokal = existingMeal ? existingMeal.sokal || 0 : 0;
    const rat = existingMeal ? existingMeal.rat || 0 : 0;
    const total = sokal + rat;

    tbody.innerHTML += `
            <tr class="border-b">
                <td class="p-3 font-medium">${m.name}</td>
                <td class="p-3 text-center">
                    <input type="number" min="0" step="0.5" value="${sokal}" data-member-id="${m.id}" class="meal-input-sokal border rounded-lg px-2 py-1 w-20 text-center focus:outline-indigo-500">
                </td>
                <td class="p-3 text-center">
                    <input type="number" min="0" step="0.5" value="${rat}" data-member-id="${m.id}" class="meal-input-rat border rounded-lg px-2 py-1 w-20 text-center focus:outline-indigo-500">
                </td>
                <td class="p-3 text-center font-bold text-gray-700">
                    ${total}
                </td>
            </tr>
        `;
  });
}

async function saveMeals() {
  const date = document.getElementById("mealEntryDate").value;
  let newMeals = [];

  members.forEach((m) => {
    const sokalInput = document.querySelector(
      `.meal-input-sokal[data-member-id="${m.id}"]`,
    );
    const ratInput = document.querySelector(
      `.meal-input-rat[data-member-id="${m.id}"]`,
    );
    if (sokalInput && ratInput) {
      const sokal = parseFloat(sokalInput.value) || 0;
      const rat = parseFloat(ratInput.value) || 0;
      const count = sokal + rat;

      if (
        count > 0 ||
        meals.find((meal) => meal.memberId === m.id && meal.date === date)
      ) {
        newMeals.push({ memberId: m.id, date, count, sokal, rat });
      }
    }
  });

  try {
    const res = await fetch(`${API_BASE}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMeals),
    });

    // Refresh global meals from DB to get real IDs
    const mealRes = await fetch(`${API_BASE}/meals`);
    const fetchedMeals = await mealRes.json();
    meals = fetchedMeals.map((m) => ({ ...m, id: m._id }));

    alert("মিল সফলভাবে আপডেট করা হয়েছে!");
    renderMealInputs(); // To update total column
  } catch (err) {
    console.error(err);
    alert("এরর হয়েছে!");
  }
}

// Member own meal entry form handler
const myMealForm = document.getElementById("myMealForm");
if (myMealForm) {
  myMealForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const date = document.getElementById("myMealDate").value;
    const sokal = parseFloat(document.getElementById("myMealSokal").value) || 0;
    const rat = parseFloat(document.getElementById("myMealRat").value) || 0;
    const count = sokal + rat;

    if (!currentUser || currentUser.role !== "member") return;
    const memberId = currentUser.memberId;

    try {
      const res = await fetch(`${API_BASE}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ memberId, date, count, sokal, rat }]),
      });

      // Refresh global meals from DB
      const mealRes = await fetch(`${API_BASE}/meals`);
      const fetchedMeals = await mealRes.json();
      meals = fetchedMeals.map((m) => ({ ...m, id: m._id }));

      alert("আপনার মিল সফলভাবে সেভ করা হয়েছে!");

      // Update the dashboard details for the member
      if (typeof renderMemberDetails === "function") {
        renderMemberDetails("mydetails", memberId);
      }
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে!");
    }
  });
}

// Pre-fill date to today and load existing meal data for today
function initMyMealForm() {
  const dateInput = document.getElementById("myMealDate");
  if (!dateInput) return;

  // Set today as default
  if (!dateInput.value) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }

  // Listen for date change to pre-fill existing meal
  dateInput.addEventListener("change", populateMyMealForm);

  populateMyMealForm();
}

function populateMyMealForm() {
  if (!currentUser || currentUser.role !== "member") return;

  const date = document.getElementById("myMealDate").value;
  const existingMeal = meals.find(
    (meal) => meal.memberId === currentUser.memberId && meal.date === date,
  );

  document.getElementById("myMealSokal").value = existingMeal
    ? existingMeal.sokal || 0
    : 0;
  document.getElementById("myMealRat").value = existingMeal
    ? existingMeal.rat || 0
    : 0;
}
