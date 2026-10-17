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
      // 1. Create or re-activate the member
      const activeMonth = new Date().toISOString().slice(0, 7);
      const res = await fetch(`${API_BASE}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, room, pin, activeMonth }),
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
        photo: memberResult.photo || "",
        activeMonths: memberResult.activeMonths || [activeMonth],
      };
      localStorage.setItem("mess_user", JSON.stringify(currentUser));

      if (memberResult.isExistingMember) {
        alert(memberResult.message || `স্বাগতম ${memberResult.name}! আপনি পূর্বেই রেজিস্টার্ড ছিলেন। চলতি মাসের (${activeMonth}) জন্য আপনার একাউন্ট সফলভাবে সক্রিয় করা হয়েছে!`);
      } else {
        alert("সফলভাবে রেজিস্ট্রেশন সম্পন্ন হয়েছে!");
      }

      this.reset();
      checkAuth();
    } catch (err) {
      console.error(err);
      alert("সার্ভার এরর হয়েছে!");
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
      currentUser.emergencyContact = freshMember.emergencyContact || "";
      currentUser.address = freshMember.address || "";
      currentUser.nidPic = freshMember.nidPic || "";
      currentUser.documents = freshMember.documents || [];
      localStorage.setItem("mess_user", JSON.stringify(currentUser));

      nameEl.innerText = freshMember.name;
      phoneEl.innerHTML = `<i class="fas fa-phone-alt text-xs mr-1"></i> ${freshMember.phone || "-"}`;
      roomEl.innerText = `রুম: ${freshMember.room || "-"}`;
      avatarEl.src = freshMember.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(freshMember.name)}&background=6366f1&color=fff&size=128`;

      renderMyDocumentsAndProfile(freshMember);
    }
  } catch (e) {
    console.error("Error refreshing my profile:", e);
  }
}

// Populate Member Personal Documents and Profile Fields in tab-my-details
function renderMyDocumentsAndProfile(member) {
  if (!member) return;

  const nidInput = document.getElementById("myNidInput");
  const emergencyInput = document.getElementById("myEmergencyInput");
  const addressInput = document.getElementById("myAddressInput");

  if (nidInput) nidInput.value = member.nid || "";
  if (emergencyInput) emergencyInput.value = member.emergencyContact || "";
  if (addressInput) addressInput.value = member.address || "";

  // Render NID / ID Card preview and badge
  const nidPreview = document.getElementById("myNidPreviewContainer");
  const nidBadge = document.getElementById("myNidStatusBadge");

  if (nidPreview && nidBadge) {
    if (member.nidPic) {
      const isPdf = member.nidPic.toLowerCase().endsWith(".pdf");
      nidPreview.innerHTML = `
        <div class="relative group cursor-pointer w-full h-full" onclick="${
          isPdf
            ? `window.open('${member.nidPic}', '_blank')`
            : `previewImageModal('${member.nidPic}', 'আমার এনআইডি / আইডি কার্ড')`
        }">
          ${
            isPdf
              ? `<div class="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-600"><i class="fas fa-file-pdf text-3xl mb-1"></i><span class="text-[11px] font-bold">PDF ডকুমেন্ট</span></div>`
              : `<img src="${member.nidPic}" class="w-full h-full object-cover" />`
          }
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
            <i class="fas fa-eye mr-1"></i> দেখুন
          </div>
        </div>
      `;
      nidBadge.className = "text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1";
      nidBadge.innerHTML = `<i class="fas fa-check-circle text-xs"></i>সংরক্ষিত`;
    } else {
      nidPreview.innerHTML = `
        <i class="fas fa-id-card text-2xl mb-1 text-gray-300"></i>
        <span>কোনো ছবি নেই</span>
      `;
      nidBadge.className = "text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600";
      nidBadge.innerText = "সংরক্ষিত নেই";
    }
  }

  // Render additional uploaded documents list
  const docsContainer = document.getElementById("mySubmittedDocsContainer");
  if (docsContainer) {
    const docs = member.documents || [];
    if (docs.length === 0) {
      docsContainer.innerHTML = `
        <div class="col-span-full py-6 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <i class="fas fa-folder-open text-2xl mb-1 text-gray-300 block"></i>
          এখনো কোনো অতিরিক্ত ডকুমেন্ট সাবমিট করা হয়নি
        </div>
      `;
    } else {
      docsContainer.innerHTML = "";
      docs.forEach((doc) => {
        const isPdf = doc.fileUrl.toLowerCase().endsWith(".pdf");
        const isImg = doc.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);
        const dateStr = new Date(doc.uploadedAt || Date.now()).toLocaleDateString("bn-BD");
        docsContainer.innerHTML += `
          <div class="bg-white p-3 rounded-xl border border-gray-200 flex flex-col justify-between shadow-xs">
            <div class="flex items-start gap-2.5">
              <div class="w-9 h-9 rounded-lg ${
                isPdf ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"
              } flex items-center justify-center flex-shrink-0 text-base">
                <i class="fas ${isPdf ? "fa-file-pdf" : isImg ? "fa-image" : "fa-file-alt"}"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h6 class="text-xs font-bold text-gray-800 truncate" title="${doc.title}">${doc.title}</h6>
                <p class="text-[10px] text-gray-400 mt-0.5"><i class="far fa-calendar-alt mr-1"></i>${dateStr}</p>
              </div>
            </div>
            <div class="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onclick="${
                  isImg
                    ? `previewImageModal('${doc.fileUrl}', '${doc.title}')`
                    : `window.open('${doc.fileUrl}', '_blank')`
                }"
                class="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1"
              >
                <i class="fas fa-eye"></i> দেখুন
              </button>
              <button
                type="button"
                onclick="deleteMyDocument('${doc._id}')"
                class="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                title="মুছে ফেলুন"
              >
                <i class="fas fa-trash-alt"></i> মুছুন
              </button>
            </div>
          </div>
        `;
      });
    }
  }
}

// Save Member Personal Information Form (NID, Emergency, Address)
async function saveMyPersonalDetails(e) {
  if (e) e.preventDefault();
  if (!currentUser || currentUser.role !== "member") return;

  const nid = (document.getElementById("myNidInput")?.value || "").trim();
  const emergencyContact = (document.getElementById("myEmergencyInput")?.value || "").trim();
  const address = (document.getElementById("myAddressInput")?.value || "").trim();

  const btn = document.getElementById("btnSaveMyPersonalDetails");
  const originalHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> সংরক্ষণ হচ্ছে...`;
  }

  try {
    const res = await fetch(`${API_BASE}/members/${currentUser.memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nid, emergencyContact, address }),
    });

    const data = await res.json();
    if (res.ok) {
      currentUser.nid = data.nid;
      currentUser.emergencyContact = data.emergencyContact;
      currentUser.address = data.address;
      localStorage.setItem("mess_user", JSON.stringify(currentUser));
      alert("আপনার ব্যক্তিগত তথ্য ডাটাবেজে সফলভাবে সংরক্ষণ করা হয়েছে!");
    } else {
      alert(data.error || "তথ্য সংরক্ষণ ব্যর্থ হয়েছে!");
    }
  } catch (err) {
    console.error("Save personal details error:", err);
    alert("সার্ভার এরর: তথ্য সংরক্ষণ সম্ভব হয়নি!");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

// Upload NID / Student ID Card Photo or Scan
async function uploadMyNidFile() {
  if (!currentUser || currentUser.role !== "member") return;

  const fileInput = document.getElementById("myNidFileInput");
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploadType", "nidPic");

  const statusEl = document.getElementById("myNidUploadStatus");
  if (statusEl) {
    statusEl.classList.remove("hidden");
    statusEl.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> আইডি কার্ড আপলোড হচ্ছে...`;
  }

  try {
    const res = await fetch(`${API_BASE}/members/${currentUser.memberId}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok && data.success) {
      currentUser.nidPic = data.fileUrl;
      localStorage.setItem("mess_user", JSON.stringify(currentUser));
      alert("আইডি কার্ডের ছবি সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!");
      initMyProfileHeader();
    } else {
      alert(data.error || "আপলোড ব্যর্থ হয়েছে!");
    }
  } catch (err) {
    console.error("NID upload error:", err);
    alert("সার্ভার এরর হয়েছে!");
  } finally {
    if (statusEl) statusEl.classList.add("hidden");
    fileInput.value = "";
  }
}

// Upload Additional Document / Certificate
async function uploadMyAdditionalDocument() {
  if (!currentUser || currentUser.role !== "member") return;

  const titleInput = document.getElementById("myDocTitleInput");
  const fileInput = document.getElementById("myDocFileInput");
  const title = titleInput ? titleInput.value.trim() : "";

  if (!title) {
    alert("দয়া করে ডকুমেন্টের নাম বা শিরোনাম লিখুন!");
    return;
  }

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert("দয়া করে একটি ডকুমেন্ট ফাইল নির্বাচন করুন!");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploadType", "document");
  formData.append("title", title);

  const statusEl = document.getElementById("myDocUploadStatus");
  const btn = document.getElementById("btnSubmitMyDoc");
  const origBtn = btn ? btn.innerHTML : "";

  if (statusEl) {
    statusEl.classList.remove("hidden");
    statusEl.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> ডকুমেন্ট ডাটাবেজে সাবমিট হচ্ছে...`;
  }
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
  }

  try {
    const res = await fetch(`${API_BASE}/members/${currentUser.memberId}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert("ডকুমেন্ট সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!");
      if (titleInput) titleInput.value = "";
      if (fileInput) fileInput.value = "";
      initMyProfileHeader();
    } else {
      alert(data.error || "ডকুমেন্ট আপলোড ব্যর্থ হয়েছে!");
    }
  } catch (err) {
    console.error("Doc upload error:", err);
    alert("সার্ভার এরর হয়েছে!");
  } finally {
    if (statusEl) statusEl.classList.add("hidden");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtn;
    }
  }
}

// Delete Document from Member's Archive
async function deleteMyDocument(docId) {
  if (!currentUser || currentUser.role !== "member") return;
  if (!confirm("আপনি কি নিশ্চিত এই ডকুমেন্টটি ডাটাবেজ থেকে মুছে ফেলতে চান?")) return;

  try {
    const res = await fetch(`${API_BASE}/members/${currentUser.memberId}/document/${docId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("ডকুমেন্ট মুছে ফেলা হয়েছে!");
      initMyProfileHeader();
    } else {
      alert("ডকুমেন্ট মুছতে সমস্যা হয়েছে!");
    }
  } catch (err) {
    console.error("Delete doc error:", err);
    alert("সার্ভার এরর হয়েছে!");
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
