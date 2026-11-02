// js/ui.js
// UI Interactions, Tab Switching and Dropdowns

function switchTab(tabId) {
  // Members are only allowed to access Dashboard and My Details
  if (currentUser && currentUser.role !== "admin") {
    const allowedTabs = ["dashboard", "my-details"];
    if (!allowedTabs.includes(tabId)) {
      tabId = "dashboard";
    }
  }

  const tabs = [
    "dashboard",
    "members",
    "deposits",
    "meals",
    "expenses",
    "member-details",
    "my-details",
    "backups",
    "member-files",
  ];
  tabs.forEach((t) => {
    const section = document.getElementById(`tab-${t}`);
    if (section) section.classList.add("hidden");
    const navBtn = document.getElementById(`nav-${t}`);
    if (navBtn) navBtn.classList.remove("bg-indigo-800");
  });

  const targetSection = document.getElementById(`tab-${tabId}`);
  if (targetSection) targetSection.classList.remove("hidden");
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeNav) activeNav.classList.add("bg-indigo-800");

  if (tabId === "dashboard") {
    if (typeof initDashboardMonth === "function") initDashboardMonth();
    updateDashboard();
  }
  if (tabId === "members") {
    renderMembers();
    if (typeof loadMonthlyActiveMembersUI === "function") loadMonthlyActiveMembersUI();
  }
  if (tabId === "deposits") {
    if (typeof initDepositMonth === "function") initDepositMonth();
    if (typeof renderDeposits === "function") renderDeposits();
    if (typeof renderIndividualDepositCards === "function") renderIndividualDepositCards();
  }
  if (tabId === "expenses") {
    if (typeof initExpenseMonth === "function") initExpenseMonth();
    if (typeof renderExpenses === "function") renderExpenses();
  }
  if (tabId === "member-details") {
    const mdMonthSelect = document.getElementById("mdMonthSelect");
    if (mdMonthSelect && !mdMonthSelect.value) {
      mdMonthSelect.value = new Date().toISOString().slice(0, 7);
    }
    renderMemberDetails("md");
  }
  if (tabId === "backups") renderBackups();
  if (tabId === "meals" && typeof refreshAndRenderMeals === "function") {
    refreshAndRenderMeals();
  }
  if (tabId === "member-files" && typeof renderMemberFilesList === "function") {
    renderMemberFilesList();
  }
  if (tabId === "my-details" && currentUser && currentUser.role === "member") {
    const detailsSelect = document.getElementById("detailsMemberSelect");
    if (detailsSelect) detailsSelect.value = currentUser.memberId;
    renderMemberDetails("mydetails", currentUser.memberId);
    if (typeof initMyProfileHeader === "function") {
      initMyProfileHeader();
    }
    if (typeof initMyMealForm === "function") {
      initMyMealForm();
    }
  }
}

function updateDropdowns() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Sort members: Current month active members appear FIRST at the top!
  const sortedMembers = [...members].sort((a, b) => {
    const aActive = Array.isArray(a.activeMonths) && a.activeMonths.includes(currentMonth);
    const bActive = Array.isArray(b.activeMonths) && b.activeMonths.includes(currentMonth);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  const memberSelects = [
    document.getElementById("depositMemberSelect"),
    document.getElementById("expenseMemberSelect"),
    document.getElementById("detailsMemberSelect"),
  ];

  memberSelects.forEach((select) => {
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">সদস্য বাছুন</option>';

    sortedMembers.forEach((m) => {
      const isActive = Array.isArray(m.activeMonths) && m.activeMonths.includes(currentMonth);
      select.innerHTML += `<option value="${m.id}">${m.name} ${isActive ? "(চলতি মাসে সক্রিয়)" : ""}</option>`;
    });

    if (currentVal && members.find((m) => m.id === currentVal)) {
      select.value = currentVal;
    } else if (select.id === "detailsMemberSelect" && !select.value) {
      // For Member Details: Auto-select the first active member of current month!
      const firstActive = sortedMembers.find(
        (m) => Array.isArray(m.activeMonths) && m.activeMonths.includes(currentMonth)
      );
      if (firstActive) {
        select.value = firstActive.id;
      } else if (sortedMembers.length > 0) {
        select.value = sortedMembers[0].id;
      }
    }
  });

  // Populate individual deposit member filter
  const filterSelect = document.getElementById("depositFilterMember");
  if (filterSelect) {
    const currentFilter = filterSelect.value || "all";
    filterSelect.innerHTML = '<option value="all">সকল সদস্যের জমা (All)</option>';
    sortedMembers.forEach((m) => {
      const isActive = Array.isArray(m.activeMonths) && m.activeMonths.includes(currentMonth);
      filterSelect.innerHTML += `<option value="${m.id}">${m.name} ${isActive ? "(সক্রিয়)" : ""}</option>`;
    });
    if (currentFilter && (currentFilter === "all" || members.find((m) => m.id === currentFilter))) {
      filterSelect.value = currentFilter;
    }
  }

  if (typeof renderMealInputs === "function") {
    renderMealInputs();
  }

  if (
    document.getElementById("detailsMemberSelect") &&
    document.getElementById("detailsMemberSelect").value
  ) {
    if (typeof renderMemberDetails === "function") {
      renderMemberDetails("md");
    }
  }
}

// Mobile Sidebar Toggle
function toggleSidebar() {
  const sidebar = document.querySelector("aside");
  sidebar.classList.toggle("hidden");
  sidebar.classList.toggle("absolute");
  sidebar.classList.toggle("z-50");
  sidebar.classList.toggle("h-full");
}
