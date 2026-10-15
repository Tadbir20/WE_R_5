// js/auth.js
// Authentication Logic with MongoDB

function checkAuth() {
  if (!currentUser) {
    document.getElementById("authContainer").classList.remove("hidden");
    document.getElementById("appContainer").classList.add("hidden");
    showLogin();
  } else {
    document.getElementById("authContainer").classList.add("hidden");
    document.getElementById("appContainer").classList.remove("hidden");
    applyRolePermissions();
  }
}

function showLogin() {
  document.getElementById("registerFormContainer").classList.add("hidden");
  document.getElementById("loginFormContainer").classList.remove("hidden");
  document.getElementById("loginForm").reset();
}

function showRegister() {
  document.getElementById("loginFormContainer").classList.add("hidden");
  document.getElementById("registerFormContainer").classList.remove("hidden");
  document.getElementById("registerFormAuth").reset();
}

document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const password = document.getElementById("loginPassword").value;
    const phone = document.getElementById("loginPhone").value;

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, phone }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        currentUser = data.user;
        localStorage.setItem("mess_user", JSON.stringify(currentUser));
        checkAuth();
      } else {
        alert(data.error || "লগইন ব্যর্থ হয়েছে!");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("সার্ভার এরর!");
    }
  });

document
  .getElementById("registerFormAuth")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("regName").value;
    const phone = document.getElementById("regPhone").value;
    const room = document.getElementById("regRoom").value;
    const pin = document.getElementById("regPin").value;

    try {
      // 1. Create the member
      const res = await fetch(`${API_BASE}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, room, pin }),
      });

      if (!res.ok) {
        alert("রেজিস্ট্রেশন ব্যর্থ হয়েছে!");
        return;
      }

      const newMember = await res.json();
      members.push({ ...newMember, id: newMember._id });
      renderMembers();
      updateDropdowns();

      // 2. Log them in
      currentUser = {
        role: "member",
        memberId: newMember._id,
        name: newMember.name,
      };
      localStorage.setItem("mess_user", JSON.stringify(currentUser));

      alert("সফলভাবে রেজিস্ট্রেশন হয়েছে!");
      this.reset();
      checkAuth();
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে!");
    }
  });

function logout() {
  currentUser = null;
  localStorage.removeItem("mess_user");
  checkAuth();
}

function applyRolePermissions() {
  const adminElements = document.querySelectorAll(".admin-only");
  const adminSections = document.querySelectorAll(".admin-only-section");
  const memberElements = document.querySelectorAll(".member-only");
  const memberSections = document.querySelectorAll(".member-only-section");

  if (currentUser.role === "admin") {
    adminElements.forEach((el) => el.classList.remove("hidden"));
    memberElements.forEach((el) => el.classList.add("hidden"));
    switchTab("dashboard");
  } else {
    adminElements.forEach((el) => el.classList.add("hidden"));
    adminSections.forEach((el) => el.classList.add("hidden"));
    memberElements.forEach((el) => el.classList.remove("hidden"));
    switchTab("my-details");

    if (typeof initMyMealForm === "function") {
      initMyMealForm();
    }
    if (typeof initMyProfileHeader === "function") {
      initMyProfileHeader();
    }
  }
}

// Populate member profile card in tab-my-details
async function initMyProfileHeader() {
  if (!currentUser || currentUser.role !== "member") return;

  const nameEl = document.getElementById("myProfileName");
  const phoneEl = document.getElementById("myProfilePhone");
  const roomEl = document.getElementById("myProfileRoom");
  const avatarEl = document.getElementById("myProfileAvatar");

  if (!nameEl) return;

  nameEl.innerText = currentUser.name || "আমার প্রোফাইল";
  phoneEl.innerHTML = `<i class="fas fa-phone-alt text-xs mr-1"></i> ${currentUser.phone || "-"}`;
  roomEl.innerText = `রুম: ${currentUser.room || "-"}`;

  const avatarSrc = currentUser.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "Member")}&background=6366f1&color=fff&size=128`;
  avatarEl.src = avatarSrc;

  // Also fetch latest from server to ensure fresh profile data
  try {
    const res = await fetch(`${API_BASE}/members/${currentUser.memberId}`);
    if (res.ok) {
      const freshMember = await res.json();
      currentUser.name = freshMember.name;
      currentUser.phone = freshMember.phone;
      currentUser.room = freshMember.room;
      currentUser.photo = freshMember.photo || "";
      localStorage.setItem("mess_user", JSON.stringify(currentUser));

      nameEl.innerText = freshMember.name;
      phoneEl.innerHTML = `<i class="fas fa-phone-alt text-xs mr-1"></i> ${freshMember.phone || "-"}`;
      roomEl.innerText = `রুম: ${freshMember.room || "-"}`;
      avatarEl.src = freshMember.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(freshMember.name)}&background=6366f1&color=fff&size=128`;
    }
  } catch (e) {
    console.error("Error refreshing my profile:", e);
  }
}

// Upload profile photo by member themselves
async function uploadMyProfilePhoto() {
  if (!currentUser || currentUser.role !== "member") return;

  const fileInput = document.getElementById("memberOwnPhotoInput");
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploadType", "photo");

  const statusEl = document.getElementById("myPhotoUploadStatus");
  if (statusEl) {
    statusEl.classList.remove("hidden");
    statusEl.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> ছবি আপলোড হচ্ছে...`;
  }

  try {
    const res = await fetch(`${API_BASE}/members/${currentUser.memberId}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok && data.success) {
      currentUser.photo = data.fileUrl;
      localStorage.setItem("mess_user", JSON.stringify(currentUser));

      const avatarEl = document.getElementById("myProfileAvatar");
      if (avatarEl) avatarEl.src = data.fileUrl;

      alert("আপনার প্রোফাইল ছবি সফলভাবে সেট করা হয়েছে!");
    } else {
      alert(data.error || "ছবি আপলোড ব্যর্থ হয়েছে!");
    }
  } catch (err) {
    console.error("Photo upload error:", err);
    alert("সার্ভার এরর হয়েছে!");
  } finally {
    if (statusEl) statusEl.classList.add("hidden");
    fileInput.value = "";
  }
}
