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

  if (tabId === "dashboard") updateDashboard();
  if (tabId === "members") {
    renderMembers();
    if (typeof loadMonthlyActiveMembersUI === "function") loadMonthlyActiveMembersUI();
  }
  if (tabId === "deposits") {
    if (typeof renderDeposits === "function") renderDeposits();
    if (typeof renderIndividualDepositCards === "function") renderIndividualDepositCards();
  }
  if (tabId === "member-details") renderMemberDetails("md");
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
  const memberSelects = [
    document.getElementById("depositMemberSelect"),
    document.getElementById("expenseMemberSelect"),
    document.getElementById("detailsMemberSelect"),
  ];
  memberSelects.forEach((select) => {
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">সদস্য বাছুন</option>';
    members.forEach((m) => {
      select.innerHTML += `<option value="${m.id}">${m.name}</option>`;
    });
    if (currentVal && members.find((m) => m.id === currentVal)) {
      select.value = currentVal;
    }
  });

  // Populate individual deposit member filter
  const filterSelect = document.getElementById("depositFilterMember");
  if (filterSelect) {
    const currentFilter = filterSelect.value || "all";
    filterSelect.innerHTML = '<option value="all">সকল সদস্যের জমা (All)</option>';
    members.forEach((m) => {
      filterSelect.innerHTML += `<option value="${m.id}">${m.name} (${m.room || "রুম নেই"})</option>`;
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
