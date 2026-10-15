// js/ui.js
// UI Interactions, Tab Switching and Dropdowns

function switchTab(tabId) {
  const tabs = [
    "dashboard",
    "members",
    "deposits",
    "meals",
    "expenses",
    "member-details",
    "my-details",
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

  // Refresh views if necessary
  if (tabId === "dashboard") updateDashboard();
  if (tabId === "member-details") renderMemberDetails("md");
  if (tabId === "my-details" && currentUser && currentUser.role === "member") {
    document.getElementById("detailsMemberSelect").value = currentUser.memberId;
    renderMemberDetails("mydetails", currentUser.memberId);
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
