// js/memberFiles.js
// Admin-Only Member Dossier & Document Archive

let activeDossierMemberId = null;

// Render all member profile dossier cards
async function renderMemberFilesList() {
  const container = document.getElementById("memberFilesGrid");
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-full py-12 text-center text-gray-400">
      <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
      <p>সদস্যদের ফাইল লোড হচ্ছে...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/members`);
    const fetchedMembers = await res.json();
    members = fetchedMembers.map((m) => ({ ...m, id: m._id }));

    if (members.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-white p-8 rounded-2xl text-center text-gray-500 shadow-sm">
          <i class="fas fa-users-slash text-4xl mb-3 text-gray-300"></i>
          <p class="text-lg">এখনো কোনো সদস্য যুক্ত করা হয়নি।</p>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    members.forEach((m) => {
      const avatarSrc = m.photo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(m.name) + "&background=6366f1&color=fff&size=128";
      const docCount = (m.documents ? m.documents.length : 0) + (m.nidPic ? 1 : 0);

      const card = document.createElement("div");
      card.className = "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col justify-between";
      card.id = `member-card-${m.id}`;

      card.innerHTML = `
        <div>
          <div class="flex items-start gap-4 mb-4">
            <img
              src="${avatarSrc}"
              alt="${m.name}"
              class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
              onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=6366f1&color=fff'"
            />
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-bold text-gray-900 truncate">${m.name}</h3>
              <p class="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                <i class="fas fa-phone-alt text-xs text-indigo-500"></i> ${m.phone}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">
                  রুম: ${m.room || "-"}
                </span>
                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <i class="fas fa-paperclip text-[10px]"></i> ${docCount} ফাইল
                </span>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 p-3 rounded-xl text-xs text-gray-600 space-y-1 mb-4">
            <div class="flex justify-between">
              <span class="text-gray-400">এনআইডি / আইডি:</span>
              <span class="font-medium text-gray-800">${m.nid || "দেওয়া হয়নি"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">জরুরি যোগাযোগ:</span>
              <span class="font-medium text-gray-800">${m.emergencyContact || "দেওয়া হয়নি"}</span>
            </div>
            <div class="flex justify-between truncate">
              <span class="text-gray-400">ঠিকানা:</span>
              <span class="font-medium text-gray-800 truncate ml-2">${m.address || "দেওয়া হয়নি"}</span>
            </div>
          </div>
        </div>

        <button
          onclick="openMemberDossier('${m.id}')"
          class="w-full bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
        >
          <i class="fas fa-folder-open"></i> পূর্ণাঙ্গ ফাইল ও ছবি দেখুন
        </button>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading member files:", err);
    container.innerHTML = `
      <div class="col-span-full bg-red-50 p-6 rounded-xl text-red-600 text-center">
        <i class="fas fa-exclamation-triangle text-2xl mb-1"></i>
        <p>সদস্যদের ফাইল লোড করতে সমস্যা হয়েছে!</p>
      </div>
    `;
  }
}

// Filter member cards based on search input
function filterMemberFiles() {
  const query = (document.getElementById("memberFileSearch").value || "").toLowerCase();
  members.forEach((m) => {
    const card = document.getElementById(`member-card-${m.id}`);
    if (!card) return;
    const match = m.name.toLowerCase().includes(query) || m.phone.toLowerCase().includes(query) || (m.room && m.room.toLowerCase().includes(query));
    card.style.display = match ? "flex" : "none";
  });
}

// Open Member File Modal
async function openMemberDossier(memberId) {
  activeDossierMemberId = memberId;
  const modal = document.getElementById("memberDossierModal");
  if (!modal) return;

  modal.classList.remove("hidden");

  try {
    const res = await fetch(`${API_BASE}/members/${memberId}`);
    const member = await res.json();

    // Populate profile inputs
    document.getElementById("dossierName").value = member.name || "";
    document.getElementById("dossierPhone").value = member.phone || "";
    document.getElementById("dossierRoom").value = member.room || "";
    document.getElementById("dossierPin").value = member.pin || "";
    document.getElementById("dossierNid").value = member.nid || "";
    document.getElementById("dossierEmergency").value = member.emergencyContact || "";
    document.getElementById("dossierAddress").value = member.address || "";

    // Header info
    document.getElementById("modalMemberTitle").innerText = `${member.name}-এর প্রোফাইল ও নথি`;
    const avatar = document.getElementById("dossierAvatarPreview");
    avatar.src = member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=128`;

    // Render NID preview
    const nidPreview = document.getElementById("dossierNidPreview");
    if (member.nidPic) {
      nidPreview.innerHTML = `
        <div class="relative group cursor-pointer" onclick="previewImageModal('${member.nidPic}', 'NID / স্টুডেন্ট আইডি ছবি')">
          <img src="${member.nidPic}" class="w-full h-36 object-cover rounded-xl border border-gray-200" />
          <div class="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
            <i class="fas fa-search-plus mr-1"></i> বড় করে দেখুন
          </div>
        </div>
      `;
    } else {
      nidPreview.innerHTML = `
        <div class="h-36 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 text-xs">
          <i class="fas fa-id-card text-2xl mb-1 text-gray-300"></i>
          <span>কোনো আইডি কার্ড ছবি আপলোড করা হয়নি</span>
        </div>
      `;
    }

    // Render additional documents gallery
    renderMemberDocsList(member.documents || []);

  } catch (err) {
    console.error("Error opening dossier:", err);
    alert("সদস্য তথ্য লোড করা যায়নি!");
  }
}

function closeMemberDossier() {
  const modal = document.getElementById("memberDossierModal");
  if (modal) modal.classList.add("hidden");
  activeDossierMemberId = null;
}

// Render uploaded extra documents gallery
function renderMemberDocsList(documents) {
  const container = document.getElementById("dossierExtraDocsList");
  if (!container) return;

  if (documents.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-8 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
        <i class="fas fa-folder-open text-2xl mb-1 text-gray-300"></i>
        <p>অতিরিক্ত কোনো ছবি বা ডকুমেন্ট সংরক্ষিত নেই</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  documents.forEach((doc) => {
    const isImage = doc.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const dateStr = new Date(doc.uploadedAt).toLocaleDateString("bn-BD");

    const item = document.createElement("div");
    item.className = "bg-gray-50 rounded-xl border border-gray-200 p-2.5 flex flex-col justify-between";

    item.innerHTML = `
      <div>
        <div class="relative group cursor-pointer overflow-hidden rounded-lg mb-2" onclick="${isImage ? `previewImageModal('${doc.fileUrl}', '${doc.title}')` : `window.open('${doc.fileUrl}', '_blank')`}">
          ${
            isImage
              ? `<img src="${doc.fileUrl}" class="w-full h-28 object-cover rounded-lg" />`
              : `<div class="w-full h-28 bg-indigo-50 flex items-center justify-center text-indigo-500 text-3xl"><i class="fas fa-file-alt"></i></div>`
          }
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
            <i class="fas fa-eye mr-1"></i> দেখুন
          </div>
        </div>
        <p class="font-bold text-gray-800 text-xs truncate" title="${doc.title}">${doc.title}</p>
        <p class="text-[10px] text-gray-400 mt-0.5">${dateStr}</p>
      </div>
      <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 text-xs">
        <a href="${doc.fileUrl}" download class="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] flex items-center gap-1">
          <i class="fas fa-download"></i> সেভ
        </a>
        <button onclick="deleteMemberDoc('${doc._id}')" class="text-red-500 hover:text-red-700 text-[11px] flex items-center gap-1">
          <i class="fas fa-trash"></i> ডিলিট
        </button>
      </div>
    `;

    container.appendChild(item);
  });
}

// Upload file handler
async function handleFileUpload(uploadType) {
  if (!activeDossierMemberId) return;

  let fileInput = null;
  let title = "";

  if (uploadType === "photo") {
    fileInput = document.getElementById("uploadPhotoInput");
  } else if (uploadType === "nidPic") {
    fileInput = document.getElementById("uploadNidInput");
  } else if (uploadType === "document") {
    fileInput = document.getElementById("uploadDocInput");
    title = document.getElementById("uploadDocTitle").value.trim() || "ডকুমেন্ট";
  }

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert("দয়া করে একটি ফাইল বা ছবি নির্বাচন করুন!");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploadType", uploadType);
  if (title) formData.append("title", title);

  const statusLabel = document.getElementById("uploadStatusBadge");
  if (statusLabel) {
    statusLabel.classList.remove("hidden");
    statusLabel.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> আপলোড হচ্ছে...`;
  }

  try {
    const res = await fetch(`${API_BASE}/members/${activeDossierMemberId}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert("ছবি/ডকুমেন্ট সফলভাবে আপলোড হয়েছে!");
      if (fileInput) fileInput.value = "";
      if (document.getElementById("uploadDocTitle")) {
        document.getElementById("uploadDocTitle").value = "";
      }
      // Refresh modal
      openMemberDossier(activeDossierMemberId);
      renderMemberFilesList();
    } else {
      alert(data.error || "আপলোড ব্যর্থ হয়েছে!");
    }
  } catch (err) {
    console.error("Upload error:", err);
    alert("সার্ভার এরর হয়েছে!");
  } finally {
    if (statusLabel) statusLabel.classList.add("hidden");
  }
}

// Save Profile text fields
async function saveMemberProfileDetails(e) {
  if (e) e.preventDefault();
  if (!activeDossierMemberId) return;

  const name = document.getElementById("dossierName").value.trim();
  const phone = document.getElementById("dossierPhone").value.trim();
  const room = document.getElementById("dossierRoom").value.trim();
  const pin = document.getElementById("dossierPin").value.trim();
  const nid = document.getElementById("dossierNid").value.trim();
  const emergencyContact = document.getElementById("dossierEmergency").value.trim();
  const address = document.getElementById("dossierAddress").value.trim();

  try {
    const res = await fetch(`${API_BASE}/members/${activeDossierMemberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, room, pin, nid, emergencyContact, address }),
    });

    if (res.ok) {
      alert("সদস্যের তথ্য সফলভাবে আপডেট হয়েছে!");
      renderMemberFilesList();
      renderMembers(); // Refresh admin member table
      updateDropdowns();
    } else {
      alert("আপডেট ব্যর্থ হয়েছে!");
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("সার্ভার এরর হয়েছে!");
  }
}

// Delete document
async function deleteMemberDoc(docId) {
  if (!activeDossierMemberId) return;
  if (!confirm("আপনি কি নিশ্চিত এই ডকুমেন্টটি ডিলিট করতে চান?")) return;

  try {
    const res = await fetch(`${API_BASE}/members/${activeDossierMemberId}/document/${docId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      openMemberDossier(activeDossierMemberId);
      renderMemberFilesList();
    } else {
      alert("ডিলিট করতে সমস্যা হয়েছে!");
    }
  } catch (err) {
    console.error(err);
    alert("সার্ভার এরর!");
  }
}

// Preview image lightbox
function previewImageModal(imgUrl, title) {
  const modal = document.getElementById("imageLightboxModal");
  const img = document.getElementById("lightboxImage");
  const lbl = document.getElementById("lightboxTitle");
  if (!modal || !img) return;

  img.src = imgUrl;
  lbl.innerText = title || "ছবি প্রিভিউ";
  modal.classList.remove("hidden");
}

function closeImageModal() {
  const modal = document.getElementById("imageLightboxModal");
  if (modal) modal.classList.add("hidden");
}
