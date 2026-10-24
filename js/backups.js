// js/backups.js
// 12-Month Monthly Backup & Archive Management

async function renderBackups() {
  const container = document.getElementById("backupsContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-full py-8 text-center text-gray-500">
      <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
      <p>ব্যাকআপ ডাটা লোড হচ্ছে...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/backups`);
    const backups = await res.json();

    if (!backups || backups.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-white p-8 rounded-xl text-center text-gray-500 shadow-sm">
          <i class="fas fa-archive text-4xl mb-3 text-indigo-400"></i>
          <p class="text-lg">এখনো কোনো ব্যাকআপ ফাইল পাওয়া যায়নি।</p>
          <button onclick="triggerManualBackup()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            <i class="fas fa-sync-alt mr-1"></i> প্রথম ব্যাকআপ তৈরি করুন
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    
    // Sort and display last 12 months
    backups.forEach((b, idx) => {
      const isCurrentMonth = idx === 0;
      const summary = b.summary || {};
      const dateFormatted = new Date(b.lastModified).toLocaleString("bn-BD", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const card = document.createElement("div");
      card.className = `bg-white rounded-2xl shadow-sm border ${
        isCurrentMonth ? "border-indigo-500 ring-2 ring-indigo-100" : "border-gray-200"
      } p-6 flex flex-col justify-between hover:shadow-md transition`;

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">
                <i class="fas fa-calendar-alt"></i>
              </span>
              <div>
                <h3 class="text-xl font-bold text-gray-800">${b.month}</h3>
                <span class="text-xs ${
                  isCurrentMonth ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                } px-2 py-0.5 rounded-full font-medium">
                  ${isCurrentMonth ? "চলতি মাস (Current)" : "সংরক্ষিত মাস (Archived)"}
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-5 bg-gray-50 p-4 rounded-xl text-sm">
            <div>
              <p class="text-gray-500 text-xs">মোট জমা</p>
              <p class="font-bold text-indigo-900">৳ ${summary.totalDeposits ?? 0}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">মোট খরচ</p>
              <p class="font-bold text-red-600">৳ ${summary.totalExpenses ?? 0}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">মোট মিল</p>
              <p class="font-bold text-yellow-600">${summary.totalMeals ?? 0}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">মিল রেট</p>
              <p class="font-bold text-green-700">৳ ${summary.mealRate ?? 0}</p>
            </div>
          </div>

          <div class="text-xs text-gray-400 mb-4 flex items-center gap-1">
            <i class="far fa-clock"></i> ব্যাকআপ সময়: ${dateFormatted}
          </div>
        </div>

        <div class="pt-3 border-t border-gray-100">
          <a
            href="statement.html?month=${b.month}"
            target="_blank"
            class="w-full bg-red-600 hover:bg-red-700 text-white text-center py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <i class="fas fa-file-pdf text-base"></i> PDF স্টেটমেন্ট দেখুন / ডাউনলোড
          </a>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Error rendering backups:", err);
    container.innerHTML = `
      <div class="col-span-full bg-red-50 p-6 rounded-xl text-red-700 text-center">
        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
        <p>ব্যাকআপ ডাটা লোড করতে সমস্যা হয়েছে!</p>
      </div>
    `;
  }
}

async function triggerManualBackup() {
  const btn = document.getElementById("backupNowBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> ব্যাকআপ হচ্ছে...`;
  }

  try {
    const res = await fetch(`${API_BASE}/backups/create`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.success) {
      alert(`বিগত ১২ মাসের ব্যাকআপ সফলভাবে সম্পন্ন হয়েছে!\nমাসের তালিকা: ${data.backedUpMonths.join(", ")}`);
      renderBackups();
    } else {
      alert("ব্যাকআপ তৈরি করতে সমস্যা হয়েছে!");
    }
  } catch (err) {
    console.error(err);
    alert("সার্ভার এরর হয়েছে!");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-sync-alt mr-1"></i> এখনই নতুন ব্যাকআপ নিন`;
    }
  }
}
