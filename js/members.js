// js/members.js
// Member Management with MongoDB & Month-by-Month Active Membership

let selectedMonthlyActiveMonth = new Date().toISOString().slice(0, 7); // Default YYYY-MM

// Helper: Format YYYY-MM into readable month and year
function formatYearMonth(monthStr) {
  if (!monthStr) return "";
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const monthNamesEn = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthNamesBn = [
      "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
      "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    ];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${monthNamesBn[monthNum - 1]} ${year} (${monthNamesEn[monthNum - 1]})`;
    }
  }
  return monthStr;
}

// 1. Add / Register Member Form (Admin)
document
  .getElementById("memberForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("memberName").value.trim();
    const phone = document.getElementById("memberPhone").value.trim();
    const room = document.getElementById("memberRoom").value.trim();
    const pin = document.getElementById("memberPin").value.trim();

    const picker = document.getElementById("monthlyMemberPicker");
    const activeMonth = picker ? picker.value : selectedMonthlyActiveMonth;

    try {
      const res = await fetch(`${API_BASE}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, room, pin, activeMonth }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "সদস্য যোগ করতে সমস্যা হয়েছে!");
        return;
      }

      // Refresh global members from DB
      await loadData();

      this.reset();
      renderMembers();
      updateDropdowns();
      loadMonthlyActiveMembersUI();
      if (typeof updateDashboard === "function") updateDashboard();

      if (data.isExistingMember) {
        alert(`স্বাগতম! সদস্য '${data.name}' পূর্বেই ডাটাবেজে ছিলেন। উনাকে ${activeMonth} মাসের জন্য সক্রিয় করা হয়েছে!`);
      } else {
        alert("নতুন সদস্য সফলভাবে যোগ করা হয়েছে!");
      }
    } catch (err) {
      console.error(err);
      alert("সার্ভার এরর হয়েছে!");
    }
  });

// 2. Render All Registered Members Table
function renderMembers() {
  const tbody = document.getElementById("memberTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const countBadge = document.getElementById("allMembersCountBadge");
  if (countBadge) {
    countBadge.innerText = `মোট: ${members.length} জন`;
  }

  if (members.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400">কোনো সদস্য নিবন্ধিত নেই</td></tr>`;
    return;
  }

  members.forEach((m) => {
    const activeList = Array.isArray(m.activeMonths) ? m.activeMonths : [];
    let monthsHtml = "";
    if (activeList.length === 0) {
      monthsHtml = `<span class="text-xs text-gray-400 italic">কোনো মাসে যুক্ত নেই</span>`;
    } else {
      monthsHtml = activeList
        .slice(-3) // Show last 3 active months
        .map(
          (mo) =>
            `<span class="inline-block bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-md border border-indigo-200 mr-1">${mo}</span>`
        )
        .join("");
      if (activeList.length > 3) {
        monthsHtml += `<span class="text-[11px] text-gray-500 font-bold">+${activeList.length - 3}</span>`;
      }
    }

    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50 transition">
        <td class="p-3 font-semibold text-gray-900 flex items-center gap-2">
          ${
            m.photo
              ? `<img src="${m.photo}" class="w-7 h-7 rounded-full object-cover border" />`
              : `<div class="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">${(m.name || "M").charAt(0)}</div>`
          }
          <span>${m.name}</span>
        </td>
        <td class="p-3 text-gray-600 font-mono text-xs">${m.phone}</td>
        <td class="p-3 text-gray-700 font-medium">${m.room}</td>
        <td class="p-3">${monthsHtml}</td>
        <td class="p-3 flex items-center gap-2">
          <button onclick="openMemberDossier('${m.id}')" class="text-indigo-600 hover:text-indigo-800 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow-sm">
            <i class="fas fa-folder-open"></i> ফাইল / ছবি
          </button>
          <button onclick="deleteMember('${m.id}')" class="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition" title="স্থায়ীভাবে মুছুন">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

// 3. Delete Member Permanently
async function deleteMember(id) {
  if (confirm("সতর্কতা: এই সদস্যকে স্থায়ীভাবে ডাটাবেজ থেকে মুছে ফেললে তাঁর সকল মিল, জমা ও খরচের রেকর্ড মুছে যাবে। আপনি কি নিশ্চিত?")) {
    try {
      await fetch(`${API_BASE}/members/${id}`, { method: "DELETE" });
      await loadData();
      renderMembers();
      updateDropdowns();
      loadMonthlyActiveMembersUI();
      if (typeof updateDashboard === "function") updateDashboard();
    } catch (err) {
      console.error(err);
      alert("মুছে ফেলতে এরর হয়েছে!");
    }
  }
}

// 4. Monthly Active Member Selection UI
function initMonthlyMemberPicker() {
  const picker = document.getElementById("monthlyMemberPicker");
  if (picker && !picker.value) {
    picker.value = selectedMonthlyActiveMonth;
  }
  loadMonthlyActiveMembersUI();
}

function loadMonthlyActiveMembersUI() {
  const picker = document.getElementById("monthlyMemberPicker");
  if (!picker) return;

  const currentSelectedMonth = picker.value || selectedMonthlyActiveMonth;
  selectedMonthlyActiveMonth = currentSelectedMonth;

  // Header display
  const monthNameEl = document.getElementById("lblActiveMonthName");
  if (monthNameEl) {
    monthNameEl.innerText = formatYearMonth(currentSelectedMonth);
  }

  const container = document.getElementById("monthlyActiveMembersGrid");
  if (!container) return;
  container.innerHTML = "";

  if (members.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-6 text-gray-400">কোনো নিবন্ধিত সদস্য পাওয়া যায়নি। নতুন সদস্য যোগ করুন।</div>`;
    updateActiveMemberCounts();
    return;
  }

  members.forEach((m) => {
    const activeList = Array.isArray(m.activeMonths) ? m.activeMonths : [];
    const isActive = activeList.includes(currentSelectedMonth);

    container.innerHTML += `
      <div 
        id="monthly-card-${m.id}" 
        onclick="toggleMemberCheckbox('${m.id}')"
        class="border rounded-2xl p-3.5 cursor-pointer transition flex items-center justify-between gap-3 ${
          isActive
            ? "border-green-400 bg-green-50/60 shadow-sm"
            : "border-gray-200 bg-gray-50/50 hover:border-gray-300 opacity-75 hover:opacity-100"
        }"
      >
        <div class="flex items-center gap-3 min-w-0">
          ${
            m.photo
              ? `<img src="${m.photo}" class="w-10 h-10 rounded-xl object-cover border border-gray-200 shadow-xs flex-shrink-0" />`
              : `<div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">${(m.name || "M").charAt(0)}</div>`
          }
          <div class="truncate">
            <h4 class="font-bold text-gray-900 text-sm truncate">${m.name}</h4>
            <p class="text-xs text-gray-500 font-mono">রুম: ${m.room || "-"} | ${m.phone}</p>
            <span class="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isActive ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
            }" id="monthly-badge-${m.id}">
              ${isActive ? "✓ এই মাসে সক্রিয়" : "✗ এই মাসে নিষ্ক্রিয়"}
            </span>
          </div>
        </div>

        <input 
          type="checkbox" 
          class="monthly-member-checkbox w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
          data-member-id="${m.id}"
          ${isActive ? "checked" : ""}
          onclick="event.stopPropagation(); updateCardVisualState('${m.id}')"
        />
      </div>
    `;
  });

  updateActiveMemberCounts();
}

// Toggle on card click
function toggleMemberCheckbox(memberId) {
  const cb = document.querySelector(`.monthly-member-checkbox[data-member-id="${memberId}"]`);
  if (cb) {
    cb.checked = !cb.checked;
    updateCardVisualState(memberId);
  }
}

// Update single card UI after click
function updateCardVisualState(memberId) {
  const cb = document.querySelector(`.monthly-member-checkbox[data-member-id="${memberId}"]`);
  const card = document.getElementById(`monthly-card-${memberId}`);
  const badge = document.getElementById(`monthly-badge-${memberId}`);

  if (cb && card && badge) {
    if (cb.checked) {
      card.className = "border rounded-2xl p-3.5 cursor-pointer transition flex items-center justify-between gap-3 border-green-400 bg-green-50/60 shadow-sm";
      badge.className = "inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-600 text-white";
      badge.innerText = "✓ এই মাসে সক্রিয়";
    } else {
      card.className = "border rounded-2xl p-3.5 cursor-pointer transition flex items-center justify-between gap-3 border-gray-200 bg-gray-50/50 hover:border-gray-300 opacity-75 hover:opacity-100";
      badge.className = "inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600";
      badge.innerText = "✗ এই মাসে নিষ্ক্রিয়";
    }
  }

  updateActiveMemberCounts();
}

function selectAllMonthlyMembers(status) {
  const checkboxes = document.querySelectorAll(".monthly-member-checkbox");
  checkboxes.forEach((cb) => {
    cb.checked = status;
    const memberId = cb.getAttribute("data-member-id");
    updateCardVisualState(memberId);
  });
  updateActiveMemberCounts();
}

function updateActiveMemberCounts() {
  const checkboxes = document.querySelectorAll(".monthly-member-checkbox");
  let activeCount = 0;
  checkboxes.forEach((cb) => {
    if (cb.checked) activeCount++;
  });

  const activeEl = document.getElementById("lblActiveMembersCount");
  const totalEl = document.getElementById("lblTotalRegisteredCount");
  if (activeEl) activeEl.innerText = activeCount;
  if (totalEl) totalEl.innerText = members.length;
}

// Save active members for selected month to backend
async function saveMonthlyActiveMembers() {
  const picker = document.getElementById("monthlyMemberPicker");
  const targetMonth = picker ? picker.value : selectedMonthlyActiveMonth;

  if (!targetMonth) {
    alert("কোনো মাস নির্বাচন করা হয়নি!");
    return;
  }

  const btn = document.getElementById("btnSaveMonthlyActiveMembers");
  const originalHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> সেভ হচ্ছে...`;
  }

  const checkboxes = document.querySelectorAll(".monthly-member-checkbox");
  const activeMemberIds = [];
  checkboxes.forEach((cb) => {
    if (cb.checked) {
      activeMemberIds.push(cb.getAttribute("data-member-id"));
    }
  });

  try {
    const res = await fetch(`${API_BASE}/members/month/${targetMonth}/set-active`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeMemberIds }),
    });

    if (!res.ok) throw new Error("সংরক্ষণ ব্যর্থ হয়েছে!");

    // Refresh local data from DB
    await loadData();
    renderMembers();
    updateDropdowns();
    loadMonthlyActiveMembersUI();

    // Refresh Dashboard and Meals if relevant
    if (typeof updateDashboard === "function") updateDashboard();
    if (typeof refreshAndRenderMeals === "function") refreshAndRenderMeals();

    alert(`সফলভাবে ${targetMonth} মাসের সক্রিয় সদস্য তালিকা সংরক্ষণ করা হয়েছে! (সক্রিয়: ${activeMemberIds.length} জন)`);
  } catch (err) {
    console.error(err);
    alert("সার্ভার এরর: সংরক্ষণ করা সম্ভব হয়নি!");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

// Auto initialize when script loads or DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initMonthlyMemberPicker();
});
