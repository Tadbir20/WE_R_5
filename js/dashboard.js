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

  const mMeals = meals.filter(
    (meal) => meal.memberId === memberId && meal.count > 0,
  );
  const mMealsSum = mMeals.reduce((s, meal) => s + meal.count, 0);
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
  if (mMeals.length === 0) {
    mealTbody.innerHTML = `<tr><td colspan="4" class="p-2 text-center text-gray-500">কোনো মিলের রেকর্ড নেই</td></tr>`;
  } else {
    mMeals
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((meal) => {
        mealTbody.innerHTML += `
                <tr class="border-b">
                    <td class="p-2">${meal.date}</td>
                    <td class="p-2">${meal.sokal || 0}</td>
                    <td class="p-2">${meal.rat || 0}</td>
                    <td class="p-2 font-bold">${meal.count}</td>
                </tr>
            `;
      });
  }
}
