// js/deposits.js
// Deposit Management with Individual Member Breakdown

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

// 1. Render Deposit History Table (Filtered by Member if selected)
function renderDeposits() {
  const tbody = document.getElementById("depositTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filterSelect = document.getElementById("depositFilterMember");
  const selectedMemberId = filterSelect ? filterSelect.value : "all";

  // Filter deposits
  let filtered = [];
  let filterNameText = "সকল সদস্যের মোট জমা";

  if (selectedMemberId && selectedMemberId !== "all") {
    filtered = deposits.filter((d) => d.memberId === selectedMemberId);
    const member = members.find((m) => m.id === selectedMemberId);
    if (member) {
      filterNameText = `নির্বাচিত সদস্য: ${member.name} (রুম: ${member.room || "-"})`;
    }
  } else {
    filtered = [...deposits];
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
            <p class="font-bold text-gray-500">কোনো জমার রেকর্ড পাওয়া যায়নি</p>
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
    const memberName = member ? member.name : "Unknown";
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

// 2. Render Member-Wise Individual Deposit Cards
function renderIndividualDepositCards() {
  const container = document.getElementById("individualDepositsGrid");
  if (!container) return;
  container.innerHTML = "";

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

  members.forEach((m) => {
    const memDeposits = deposits.filter((d) => d.memberId === m.id);
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
            : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
        }"
      >
        <div class="flex items-center gap-3">
          ${
            m.photo
              ? `<img src="${m.photo}" class="w-11 h-11 rounded-2xl object-cover border border-gray-200 shadow-xs flex-shrink-0" />`
              : `<div class="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base flex-shrink-0">${(m.name || "M").charAt(0)}</div>`
          }
          <div class="truncate">
            <h4 class="font-bold text-gray-900 text-sm truncate" title="${m.name}">${m.name}</h4>
            <p class="text-xs text-gray-500 font-mono">রুম: ${m.room || "-"}</p>
          </div>
        </div>

        <!-- Deposit Stats Box -->
        <div class="bg-gray-50 rounded-xl p-2.5 border border-gray-100 space-y-1 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-gray-500">মোট জমা:</span>
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
