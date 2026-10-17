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
  const card = document.getElementById("authCard");
  if (card) {
    card.classList.remove("max-w-xl");
    card.classList.add("max-w-md");
  }
  document.getElementById("loginForm").reset();
}

function showRegister() {
  document.getElementById("loginFormContainer").classList.add("hidden");
  document.getElementById("registerFormContainer").classList.remove("hidden");
  const card = document.getElementById("authCard");
  if (card) {
    card.classList.remove("max-w-md");
    card.classList.add("max-w-xl");
  }
  document.getElementById("registerFormAuth").reset();
  const preview = document.getElementById("regNidPreviewWrapper");
  if (preview) preview.classList.add("hidden");
  const fileName = document.getElementById("regNidFileName");
  if (fileName) fileName.innerText = "আইডি কার্ডের ছবি সিলেক্ট করুন (Choose Photo)";
}

function previewRegisterNid(input) {
  const fileNameSpan = document.getElementById("regNidFileName");
  const previewWrapper = document.getElementById("regNidPreviewWrapper");
  const previewImg = document.getElementById("regNidPreviewImg");

  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (fileNameSpan) fileNameSpan.innerText = file.name;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (e) {
        if (previewImg) previewImg.src = e.target.result;
        if (previewWrapper) previewWrapper.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    } else {
      if (previewWrapper) previewWrapper.classList.add("hidden");
    }
  }
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
    const name = document.getElementById("regName").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const fatherName = document.getElementById("regFatherName").value.trim();
    const fatherPhone = document.getElementById("regFatherPhone").value.trim();
    const presentAddress = document.getElementById("regPresentAddress").value.trim();
    const room = (document.getElementById("regRoom")?.value || "").trim() || "অনির্ধারিত";
    const pin = document.getElementById("regPin").value.trim();
    const nidFileInput = document.getElementById("regNidFile");

    if (!nidFileInput || !nidFileInput.files || nidFileInput.files.length === 0) {
      alert("দয়া করে আপনার এনআইডি বা স্টুডেন্ট আইডি কার্ডের ছবি আপলোড করুন!");
      return;
    }

    const submitBtn = document.getElementById("btnRegisterSubmit");
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> রেজিস্টার সম্পন্ন হচ্ছে...`;
    }

    try {
      // 1. Create or re-activate the member with full personal details & NID photo
      const activeMonth = new Date().toISOString().slice(0, 7);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("fatherName", fatherName);
      formData.append("fatherPhone", fatherPhone);
      formData.append("emergencyContact", fatherPhone);
      formData.append("presentAddress", presentAddress);
      formData.append("address", presentAddress);
      formData.append("room", room);
      formData.append("pin", pin);
      formData.append("activeMonth", activeMonth);
      if (nidFileInput.files[0]) {
        formData.append("nidPicFile", nidFileInput.files[0]);
      }

      const res = await fetch(`${API_BASE}/members`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে!");
        return;
      }

      const memberResult = await res.json();
      await loadData();
      renderMembers();
      updateDropdowns();

      // 2. Log them in
      currentUser = {
        role: "member",
        memberId: memberResult._id || memberResult.id,
        name: memberResult.name,
        phone: memberResult.phone,
        room: memberResult.room,
        fatherName: memberResult.fatherName || "",
        fatherPhone: memberResult.fatherPhone || "",
        presentAddress: memberResult.presentAddress || "",
        photo: memberResult.photo || "",
        nidPic: memberResult.nidPic || "",
        activeMonths: memberResult.activeMonths || [activeMonth],
      };
      localStorage.setItem("mess_user", JSON.stringify(currentUser));

      if (memberResult.isExistingMember) {
        alert(
          memberResult.message ||
            `স্বাগতম ${memberResult.name}! আপনি পূর্বেই রেজিস্টার্ড ছিলেন। আপনার তথ্য আপডেট এবং চলতি মাসের (${activeMonth}) জন্য একাউন্ট সক্রিয় করা হয়েছে!`
        );
      } else {
        alert("সফলভাবে রেজিস্ট্রেশন সম্পন্ন হয়েছে! স্বাগতম।");
      }

      this.reset();
      checkAuth();
    } catch (err) {
      console.error(err);
      alert("সার্ভার এরর হয়েছে!");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
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
    switchTab("dashboard");

    if (typeof initMyMealForm === "function") {
      initMyMealForm();
    }
    if (typeof initMyProfileHeader === "function") {
      initMyProfileHeader();
    }
  }

  if (typeof renderMemberAccountsVisibilityUI === "function") {
    renderMemberAccountsVisibilityUI();
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
      currentUser.nid = freshMember.nid || "";
      currentUser.fatherName = freshMember.fatherName || "";
      currentUser.fatherPhone = freshMember.fatherPhone || freshMember.emergencyContact || "";
      currentUser.emergencyContact = freshMember.fatherPhone || freshMember.emergencyContact || "";
      currentUser.presentAddress = freshMember.presentAddress || freshMember.address || "";
      currentUser.address = freshMember.presentAddress || freshMember.address || "";
      currentUser.nidPic = freshMember.nidPic || "";
      currentUser.documents = freshMember.documents || [];
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
