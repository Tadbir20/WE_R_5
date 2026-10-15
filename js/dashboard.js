// js/dashboard.js
// Dashboard Calculation Engine and Member Details

function updateDashboard() {
  let totalDeposit = deposits.reduce((sum, d) => sum + d.amount, 0);
  document.getElementById("totalDeposit").innerText = `৳ ${totalDeposit}`;

  let totalBazar = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  document.getElementById("totalBazarCost").innerText = `৳ ${totalBazar}`;

  let totalMeals = meals.reduce((sum, m) => sum + m.count, 0);
  document.getElementById("totalMealsCount").innerText = totalMeals;

  let mealRate = totalMeals > 0 ? totalBazar / totalMeals : 0;
  document.getElementById("currentMealRate").innerText =
    `৳ ${mealRate.toFixed(2)}`;

  const summaryTbody = document.getElementById("summaryTableBody");
  summaryTbody.innerHTML = "";

  members.forEach((m) => {
    const mDeposit = deposits
      .filter((d) => d.memberId === m.id)
      .reduce((s, d) => s + d.amount, 0);
    const mMeals = meals
      .filter((meal) => meal.memberId === m.id)
      .reduce((s, meal) => s + meal.count, 0);
    const mMealCost = mMeals * mealRate;
    const balance = mDeposit - mMealCost;

    summaryTbody.innerHTML += `
            <tr class="border-b">
                <td class="p-3 font-medium">${m.name}</td>
                <td class="p-3 text-green-600 font-semibold">৳ ${mDeposit}</td>
                <td class="p-3">${mMeals}</td>
                <td class="p-3">৳ ${mMealCost.toFixed(2)}</td>
                <td class="p-3 font-bold ${balance >= 0 ? "text-blue-600" : "text-red-600"}">
                    ৳ ${balance.toFixed(2)} ${balance >= 0 ? "(পাওনা)" : "(বাকি)"}
                </td>
            </tr>
        `;
  });
}

function renderMemberDetails(prefix = "md", forcedMemberId = null) {
  let memberId = forcedMemberId;
  if (!memberId) {
    const select = document.getElementById("detailsMemberSelect");
    if (select) memberId = select.value;
  }

  const contentDiv = document.getElementById(prefix + "memberDetailsContent");
  if (!contentDiv) return;

  if (!memberId) {
    contentDiv.classList.add("hidden");
    return;
  }

  contentDiv.classList.remove("hidden");

  let totalBazar = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  let totalMeals = meals.reduce((sum, m) => sum + m.count, 0);
  let mealRate = totalMeals > 0 ? totalBazar / totalMeals : 0;

  const mDeposits = deposits.filter((d) => d.memberId === memberId);
  const mDepositSum = mDeposits.reduce((s, d) => s + d.amount, 0);

  const mMeals = meals.filter((meal) => meal.memberId === memberId);
  const mMealsSum = mMeals.reduce((s, meal) => s + (Number(meal.count) || 0), 0);
  const mMealCost = mMealsSum * mealRate;

  const balance = mDepositSum - mMealCost;

  document.getElementById(prefix + "TotalDeposit").innerText =
    `৳ ${mDepositSum}`;
  document.getElementById(prefix + "TotalMeals").innerText = mMealsSum;
  document.getElementById(prefix + "MealCost").innerText =
    `৳ ${mMealCost.toFixed(2)}`;
  document.getElementById(prefix + "Balance").innerText =
    `৳ ${balance.toFixed(2)} ${balance >= 0 ? "(পাওনা)" : "(বাকি)"}`;

  if (balance >= 0) {
    document
      .getElementById(prefix + "Balance")
      .classList.replace("text-red-600", "text-blue-600");
  } else {
    document
      .getElementById(prefix + "Balance")
      .classList.replace("text-blue-600", "text-red-600");
    if (
      !document
        .getElementById(prefix + "Balance")
        .classList.contains("text-red-600") &&
      !document
        .getElementById(prefix + "Balance")
        .classList.contains("text-blue-600")
    ) {
      document.getElementById(prefix + "Balance").classList.add("text-red-600");
    }
  }

  const depTbody = document.getElementById(prefix + "DepositTableBody");
  depTbody.innerHTML = "";
  if (mDeposits.length === 0) {
    depTbody.innerHTML = `<tr><td colspan="2" class="p-2 text-center text-gray-500">কোনো জমার রেকর্ড নেই</td></tr>`;
  } else {
    mDeposits
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((d) => {
        depTbody.innerHTML += `
                <tr class="border-b">
                    <td class="p-2">${d.date}</td>
                    <td class="p-2 font-semibold text-green-600">৳ ${d.amount}</td>
                </tr>
            `;
      });
  }

  const mealTbody = document.getElementById(prefix + "MealTableBody");
  mealTbody.innerHTML = "";
  const saveAllContainer = document.getElementById(prefix + "SaveAllContainer");

  if (mMeals.length === 0) {
    mealTbody.innerHTML = `<tr><td colspan="${prefix === "md" ? 5 : 4}" class="p-3 text-center text-gray-400">কোনো মিলের রেকর্ড নেই</td></tr>`;
    if (saveAllContainer) saveAllContainer.classList.add("hidden");
  } else {
    if (saveAllContainer && prefix === "md") saveAllContainer.classList.remove("hidden");

    mMeals
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((meal) => {
        const mealId = meal._id || meal.id;
        const sokal = meal.sokal !== undefined ? meal.sokal : 0;
        const rat = meal.rat !== undefined ? meal.rat : 0;
        const count = meal.count !== undefined ? meal.count : sokal + rat;

        if (prefix === "md") {
          mealTbody.innerHTML += `
            <tr class="border-b hover:bg-gray-50 transition" id="md-meal-row-${mealId}">
              <td class="p-2.5 font-medium text-gray-800 whitespace-nowrap">
                <i class="far fa-calendar-alt text-indigo-500 mr-1.5"></i>${meal.date}
              </td>
              <td class="p-2 text-center">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value="${sokal}"
                  class="md-meal-input-sokal border border-gray-300 rounded-lg px-2 py-1 w-16 text-center font-bold text-gray-800 focus:outline-indigo-500 shadow-sm"
                  data-meal-id="${mealId}"
                  data-date="${meal.date}"
                  id="md-sokal-${mealId}"
                  oninput="updateMemberDetailRowTotal('${mealId}')"
                />
              </td>
              <td class="p-2 text-center">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value="${rat}"
                  class="md-meal-input-rat border border-gray-300 rounded-lg px-2 py-1 w-16 text-center font-bold text-gray-800 focus:outline-indigo-500 shadow-sm"
                  data-meal-id="${mealId}"
                  data-date="${meal.date}"
                  id="md-rat-${mealId}"
                  oninput="updateMemberDetailRowTotal('${mealId}')"
                />
              </td>
              <td class="p-2 text-center font-black text-indigo-900 text-base" id="md-total-${mealId}">
                ${count}
              </td>
              <td class="p-2 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onclick="saveSingleMemberDetailMeal('${memberId}', '${mealId}', '${meal.date}')"
                    id="btn-save-meal-${mealId}"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    title="এই মিল সেভ করুন"
                  >
                    <i class="fas fa-save"></i> সেভ
                  </button>
                  <button
                    type="button"
                    onclick="deleteSingleMemberDetailMeal('${mealId}', '${memberId}', '${meal.date}')"
                    class="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-bold transition border border-red-200"
                    title="এই মিল মুছে ফেলুন"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        } else {
          mealTbody.innerHTML += `
            <tr class="border-b">
              <td class="p-2">${meal.date}</td>
              <td class="p-2 text-center">${sokal}</td>
              <td class="p-2 text-center">${rat}</td>
              <td class="p-2 text-center font-bold">${count}</td>
            </tr>
          `;
        }
      });
  }
}

// ---------------------------------------------
// Admin Member Meal In-line Management Handlers
// ---------------------------------------------

function updateMemberDetailRowTotal(mealId) {
  const sokalInput = document.getElementById(`md-sokal-${mealId}`);
  const ratInput = document.getElementById(`md-rat-${mealId}`);
  const totalCell = document.getElementById(`md-total-${mealId}`);
  if (sokalInput && ratInput && totalCell) {
    const s = parseFloat(sokalInput.value) || 0;
    const r = parseFloat(ratInput.value) || 0;
    totalCell.innerText = Math.round((s + r) * 10) / 10;
  }
}

async function saveSingleMemberDetailMeal(memberId, mealId, date) {
  const sokalInput = document.getElementById(`md-sokal-${mealId}`);
  const ratInput = document.getElementById(`md-rat-${mealId}`);
  const btn = document.getElementById(`btn-save-meal-${mealId}`);

  if (!sokalInput || !ratInput) return;
  const sokal = parseFloat(sokalInput.value) || 0;
  const rat = parseFloat(ratInput.value) || 0;
  const count = sokal + rat;

  const originalBtnHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
  }

  try {
    const res = await fetch(`${API_BASE}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ memberId, date, sokal, rat, count }]),
    });

    if (!res.ok) throw new Error("মিল সেভ করতে ব্যর্থ হয়েছে");

    // Refresh global meals from DB
    const mealRes = await fetch(`${API_BASE}/meals`);
    const fetchedMeals = await mealRes.json();
    meals = fetchedMeals.map((m) => ({ ...m, id: m._id }));

    if (btn) {
      btn.className = "bg-green-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm";
      btn.innerHTML = `<i class="fas fa-check"></i> সেভ হয়েছে`;
      setTimeout(() => {
        renderMemberDetails("md", memberId);
        if (typeof updateDashboard === "function") updateDashboard();
      }, 700);
    } else {
      renderMemberDetails("md", memberId);
      if (typeof updateDashboard === "function") updateDashboard();
    }
  } catch (err) {
    console.error("Save meal error:", err);
    alert("সার্ভার এরর: মিল সেভ করা সম্ভব হয়নি!");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  }
}

async function deleteSingleMemberDetailMeal(mealId, memberId, date) {
  if (!confirm(`তারিখ ${date}-এর মিলটি কি সত্যিই ডাটাবেজ থেকে মুছে ফেলতে চান?`)) return;

  try {
    let res;
    if (mealId && mealId !== "undefined") {
      res = await fetch(`${API_BASE}/meals/${mealId}`, { method: "DELETE" });
    } else {
      res = await fetch(`${API_BASE}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ memberId, date, sokal: 0, rat: 0, count: 0 }]),
      });
    }

    if (!res.ok) throw new Error("মিল মুছতে ব্যর্থ হয়েছে");

    // Refresh global meals from DB
    const mealRes = await fetch(`${API_BASE}/meals`);
    const fetchedMeals = await mealRes.json();
    meals = fetchedMeals.map((m) => ({ ...m, id: m._id }));

    renderMemberDetails("md", memberId);
    if (typeof updateDashboard === "function") updateDashboard();
    alert(`তারিখ ${date}-এর মিল সফলভাবে মুছে ফেলা হয়েছে!`);
  } catch (err) {
    console.error("Delete meal error:", err);
    alert("সার্ভার এরর: মিল মুছে ফেলা সম্ভব হয়নি!");
  }
}

async function saveAllMemberDetailMeals() {
  const select = document.getElementById("detailsMemberSelect");
  if (!select || !select.value) return;
  const memberId = select.value;

  const btn = document.getElementById("btnSaveAllMdMeals");
  const originalHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> সব সেভ হচ্ছে...`;
  }

  const sokalInputs = document.querySelectorAll(".md-meal-input-sokal");
  const newMeals = [];

  sokalInputs.forEach((sInput) => {
    const mealId = sInput.getAttribute("data-meal-id");
    const date = sInput.getAttribute("data-date");
    const rInput = document.querySelector(`.md-meal-input-rat[data-meal-id="${mealId}"]`);

    if (date && rInput) {
      const sokal = parseFloat(sInput.value) || 0;
      const rat = parseFloat(rInput.value) || 0;
      newMeals.push({
        memberId,
        date,
        sokal,
        rat,
        count: sokal + rat,
      });
    }
  });

  if (newMeals.length === 0) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMeals),
    });

    if (!res.ok) throw new Error("সব মিল সেভ করতে সমস্যা হয়েছে");

    // Refresh global meals from DB
    const mealRes = await fetch(`${API_BASE}/meals`);
    const fetchedMeals = await mealRes.json();
    meals = fetchedMeals.map((m) => ({ ...m, id: m._id }));

    renderMemberDetails("md", memberId);
    if (typeof updateDashboard === "function") updateDashboard();
    alert("এই সদস্যের সকল মিল সফলভাবে সেভ ও আপডেট করা হয়েছে!");
  } catch (err) {
    console.error("Save all meals error:", err);
    alert("সার্ভার এরর: মিল সেভ করা সম্ভব হয়নি!");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

function toggleAddMealRow(prefix = "md") {
  const box = document.getElementById(prefix + "AddMealBox");
  if (!box) return;
  box.classList.toggle("hidden");

  const dateInput = document.getElementById(prefix + "NewMealDate");
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
}

async function saveNewMemberMeal(prefix = "md") {
  const select = document.getElementById("detailsMemberSelect");
  if (!select || !select.value) {
    alert("দয়া করে একজন সদস্য নির্বাচন করুন!");
    return;
  }
  const memberId = select.value;

  const dateInput = document.getElementById(prefix + "NewMealDate");
  const sokalInput = document.getElementById(prefix + "NewMealSokal");
  const ratInput = document.getElementById(prefix + "NewMealRat");

  if (!dateInput || !dateInput.value) {
    alert("দয়া করে একটি তারিখ নির্বাচন করুন!");
    return;
  }

  const date = dateInput.value;
  const sokal = parseFloat(sokalInput ? sokalInput.value : 0) || 0;
  const rat = parseFloat(ratInput ? ratInput.value : 0) || 0;
  const count = sokal + rat;

  try {
    const res = await fetch(`${API_BASE}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ memberId, date, sokal, rat, count }]),
    });

    if (!res.ok) throw new Error("নতুন মিল যোগ করতে ব্যর্থ হয়েছে");

    // Refresh global meals from DB
    const mealRes = await fetch(`${API_BASE}/meals`);
    const fetchedMeals = await mealRes.json();
    meals = fetchedMeals.map((m) => ({ ...m, id: m._id }));

    if (sokalInput) sokalInput.value = "1";
    if (ratInput) ratInput.value = "1";
    const box = document.getElementById(prefix + "AddMealBox");
    if (box) box.classList.add("hidden");

    renderMemberDetails("md", memberId);
    if (typeof updateDashboard === "function") updateDashboard();
    alert(`তারিখ ${date}-এ নতুন মিল (${count}টি) সফলভাবে যোগ করা হয়েছে!`);
  } catch (err) {
    console.error("Add new meal error:", err);
    alert("সার্ভার এরর: নতুন মিল যোগ করা সম্ভব হয়নি!");
  }
}
