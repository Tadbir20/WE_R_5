// js/deposits.js
// Deposit Management with Month-by-Month Filter & Member Overview

let selectedDepositMonth = new Date().toISOString().slice(0, 7);
let isDepositAllMonths = false;

function initDepositMonth() {
  const picker = document.getElementById("depositMonthSelect");
  if (picker && !picker.value) {
    picker.value = selectedDepositMonth;
  }
}

function onDepositMonthChange() {
  const picker = document.getElementById("depositMonthSelect");
  if (picker && picker.value) {
    selectedDepositMonth = picker.value;
    isDepositAllMonths = false;
    updateDepositAllMonthsButtonUI();
  }
  renderDeposits();
  renderIndividualDepositCards();
}

function toggleDepositAllMonths() {
  isDepositAllMonths = !isDepositAllMonths;
  updateDepositAllMonthsButtonUI();
  renderDeposits();
  renderIndividualDepositCards();
}

function updateDepositAllMonthsButtonUI() {
  const btn = document.getElementById("btnDepositAllMonths");
  if (!btn) return;
  if (isDepositAllMonths) {
    btn.className = "text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-600 text-white shadow-xs transition";
    btn.innerText = "চলতি মাস দেখুন";
  } else {
    btn.className = "text-xs font-bold px-2.5 py-1 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition";
    btn.innerText = "সকল মাস";
  }
}

// Deposit Form Submission
document
  .getElementById("depositForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const memberId = document.getElementById("depositMemberSelect").value;
    const amount = parseFloat(document.getElementById("depositAmount").value);
    const date = document.getElementById("depositDate").value;

    if (!memberId) {
      alert("দয়া করে একজন সদস্য নির্বাচন করুন!");
      return;
    }
    if (!amount || amount <= 0) {
      alert("সঠিক টাকার পরিমাণ দিন!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/deposits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, amount, date }),
      });
      const newDeposit = await res.json();
      deposits.push({ ...newDeposit, id: newDeposit._id });

      this.reset();
      document.getElementById("depositDate").valueAsDate = new Date();

      // If deposited date is in another month and we are filtering, auto-switch to that month
      const depMonth = date ? date.slice(0, 7) : "";
      if (depMonth && depMonth !== selectedDepositMonth && !isDepositAllMonths) {
        selectedDepositMonth = depMonth;
        const picker = document.getElementById("depositMonthSelect");
        if (picker) picker.value = selectedDepositMonth;
      }
      
      // Refresh displays
      renderDeposits();
      renderIndividualDepositCards();
      if (typeof updateDashboard === "function") updateDashboard();
      
      alert("টাকা জমা সফলভাবে এন্ট্রি হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে: জমা এন্ট্রি করা যায়নি!");
    }
  });

// 1. Render Deposit History Table (Filtered by Month and Member)
function renderDeposits() {
  initDepositMonth();
  const tbody = document.getElementById("depositTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filterSelect = document.getElementById("depositFilterMember");
  const selectedMemberId = filterSelect ? filterSelect.value : "all";

  // Filter deposits by selected month
  let filtered = [...deposits];
  if (!isDepositAllMonths && selectedDepositMonth) {
    filtered = filtered.filter((d) => d.date && d.date.startsWith(selectedDepositMonth));
  }

  // Filter deposits by selected member
  let filterNameText = isDepositAllMonths
    ? "সকল মাসের মোট জমা"
    : `মাস (${selectedDepositMonth})-এর মোট জমা`;

  if (selectedMemberId && selectedMemberId !== "all") {
    filtered = filtered.filter((d) => d.memberId === selectedMemberId);
    const member = members.find((m) => m.id === selectedMemberId);
    if (member) {
      filterNameText = `সদস্য: ${member.name} (${isDepositAllMonths ? "সকল মাস" : selectedDepositMonth})`;
    }
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Compute total for filtered view
  const totalAmount = filtered.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Update Stats bar
  const nameLabel = document.getElementById("depositFilterNameLabel");
  const countLabel = document.getElementById("depositFilterCountLabel");
  const totalLabel = document.getElementById("depositFilterTotalLabel");

  if (nameLabel) nameLabel.innerText = filterNameText;
  if (countLabel) countLabel.innerText = filtered.length;
  if (totalLabel) totalLabel.innerText = `৳ ${totalAmount.toLocaleString("en-IN")}`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="p-8 text-center text-gray-400">
          <div class="space-y-1">
            <i class="fas fa-folder-open text-2xl mb-1 text-gray-300"></i>
            <p class="font-bold text-gray-600">কোনো জমার রেকর্ড পাওয়া যায়নি</p>
            <p class="text-xs text-gray-400">${
              isDepositAllMonths
                ? "এখনো কোনো জমার রেকর্ড নেই"
                : `মাস ${selectedDepositMonth}-এ এখনো কোনো জমা এন্ট্রি করা হয়নি`
            }</p>
            ${
              selectedMemberId !== "all"
                ? `<button onclick="filterDepositsByMember('all')" class="mt-2 text-xs text-indigo-600 font-bold hover:underline">সকল সদস্যের জমা দেখুন</button>`
                : ""
            }
          </div>
        </td>
      </tr>
    `;
    renderIndividualDepositCards();
    return;
  }

  filtered.forEach((d) => {
    const member = members.find((m) => m.id === d.memberId);
    const memberName = member ? member.name : "অজানা সদস্য";
    const memberRoom = member ? member.room : "";
    const memberPhoto = member && member.photo ? member.photo : "";

    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50/80 transition">
        <td class="p-3 text-gray-600 font-medium text-xs whitespace-nowrap">
          <i class="far fa-calendar-alt text-indigo-500 mr-1.5"></i>${d.date}
        </td>
        <td class="p-3">
          <div class="flex items-center gap-2">
            ${
              memberPhoto
                ? `<img src="${memberPhoto}" class="w-6 h-6 rounded-full object-cover border" />`
                : `<div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">${memberName.charAt(0)}</div>`
            }
            <div>
              <span class="font-bold text-gray-900">${memberName}</span>
              ${memberRoom ? `<span class="text-xs text-gray-400 ml-1 font-normal">(রুম: ${memberRoom})</span>` : ""}
            </div>
          </div>
        </td>
        <td class="p-3 font-mono font-bold text-green-700 text-sm">
          ৳ ${Number(d.amount).toLocaleString("en-IN")}
        </td>
        <td class="p-3 text-center">
          <button 
            onclick="deleteDeposit('${d.id}')" 
            class="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition"
            title="এই জমার রেকর্ড মুছুন"
          >
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  renderIndividualDepositCards();
}

// 2. Render Member-Wise Individual Deposit Cards for the selected month
function renderIndividualDepositCards() {
  const container = document.getElementById("individualDepositsGrid");
  if (!container) return;
  container.innerHTML = "";

  const label = document.getElementById("depositCardsMonthLabel");
  if (label) {
    label.innerText = isDepositAllMonths
      ? "সকল মাস"
      : typeof formatYearMonth === "function"
      ? formatYearMonth(selectedDepositMonth)
      : selectedDepositMonth;
  }

  const totalMembersBadge = document.getElementById("depositMembersSummaryCount");
  if (totalMembersBadge) {
    totalMembersBadge.innerText = `মোট সদস্য: ${members.length} জন`;
  }

  if (members.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-6 text-gray-400">কোনো সদস্য পাওয়া যায়নি</div>`;
    return;
  }

  const filterSelect = document.getElementById("depositFilterMember");
  const currentFilterId = filterSelect ? filterSelect.value : "all";

  // Sort members: Active members for selectedDepositMonth appear first!
  const sortedMembers = [...members].sort((a, b) => {
    const aActive = Array.isArray(a.activeMonths) && a.activeMonths.includes(selectedDepositMonth);
    const bActive = Array.isArray(b.activeMonths) && b.activeMonths.includes(selectedDepositMonth);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  sortedMembers.forEach((m) => {
    const isActive = Array.isArray(m.activeMonths) && m.activeMonths.includes(selectedDepositMonth);

    // Filter deposits by selected month
    const memDeposits = deposits.filter((d) => {
      if (d.memberId !== m.id) return false;
      if (!isDepositAllMonths && selectedDepositMonth) {
        return d.date && d.date.startsWith(selectedDepositMonth);
      }
      return true;
    });

    const memTotal = memDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const depositCount = memDeposits.length;

    // Find latest deposit date
    let lastDepositDate = "-";
    if (depositCount > 0) {
      const sorted = [...memDeposits].sort((a, b) => new Date(b.date) - new Date(a.date));
      lastDepositDate = sorted[0].date;
    }

    const isSelected = currentFilterId === m.id;

    container.innerHTML += `
      <div 
        class="border rounded-2xl p-4 transition shadow-xs flex flex-col justify-between gap-3 ${
          isSelected 
            ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-400" 
            : isActive
            ? "border-green-300 bg-white hover:border-indigo-300 hover:shadow-sm"
            : "border-gray-200 bg-gray-50/40 hover:border-gray-300 opacity-80 hover:opacity-100"
        }"
      >
        <div>
          <div class="flex items-center gap-3">
            ${
              m.photo
                ? `<img src="${m.photo}" class="w-11 h-11 rounded-2xl object-cover border border-gray-200 shadow-xs flex-shrink-0" />`
                : `<div class="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base flex-shrink-0">${(m.name || "M").charAt(0)}</div>`
            }
            <div class="truncate flex-1 min-w-0">
              <h4 class="font-bold text-gray-900 text-sm truncate" title="${m.name}">${m.name}</h4>
              <p class="text-xs text-gray-500 font-mono">রুম: ${m.room || "-"}</p>
              <span class="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isActive ? "bg-green-100 text-green-800 border border-green-200" : "bg-gray-200 text-gray-600"
              }">
                ${isActive ? "✓ সক্রিয়" : "নিষ্ক্রিয়"}
              </span>
            </div>
          </div>

          <!-- Deposit Stats Box -->
          <div class="bg-gray-50 rounded-xl p-2.5 border border-gray-100 space-y-1 text-xs mt-3">
            <div class="flex items-center justify-between">
              <span class="text-gray-500">${isDepositAllMonths ? "মোট জমা:" : "এই মাসের জমা:"}</span>
              <span class="font-black font-mono text-green-700 text-sm">৳ ${memTotal.toLocaleString("en-IN")}</span>
            </div>
            <div class="flex items-center justify-between text-[11px] text-gray-500">
              <span>জমার সংখ্যা:</span>
              <span class="font-bold text-gray-700">${depositCount} বার</span>
            </div>
            <div class="flex items-center justify-between text-[11px] text-gray-400">
              <span>সর্বশেষ:</span>
              <span class="font-medium">${lastDepositDate}</span>
            </div>
          </div>
        </div>

        <!-- Action: Filter Table to this Member -->
        <button
          type="button"
          onclick="filterDepositsByMember('${m.id}')"
          class="w-full text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs ${
            isSelected
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
          }"
        >
          <i class="fas fa-list-ul"></i>
          <span>${isSelected ? "ফিল্টার করা আছে" : "হিস্ট্রি দেখুন"}</span>
        </button>
      </div>
    `;
  });
}

// 3. Quick Action: Filter Deposit Table by Member ID
function filterDepositsByMember(memberId) {
  const filterSelect = document.getElementById("depositFilterMember");
  if (filterSelect) {
    filterSelect.value = memberId;
  }
  renderDeposits();

  // Scroll smoothly to the deposit history container
  const historyContainer = document.getElementById("depositHistoryContainer");
  if (historyContainer) {
    historyContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// 4. Delete Deposit
async function deleteDeposit(id) {
  if (confirm("আপনি কি নিশ্চিত এই জমার রেকর্ডটি মুছে ফেলতে চান?")) {
    try {
      await fetch(`${API_BASE}/deposits/${id}`, { method: "DELETE" });
      deposits = deposits.filter((d) => d.id !== id);
      renderDeposits();
      renderIndividualDepositCards();
      if (typeof updateDashboard === "function") updateDashboard();
      alert("জমার রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে: রেকর্ড মুছতে সমস্যা হয়েছে!");
    }
  }
}
