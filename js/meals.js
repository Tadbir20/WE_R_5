// js/meals.js
// Meal Tracking (Automatic Member Entry + Manual Admin Override)

// Listen for admin date picker changes
const adminDateInput = document.getElementById("mealEntryDate");
if (adminDateInput) {
  adminDateInput.addEventListener("change", refreshAndRenderMeals);
}

// Fetch fresh meals from MongoDB and re-render admin table
async function refreshAndRenderMeals() {
  try {
    const res = await fetch(`${API_BASE}/meals`);
    const fetchedMeals = await res.json();
    meals = fetchedMeals.map((m) => ({ ...m, id: m._id }));
    renderMealInputs();
  } catch (err) {
    console.error("Error refreshing meals:", err);
    renderMealInputs();
  }
}

// Render Admin Meal Table (Filtered by Active Members of Date's Month)
function renderMealInputs() {
  const dateInput = document.getElementById("mealEntryDate");
  if (!dateInput) return;

  const date = dateInput.value;
  const targetMonth = date ? date.slice(0, 7) : "";
  const tbody = document.getElementById("mealInputTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (members.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400">কোনো সদস্য পাওয়া যায়নি</td></tr>`;
    return;
  }

  // Filter members active in this date's month (or with existing meals on this date)
  const activeMembersForDate = members.filter((m) => {
    const activeList = Array.isArray(m.activeMonths) ? m.activeMonths : [];
    const hasExistingRecord = meals.some(
      (meal) =>
        meal.memberId === m.id &&
        meal.date === date &&
        (Number(meal.count) > 0 || Number(meal.sokal) > 0 || Number(meal.rat) > 0)
    );
    return activeList.includes(targetMonth) || hasExistingRecord;
  });

  if (activeMembersForDate.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="p-6 text-center text-gray-500">
          <div class="space-y-2">
            <i class="fas fa-user-slash text-2xl text-gray-400"></i>
            <p class="font-bold">মাস ${targetMonth}-এর জন্য কোনো সক্রিয় সদস্য নির্ধারিত নেই!</p>
            <p class="text-xs text-gray-400">মেসের সদস্যরা প্রতি মাসে পরিবর্তিত হতে পারেন।</p>
            <button onclick="switchTab('members')" class="inline-block mt-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm">
              <i class="fas fa-users-cog mr-1"></i> সদস্য ব্যবস্থাপনা থেকে সক্রিয় সদস্য বাছুন
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  activeMembersForDate.forEach((m) => {
    const existingMeal = meals.find(
      (meal) => meal.memberId === m.id && meal.date === date,
    );
    const sokal = existingMeal ? existingMeal.sokal || 0 : 0;
    const rat = existingMeal ? existingMeal.rat || 0 : 0;
    const total = (parseFloat(sokal) || 0) + (parseFloat(rat) || 0);

    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50 transition" id="meal-row-${m.id}">
        <td class="p-3 font-semibold text-gray-900">
          <div class="flex items-center gap-2">
            <span>${m.name}</span>
            <span class="text-xs text-gray-400 font-normal">(রুম: ${m.room || "-"})</span>
          </div>
        </td>
        <td class="p-3 text-center">
          <input
            type="number"
            min="0"
            step="0.5"
            value="${sokal}"
            data-member-id="${m.id}"
            class="meal-input-sokal border rounded-lg px-2 py-1.5 w-20 text-center font-bold text-gray-800 focus:outline-indigo-500 shadow-sm"
            oninput="updateRowMealTotal('${m.id}')"
          />
        </td>
        <td class="p-3 text-center">
          <input
            type="number"
            min="0"
            step="0.5"
            value="${rat}"
            data-member-id="${m.id}"
            class="meal-input-rat border rounded-lg px-2 py-1.5 w-20 text-center font-bold text-gray-800 focus:outline-indigo-500 shadow-sm"
            oninput="updateRowMealTotal('${m.id}')"
          />
        </td>
        <td class="p-3 text-center font-black text-indigo-900 text-base" id="total-meal-${m.id}">
          ${total}
        </td>
      </tr>
    `;
  });
}

// Dynamically update total for a row as Admin edits values
function updateRowMealTotal(memberId) {
  const sokalInput = document.querySelector(`.meal-input-sokal[data-member-id="${memberId}"]`);
  const ratInput = document.querySelector(`.meal-input-rat[data-member-id="${memberId}"]`);
  const totalCell = document.getElementById(`total-meal-${memberId}`);

  if (sokalInput && ratInput && totalCell) {
    const sokal = parseFloat(sokalInput.value) || 0;
    const rat = parseFloat(ratInput.value) || 0;
    totalCell.innerText = Math.round((sokal + rat) * 10) / 10;
  }
}

// Admin saves/edits meals for selected date
async function saveMeals() {
  const dateInput = document.getElementById("mealEntryDate");
  if (!dateInput) return;
  const date = dateInput.value;
  const targetMonth = date ? date.slice(0, 7) : "";

  const saveBtn = document.getElementById("adminSaveMealsBtn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> সেভ হচ্ছে...`;
  }

  let newMeals = [];

  const activeMembersForDate = members.filter((m) => {
    const activeList = Array.isArray(m.activeMonths) ? m.activeMonths : [];
    const hasExistingRecord = meals.some(
      (meal) =>
        meal.memberId === m.id &&
        meal.date === date &&
        (Number(meal.count) > 0 || Number(meal.sokal) > 0 || Number(meal.rat) > 0)
    );
    return activeList.includes(targetMonth) || hasExistingRecord;
  });

  activeMembersForDate.forEach((m) => {
    const sokalInput = document.querySelector(`.meal-input-sokal[data-member-id="${m.id}"]`);
    const ratInput = document.querySelector(`.meal-input-rat[data-member-id="${m.id}"]`);

    if (sokalInput && ratInput) {
      const sokal = parseFloat(sokalInput.value) || 0;
      const rat = parseFloat(ratInput.value) || 0;
      const count = sokal + rat;

      newMeals.push({
        memberId: m.id,
        date: date,
        count: count,
        sokal: sokal,
        rat: rat,
      });
    }
  });

  try {
    const res = await fetch(`${API_BASE}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMeals),
    });

    if (res.ok) {
      // Refresh global meals from DB
      const mealRes = await fetch(`${API_BASE}/meals`);
      const fetchedMeals = await mealRes.json();
      meals = fetchedMeals.map((m) => ({ ...m, id: m._id }));

      alert("তারিখের মিল সফলভাবে ডাটাবেজে আপডেট করা হয়েছে!");
      renderMealInputs();
      updateDashboard();
    } else {
      alert("মিল সেভ করতে সমস্যা হয়েছে!");
    }
  } catch (err) {
    console.error("Admin save meals error:", err);
    alert("সার্ভার এরর হয়েছে!");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fas fa-save mr-1"></i> মিল সেভ করুন`;
    }
  }
}

// ----------------------------------------------------
// Member Self-Service Meal Entry (Auto Added to Database)
// ----------------------------------------------------
const myMealForm = document.getElementById("myMealForm");
if (myMealForm) {
  myMealForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "member") {
      alert("শুধুমাত্র মেম্বাররা নিজের মিল এন্ট্রি করতে পারবেন!");
      return;
    }

    const date = document.getElementById("myMealDate").value;
    const sokal = parseFloat(document.getElementById("myMealSokal").value) || 0;
    const rat = parseFloat(document.getElementById("myMealRat").value) || 0;
    const count = sokal + rat;
    const memberId = currentUser.memberId;

    const submitBtn = this.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> সেভ হচ্ছে...`;
    }

    try {
      // Auto-add to MongoDB database immediately
      const res = await fetch(`${API_BASE}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ memberId, date, count, sokal, rat }]),
      });

      if (!res.ok) {
        throw new Error("মিল সেভ করা যায়নি!");
      }

      // Refresh global meals from DB
      const mealRes = await fetch(`${API_BASE}/meals`);
      const fetchedMeals = await mealRes.json();
      meals = fetchedMeals.map((m) => ({ ...m, id: m._id }));

      alert(`তারিখ ${date}-এর মিল (${count}টি) সফলভাবে ডাটাবেজে যুক্ত হয়েছে!`);

      // Update the dashboard details for the member
      if (typeof renderMemberDetails === "function") {
        renderMemberDetails("mydetails", memberId);
      }
    } catch (err) {
      console.error("Member meal submit error:", err);
      alert("সার্ভার এরর: মিল সেভ করা সম্ভব হয়নি!");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `সেভ করুন`;
      }
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
  dateInput.removeEventListener("change", populateMyMealForm);
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
