// js/dashboard.js
// Dashboard Calculation Engine and Member Details

let selectedDashboardMonth = new Date().toISOString().slice(0, 7);

function initDashboardMonth() {
  const monthInput = document.getElementById("dashboardMonthSelect");
  if (monthInput && !monthInput.value) {
    monthInput.value = selectedDashboardMonth;
  }
}

function onDashboardMonthChange() {
  const monthInput = document.getElementById("dashboardMonthSelect");
  if (monthInput && monthInput.value) {
    selectedDashboardMonth = monthInput.value;
  }
  updateDashboard();
}

function updateDashboard() {
  initDashboardMonth();
  renderMemberAccountsVisibilityUI();
  const monthInput = document.getElementById("dashboardMonthSelect");
  const currentMonth = monthInput && monthInput.value ? monthInput.value : selectedDashboardMonth;

  // Update Statement Link
  const stmtLink = document.getElementById("btnDashboardStatementLink");
  if (stmtLink) {
    stmtLink.href = `statement.html?month=${currentMonth}`;
  }

  // Filter records by selected month
  const monthDeposits = deposits.filter((d) => d.date && d.date.startsWith(currentMonth));
  const monthExpenses = expenses.filter((ex) => ex.date && ex.date.startsWith(currentMonth));
  const monthMeals = meals.filter((m) => m.date && m.date.startsWith(currentMonth));

  let totalDeposit = monthDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  document.getElementById("totalDeposit").innerText = `৳ ${totalDeposit}`;

  let totalBazar = monthExpenses.reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
  document.getElementById("totalBazarCost").innerText = `৳ ${totalBazar}`;

  let totalMeals = monthMeals.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
  document.getElementById("totalMealsCount").innerText = totalMeals;

  let mealRate = totalMeals > 0 ? totalBazar / totalMeals : 0;
  document.getElementById("currentMealRate").innerText = `৳ ${mealRate.toFixed(2)}`;

  const summaryTbody = document.getElementById("summaryTableBody");
  if (!summaryTbody) return;
  summaryTbody.innerHTML = "";

  // Filter active members for this month (or members with activity in this month)
  const activeMembers = members.filter((m) => {
    const activeList = Array.isArray(m.activeMonths) ? m.activeMonths : [];
    const hasActivity =
      monthMeals.some((meal) => meal.memberId === m.id && Number(meal.count) > 0) ||
      monthDeposits.some((d) => d.memberId === m.id && Number(d.amount) > 0);
    return activeList.includes(currentMonth) || hasActivity;
  });

  if (activeMembers.length === 0) {
    summaryTbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-6 text-center text-gray-500">
          <div class="space-y-1">
            <p class="font-bold text-gray-700">মাস ${currentMonth}-এর জন্য কোনো সক্রিয় সদস্য পাওয়া যায়নি!</p>
            <p class="text-xs text-gray-400">'সদস্য ব্যবস্থাপনা' মেনু থেকে এই মাসের জন্য সক্রিয় সদস্য নির্বাচন করুন।</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  activeMembers.forEach((m) => {
    const mDeposit = monthDeposits
      .filter((d) => d.memberId === m.id)
      .reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const mMeals = monthMeals
      .filter((meal) => meal.memberId === m.id)
      .reduce((s, meal) => s + (Number(meal.count) || 0), 0);
    const mMealCost = mMeals * mealRate;
    const balance = mDeposit - mMealCost;

    summaryTbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50 transition">
        <td class="p-3 font-semibold text-gray-900 flex items-center gap-2">
          ${
            m.photo
              ? `<img src="${m.photo}" class="w-6 h-6 rounded-full object-cover border" />`
              : `<div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">${(m.name || "M").charAt(0)}</div>`
          }
          <span>${m.name}</span>
        </td>
        <td class="p-3 text-green-600 font-semibold font-mono">৳ ${mDeposit}</td>
        <td class="p-3 font-bold">${mMeals}</td>
        <td class="p-3 font-semibold font-mono text-gray-800">৳ ${mMealCost.toFixed(2)}</td>
        <td class="p-3 font-bold font-mono ${balance >= 0 ? "text-blue-600" : "text-red-600"}">
          ৳ ${balance.toFixed(2)} ${balance >= 0 ? "(পাওনা)" : "(বাকি)"}
        </td>
      </tr>
    `;
  });
}

function renderMemberDetails(prefix = "md", forcedMemberId = null) {
  let memberId = forcedMemberId;
  if (!memberId) {
    if (prefix === "md") {
      const select = document.getElementById("detailsMemberSelect");
      if (select) memberId = select.value;
    } else if (currentUser && currentUser.memberId) {
      memberId = currentUser.memberId;
    }
  }

  const contentDiv = document.getElementById(prefix + "memberDetailsContent");
  if (!contentDiv) return;

  if (!memberId) {
    contentDiv.classList.add("hidden");
    return;
  }

  contentDiv.classList.remove("hidden");

  // Get selected month
  let selectedMonth = "";
  if (prefix === "mydetails") {
    // User member can ONLY view current month details
    selectedMonth = new Date().toISOString().slice(0, 7);
    const badgeEl = document.getElementById("myCurrentMonthBadge");
    if (badgeEl) {
      badgeEl.innerText = typeof formatYearMonth === "function" ? formatYearMonth(selectedMonth) : selectedMonth;
    }
  } else {
    // Admin can select any month
    const monthInput = document.getElementById(prefix + "MonthSelect");
    if (monthInput && !monthInput.value) {
      monthInput.value = new Date().toISOString().slice(0, 7);
    }
    selectedMonth = monthInput ? monthInput.value : "";
  }

  // Find member profile details
  const member = members.find((m) => m.id === memberId);
  if (member && prefix === "md") {
    const photoEl = document.getElementById("mdProfilePhoto");
    const nameEl = document.getElementById("mdProfileName");
    const phoneEl = document.getElementById("mdProfilePhone");
    const roomEl = document.getElementById("mdProfileRoom");
    const emEl = document.getElementById("mdProfileEmergency");
    const nidEl = document.getElementById("mdProfileNid");
    const addrEl = document.getElementById("mdProfileAddress");
    const badgeEl = document.getElementById("mdProfileActiveBadge");

    if (photoEl) {
      photoEl.src = member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=4338ca&color=fff&bold=true`;
    }
    if (nameEl) nameEl.innerText = member.name;
    if (phoneEl) phoneEl.innerText = member.phone;
    if (roomEl) roomEl.innerText = member.room || "-";
    if (emEl) emEl.innerText = member.emergencyContact || "প্রযোজ্য নয়";
    if (nidEl) nidEl.innerText = member.nid || "সংযুক্ত নেই";
    if (addrEl) addrEl.innerText = member.address || "দেওয়া হয়নি";

    if (badgeEl) {
      const isActive = Array.isArray(member.activeMonths) && member.activeMonths.includes(selectedMonth);
      badgeEl.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
          isActive
            ? "bg-green-500/20 text-green-300 border border-green-400/40"
            : "bg-gray-700 text-gray-300 border border-gray-600"
        }">
          <i class="fas ${isActive ? "fa-check-circle text-green-400" : "fa-times-circle text-gray-400"} text-xs"></i>
          ${selectedMonth ? selectedMonth + " মাসে " + (isActive ? "সক্রিয়" : "নিষ্ক্রিয়") : "সকল রেকর্ড"}
        </span>
      `;
    }
  }

  // Filter mess records by selected month for accurate monthly meal rate
  const monthExpenses = expenses.filter(
    (ex) => !selectedMonth || (ex.date && ex.date.startsWith(selectedMonth))
  );
  const monthMeals = meals.filter(
    (m) => !selectedMonth || (m.date && m.date.startsWith(selectedMonth))
  );

  const totalMonthBazar = monthExpenses.reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
  const totalMonthMeals = monthMeals.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
  const mealRate = totalMonthMeals > 0 ? totalMonthBazar / totalMonthMeals : 0;

  // Filter member's deposits and meals by selected month
  const mDeposits = deposits.filter(
    (d) => d.memberId === memberId && (!selectedMonth || (d.date && d.date.startsWith(selectedMonth)))
  );
  const mDepositSum = mDeposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  const mMeals = meals.filter(
    (meal) => meal.memberId === memberId && (!selectedMonth || (meal.date && meal.date.startsWith(selectedMonth)))
  );
  const mMealsSum = mMeals.reduce((s, meal) => s + (Number(meal.count) || 0), 0);
  const mMealCost = mMealsSum * mealRate;

  const balance = mDepositSum - mMealCost;

  document.getElementById(prefix + "TotalDeposit").innerText = `৳ ${mDepositSum.toLocaleString("en-IN")}`;
  document.getElementById(prefix + "TotalMeals").innerText = mMealsSum;
  const rateEl = document.getElementById(prefix + "MealRate");
  if (rateEl) {
    rateEl.innerText = `৳ ${mealRate.toFixed(2)}`;
  }
  document.getElementById(prefix + "MealCost").innerText = `৳ ${mMealCost.toFixed(2)}`;
  document.getElementById(prefix + "Balance").innerText = `৳ ${balance.toFixed(2)} ${
    balance >= 0 ? "(পাওনা)" : "(বাকি)"
  }`;

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
                  step="1"
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
                  step="1"
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
    const s = parseInt(sokalInput.value, 10) || 0;
    const r = parseInt(ratInput.value, 10) || 0;
    totalCell.innerText = s + r;
  }
}

async function saveSingleMemberDetailMeal(memberId, mealId, date) {
  const sokalInput = document.getElementById(`md-sokal-${mealId}`);
  const ratInput = document.getElementById(`md-rat-${mealId}`);
  const btn = document.getElementById(`btn-save-meal-${mealId}`);

  if (!sokalInput || !ratInput) return;
  const sokal = parseInt(sokalInput.value, 10) || 0;
  const rat = parseInt(ratInput.value, 10) || 0;
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
      const sokal = parseInt(sInput.value, 10) || 0;
      const rat = parseInt(rInput.value, 10) || 0;
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
  const sokal = parseInt(sokalInput ? sokalInput.value : 0, 10) || 0;
  const rat = parseInt(ratInput ? ratInput.value : 0, 10) || 0;
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

// =========================================================================
// Individual Member Statement PDF Generation & Printing
// =========================================================================

async function prepareMemberPdfData(prefix = "md") {
  if (prefix !== "md" || !currentUser || currentUser.role !== "admin") {
    alert("সদস্যদের জন্য ব্যক্তিগত PDF স্টেটমেন্ট ডাউনলোড প্রযোজ্য নয়। শুধুমাত্র অ্যাডমিন স্টেটমেন্ট ডাউনলোড করতে পারবেন।");
    return null;
  }

  let memberId = null;
  const select = document.getElementById("detailsMemberSelect");
  if (select) memberId = select.value;

  if (!memberId) {
    alert("কোনো সদস্য নির্বাচিত করা হয়নি!");
    return null;
  }

  const member = members.find((m) => m.id === memberId);
  if (!member) {
    alert("সদস্যের তথ্য পাওয়া যায়নি!");
    return null;
  }

  const monthInput = document.getElementById("mdMonthSelect");
  const targetMonth = monthInput && monthInput.value ? monthInput.value : new Date().toISOString().slice(0, 7);

  // Month calculations
  const monthExpenses = expenses.filter(
    (ex) => !targetMonth || (ex.date && ex.date.startsWith(targetMonth))
  );
  const monthMeals = meals.filter(
    (m) => !targetMonth || (m.date && m.date.startsWith(targetMonth))
  );

  const totalMonthBazar = monthExpenses.reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
  const totalMonthMeals = monthMeals.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
  const mealRate = totalMonthMeals > 0 ? totalMonthBazar / totalMonthMeals : 0;

  // Member's month deposits and meals
  const mDeposits = deposits.filter(
    (d) => d.memberId === memberId && (!targetMonth || (d.date && d.date.startsWith(targetMonth)))
  );
  mDeposits.sort((a, b) => new Date(a.date) - new Date(b.date));
  const mDepositSum = mDeposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  const mMeals = meals.filter(
    (meal) => meal.memberId === memberId && (!targetMonth || (meal.date && meal.date.startsWith(targetMonth)))
  );
  mMeals.sort((a, b) => new Date(a.date) - new Date(b.date));
  const mMealsSum = mMeals.reduce((s, meal) => s + (Number(meal.count) || 0), 0);
  const mMealCost = mMealsSum * mealRate;
  const balance = mDepositSum - mMealCost;

  // Populate PDF Template Elements
  const sheetTitleEl = document.getElementById("pdfSheetTitle");
  if (sheetTitleEl) {
    sheetTitleEl.innerText = `${member.name} Statement`;
  }
  document.getElementById("pdfSheetMemberName").innerText = member.name;
  if (document.getElementById("pdfSheetFatherName")) {
    document.getElementById("pdfSheetFatherName").innerText = member.fatherName || "-";
  }
  document.getElementById("pdfSheetPhone").innerText = member.phone || "-";
  document.getElementById("pdfSheetRoom").innerText = member.room || "-";
  document.getElementById("pdfSheetEmergency").innerText = member.fatherPhone || member.emergencyContact || "N/A";
  if (document.getElementById("pdfSheetNid")) {
    document.getElementById("pdfSheetNid").innerText = member.nid || "Not Provided";
  }
  document.getElementById("pdfSheetAddress").innerText = member.presentAddress || member.address || "Not Provided";

  const getEnglishMonth = (monthStr) => {
    if (!monthStr) return "";
    const parts = monthStr.split("-");
    if (parts.length === 2) {
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const monthNamesEn = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      if (monthNum >= 1 && monthNum <= 12) {
        return `${monthNamesEn[monthNum - 1]} ${year}`;
      }
    }
    return monthStr;
  };
  const englishMonth = getEnglishMonth(targetMonth);
  document.getElementById("pdfSheetMonthLabel").innerText = englishMonth;

  document.getElementById("pdfSheetTotalDeposit").innerText = `৳ ${mDepositSum.toLocaleString("en-US")}`;
  document.getElementById("pdfSheetTotalMeals").innerText = mMealsSum;
  document.getElementById("pdfSheetMealRate").innerText = mealRate.toFixed(2);
  document.getElementById("pdfSheetMealCost").innerText = `৳ ${mMealCost.toFixed(2)}`;
  document.getElementById("pdfSheetBalance").innerText = `৳ ${balance.toFixed(2)} ${balance >= 0 ? "(Refundable)" : "(Due)"}`;
  document.getElementById("pdfSheetFootDeposit").innerText = `৳ ${mDepositSum.toLocaleString("en-US")}`;
  document.getElementById("pdfSheetFootMeals").innerText = mMealsSum;

  const now = new Date();
  const printDateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) + " " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("pdfSheetGeneratedDate").innerText = `Printed: ${printDateStr}`;

  // Populate deposit rows
  const depTbody = document.getElementById("pdfSheetDepositRows");
  depTbody.innerHTML = "";
  if (mDeposits.length === 0) {
    depTbody.innerHTML = `<tr><td colspan="2" style="border: 1px solid #111827; padding: 6px; text-align: center; color: #6b7280;">No deposit records found for this month</td></tr>`;
  } else {
    mDeposits.forEach((d) => {
      depTbody.innerHTML += `
        <tr>
          <td style="border: 1px solid #111827; padding: 4px 6px;">${d.date}</td>
          <td style="border: 1px solid #111827; padding: 4px 6px; text-align: right; font-weight: bold; color: #15803d;">৳ ${Number(d.amount).toLocaleString("en-US")}</td>
        </tr>
      `;
    });
  }

  // Populate meal rows
  const mealTbody = document.getElementById("pdfSheetMealRows");
  mealTbody.innerHTML = "";
  if (mMeals.length === 0) {
    mealTbody.innerHTML = `<tr><td colspan="4" style="border: 1px solid #111827; padding: 6px; text-align: center; color: #6b7280;">No meal records found for this month</td></tr>`;
  } else {
    mMeals.forEach((meal) => {
      const sokal = meal.sokal !== undefined ? meal.sokal : 0;
      const rat = meal.rat !== undefined ? meal.rat : 0;
      const count = meal.count !== undefined ? meal.count : sokal + rat;
      mealTbody.innerHTML += `
        <tr>
          <td style="border: 1px solid #111827; padding: 3px 6px;">${meal.date}</td>
          <td style="border: 1px solid #111827; padding: 3px 6px; text-align: center;">${sokal}</td>
          <td style="border: 1px solid #111827; padding: 3px 6px; text-align: center;">${rat}</td>
          <td style="border: 1px solid #111827; padding: 3px 6px; text-align: center; font-weight: bold;">${count}</td>
        </tr>
      `;
    });
  }

  return { member, targetMonth };
}

async function downloadMemberStatementPDF(prefix = "md") {
  if (!currentUser || currentUser.role !== "admin") {
    alert("শুধুমাত্র অ্যাডমিন স্টেটমেন্ট PDF ডাউনলোড করতে পারবেন!");
    return;
  }

  const btn = document.getElementById("btnDownloadMemberPdf");
  const originalHtml = btn ? btn.innerHTML : "";

  try {
    const data = await prepareMemberPdfData(prefix);
    if (!data) return;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> PDF তৈরি হচ্ছে...`;
    }

    const container = document.getElementById("individualMemberPdfContainer");
    const sheet = document.getElementById("individualMemberPdfSheet");
    if (!container || !sheet) throw new Error("PDF টেমপ্লেট পাওয়া যায়নি!");

    container.classList.remove("hidden");

    // Wait for fonts to finish rendering
    if (document.fonts) {
      await document.fonts.ready;
    }

    const safeName = (data.member.name || "Member").replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, "_");
    const opt = {
      margin: [6, 6, 6, 6],
      filename: `${safeName}-Statement-${data.targetMonth}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    await html2pdf().set(opt).from(sheet).save();
  } catch (err) {
    console.error("PDF generation error:", err);
    alert("PDF তৈরিতে সমস্যা হয়েছে! প্রিন্ট অপশন ব্যবহার করে 'Save as PDF' করতে পারেন।");
  } finally {
    const container = document.getElementById("individualMemberPdfContainer");
    if (container) container.classList.add("hidden");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

async function printMemberStatement(prefix = "md") {
  if (!currentUser || currentUser.role !== "admin") {
    alert("শুধুমাত্র অ্যাডমিন স্টেটমেন্ট প্রিন্ট করতে পারবেন!");
    return;
  }

  const data = await prepareMemberPdfData(prefix);
  if (!data) return;

  const sheet = document.getElementById("individualMemberPdfSheet");
  if (!sheet) return;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.member.name} Statement - ${data.targetMonth}</title>
        <base href="${window.location.origin}/" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <style>
          body { font-family: 'Noto Sans Bengali', Arial, sans-serif; margin: 0; padding: 15px; color: #111827; }
          @page { size: A4 portrait; margin: 8mm; }
        </style>
      </head>
      <body>
        ${sheet.innerHTML}
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// =========================================================================
// Accounts of Members Visibility Management (Admin Toggle)
// =========================================================================

function renderMemberAccountsVisibilityUI() {
  const card = document.getElementById("dashboardMemberAccountsCard");
  const toggleBtn = document.getElementById("btnToggleMemberAccountsVisibility");
  const thumb = document.getElementById("toggleMemberAccountsThumb");
  const label = document.getElementById("memberAccountsVisibilityStatusLabel");
  const notice = document.getElementById("adminAccountsHiddenNotice");

  const isAdmin = currentUser && currentUser.role === "admin";

  if (isAdmin) {
    // Admin always sees the card
    if (card) card.classList.remove("hidden");

    // Update toggle switch state for Admin
    if (toggleBtn && thumb && label) {
      if (isMemberAccountsVisible) {
        toggleBtn.classList.remove("bg-gray-300");
        toggleBtn.classList.add("bg-green-600");
        toggleBtn.setAttribute("aria-checked", "true");
        thumb.classList.remove("translate-x-0");
        thumb.classList.add("translate-x-5");
        label.innerText = "চালু (ON)";
        label.className = "text-xs font-black text-green-700 whitespace-nowrap";
        if (notice) notice.classList.add("hidden");
      } else {
        toggleBtn.classList.remove("bg-green-600");
        toggleBtn.classList.add("bg-gray-300");
        toggleBtn.setAttribute("aria-checked", "false");
        thumb.classList.remove("translate-x-5");
        thumb.classList.add("translate-x-0");
        label.innerText = "বন্ধ (OFF)";
        label.className = "text-xs font-black text-gray-500 whitespace-nowrap";
        if (notice) notice.classList.remove("hidden");
      }
    }
  } else {
    // Member view: Only show if admin turned it ON
    if (card) {
      if (isMemberAccountsVisible) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    }
  }
}

async function toggleMemberAccountsVisibility() {
  if (!currentUser || currentUser.role !== "admin") {
    alert("শুধুমাত্র অ্যাডমিন এই সেটিংস পরিবর্তন করতে পারবেন!");
    return;
  }

  isMemberAccountsVisible = !isMemberAccountsVisible;
  renderMemberAccountsVisibilityUI();

  try {
    const res = await fetch(`${API_BASE}/settings/memberAccountsVisibility`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: isMemberAccountsVisible }),
    });

    if (!res.ok) throw new Error("সেটিংস সেভ হতে ব্যর্থ হয়েছে");

    if (isMemberAccountsVisible) {
      alert("সদস্যদের হিসাবের বিবরণী (Accounts of members) এখন সকল মেম্বারদের জন্য চালু (দৃশ্যমান) করা হয়েছে।");
    } else {
      alert("সদস্যদের হিসাবের বিবরণী (Accounts of members) এখন মেম্বারদের জন্য বন্ধ (গোপন) করা হয়েছে।");
    }
  } catch (err) {
    console.error("Save visibility setting error:", err);
    // Revert state if failed
    isMemberAccountsVisible = !isMemberAccountsVisible;
    renderMemberAccountsVisibilityUI();
    alert("সার্ভার এরর: সেটিংস আপডেট করা যায়নি!");
  }
}

