// js/expenses.js
// Market & Expense Management with Month-by-Month Filter & PDF Statement

let selectedExpenseMonth = new Date().toISOString().slice(0, 7);
let isExpenseAllMonths = false;

function initExpenseMonth() {
  const picker = document.getElementById("expenseMonthSelect");
  if (picker && !picker.value) {
    picker.value = selectedExpenseMonth;
  }
}

function onExpenseMonthChange() {
  const picker = document.getElementById("expenseMonthSelect");
  if (picker && picker.value) {
    selectedExpenseMonth = picker.value;
    isExpenseAllMonths = false;
    updateExpenseAllMonthsButtonUI();
  }
  renderExpenses();
}

function toggleExpenseAllMonths() {
  isExpenseAllMonths = !isExpenseAllMonths;
  updateExpenseAllMonthsButtonUI();
  renderExpenses();
}

function updateExpenseAllMonthsButtonUI() {
  const btn = document.getElementById("btnExpenseAllMonths");
  if (!btn) return;
  if (isExpenseAllMonths) {
    btn.className = "text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 text-white shadow-xs transition";
    btn.innerText = "চলতি মাস দেখুন";
  } else {
    btn.className = "text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition";
    btn.innerText = "সকল মাস";
  }
}

// 1. Submit New Expense
document
  .getElementById("expenseForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const memberId = document.getElementById("expenseMemberSelect").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const date = document.getElementById("expenseDate").value;
    const note = document.getElementById("expenseNote").value.trim();

    if (!memberId) {
      alert("দয়া করে একজন বাজারকারী সদস্য নির্বাচন করুন!");
      return;
    }
    if (!amount || amount <= 0) {
      alert("সঠিক খরচের পরিমাণ দিন!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, amount, date, note }),
      });
      const newExpense = await res.json();
      expenses.push({ ...newExpense, id: newExpense._id });

      this.reset();
      document.getElementById("expenseDate").valueAsDate = new Date();

      // If added in another month, auto-switch to that month
      const expMonth = date ? date.slice(0, 7) : "";
      if (expMonth && expMonth !== selectedExpenseMonth && !isExpenseAllMonths) {
        selectedExpenseMonth = expMonth;
        const picker = document.getElementById("expenseMonthSelect");
        if (picker) picker.value = selectedExpenseMonth;
      }

      renderExpenses();
      if (typeof updateDashboard === "function") updateDashboard();
      alert("বাজার খরচ সফলভাবে যোগ হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে: খরচ যোগ করা সম্ভব হয়নি!");
    }
  });

// 2. Render Expenses Table (Filtered by Selected Month)
function renderExpenses() {
  initExpenseMonth();
  const tbody = document.getElementById("expenseTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  let filtered = [...expenses];
  if (!isExpenseAllMonths && selectedExpenseMonth) {
    filtered = filtered.filter((ex) => ex.date && ex.date.startsWith(selectedExpenseMonth));
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalCost = filtered.reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
  const totalCount = filtered.length;
  const uniqueShoppers = new Set(filtered.map((ex) => ex.memberId)).size;

  // Update Summary Stats
  const totalEl = document.getElementById("expenseStatTotal");
  const countEl = document.getElementById("expenseStatCount");
  const shoppersEl = document.getElementById("expenseStatShoppers");
  const labelEl = document.getElementById("expenseHistoryMonthLabel");

  if (totalEl) totalEl.innerText = `৳ ${totalCost.toLocaleString("en-IN")}`;
  if (countEl) countEl.innerText = `${totalCount} টি`;
  if (shoppersEl) shoppersEl.innerText = `${uniqueShoppers} জন`;
  if (labelEl) {
    labelEl.innerText = isExpenseAllMonths
      ? "সকল মাস"
      : typeof formatYearMonth === "function"
      ? formatYearMonth(selectedExpenseMonth)
      : selectedExpenseMonth;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-8 text-center text-gray-400">
          <div class="space-y-1">
            <i class="fas fa-shopping-basket text-2xl text-gray-300 mb-1"></i>
            <p class="font-bold text-gray-600">কোনো বাজার খরচের রেকর্ড পাওয়া যায়নি</p>
            <p class="text-xs text-gray-400">${
              isExpenseAllMonths
                ? "এখনো কোনো বাজার খরচ এন্ট্রি করা হয়নি"
                : `মাস ${selectedExpenseMonth}-এ এখনো কোনো বাজার খরচ যোগ করা হয়নি`
            }</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach((ex) => {
    const member = members.find((m) => m.id === ex.memberId);
    const memberName = member ? member.name : "অজানা সদস্য";
    const memberPhoto = member && member.photo ? member.photo : "";

    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50/80 transition">
        <td class="p-3 text-gray-600 font-medium text-xs whitespace-nowrap">
          <i class="far fa-calendar-alt text-indigo-500 mr-1.5"></i>${ex.date}
        </td>
        <td class="p-3">
          <div class="flex items-center gap-2">
            ${
              memberPhoto
                ? `<img src="${memberPhoto}" class="w-6 h-6 rounded-full object-cover border" />`
                : `<div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">${memberName.charAt(0)}</div>`
            }
            <span class="font-bold text-gray-900">${memberName}</span>
          </div>
        </td>
        <td class="p-3 text-gray-700">${ex.note || "বাজার সামগ্রী"}</td>
        <td class="p-3 font-mono font-bold text-red-600 text-sm">৳ ${Number(ex.amount).toLocaleString("en-IN")}</td>
        <td class="p-3 text-center">
          <button onclick="deleteExpense('${ex.id}')" class="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition" title="মুছে ফেলুন">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

// 3. Delete Expense
async function deleteExpense(id) {
  if (confirm("আপনি কি নিশ্চিত এই বাজার খরচের রেকর্ডটি মুছে ফেলতে চান?")) {
    try {
      await fetch(`${API_BASE}/expenses/${id}`, { method: "DELETE" });
      expenses = expenses.filter((ex) => ex.id !== id);
      renderExpenses();
      if (typeof updateDashboard === "function") updateDashboard();
      alert("বাজার খরচের রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে: রেকর্ড মুছতে সমস্যা হয়েছে!");
    }
  }
}

// =========================================================================
// 4. Monthly Market & Expense PDF Generation & Printing
// =========================================================================

function formatMonthYearEn(monthStr) {
  if (!monthStr) return "";
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${monthNames[monthNum - 1]} ${year}`;
    }
  }
  return monthStr;
}

function prepareExpensePdfData() {
  const targetMonth = selectedExpenseMonth || new Date().toISOString().slice(0, 7);
  let filtered = expenses.filter((ex) => ex.date && ex.date.startsWith(targetMonth));
  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalCost = filtered.reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
  const totalCount = filtered.length;
  const uniqueShoppers = new Set(filtered.map((ex) => ex.memberId)).size;

  const monthEn = formatMonthYearEn(targetMonth);
  
  const lblEl = document.getElementById("pdfExpenseMonthLabel");
  if (lblEl) lblEl.innerText = monthEn;

  const totalEl = document.getElementById("pdfExpenseTotalAmount");
  if (totalEl) totalEl.innerText = totalCost.toLocaleString("en-US");

  const countEl = document.getElementById("pdfExpenseTotalCount");
  if (countEl) countEl.innerText = totalCount;

  const shoppersEl = document.getElementById("pdfExpenseTotalShoppers");
  if (shoppersEl) shoppersEl.innerText = uniqueShoppers;

  const footTotalEl = document.getElementById("pdfExpenseFootTotal");
  if (footTotalEl) footTotalEl.innerText = `${totalCost.toLocaleString("en-US")} ৳`;

  const now = new Date();
  const printDateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) + " " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const genDateEl = document.getElementById("pdfExpenseGeneratedDate");
  if (genDateEl) genDateEl.innerText = printDateStr;

  const tbody = document.getElementById("pdfExpenseTableRows");
  if (!tbody) return { targetMonth, totalCost, count: totalCount, monthEn };
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="border: 1.5px solid #1f2937; padding: 12px; text-align: center; color: #6b7280; font-weight: bold;">No market expense records found for ${monthEn}</td></tr>`;
  } else {
    filtered.forEach((ex, idx) => {
      const member = members.find((m) => m.id === ex.memberId);
      const shopperName = member ? member.name : "Unknown";
      tbody.innerHTML += `
        <tr style="border-bottom: 1.5px solid #1f2937;">
          <td style="border: 1.5px solid #1f2937; padding: 5px 8px; text-align: center; font-weight: 700;">${idx + 1}</td>
          <td style="border: 1.5px solid #1f2937; padding: 5px 8px; font-family: monospace; font-size: 11px;">${ex.date}</td>
          <td style="border: 1.5px solid #1f2937; padding: 5px 8px; font-weight: 800; color: #111827;">${shopperName}</td>
          <td style="border: 1.5px solid #1f2937; padding: 5px 8px; color: #374151;">${ex.note || "Bazar Items"}</td>
          <td style="border: 1.5px solid #1f2937; padding: 5px 8px; text-align: right; font-weight: 900; color: #111827; font-family: monospace;">${Number(ex.amount).toLocaleString("en-US")} ৳</td>
        </tr>
      `;
    });
  }

  return { targetMonth, totalCost, count: totalCount, monthEn };
}

async function downloadExpenseStatementPDF() {
  if (!currentUser || currentUser.role !== "admin") {
    alert("শুধুমাত্র অ্যাডমিন মাসিক বাজার খরচের PDF ডাউনলোড করতে পারবেন!");
    return;
  }

  const btn = document.getElementById("btnDownloadExpensePdf");
  const originalHtml = btn ? btn.innerHTML : "";

  try {
    const data = prepareExpensePdfData();
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> PDF হচ্ছে...`;
    }

    const container = document.getElementById("monthlyExpensePdfContainer");
    const sheet = document.getElementById("monthlyExpensePdfSheet");
    if (!container || !sheet) throw new Error("PDF টেমপ্লেট পাওয়া যায়নি!");

    container.classList.remove("hidden");
    if (document.fonts) await document.fonts.ready;

    const opt = {
      margin: [6, 6, 6, 6],
      filename: `market-statement-${data.targetMonth}.pdf`,
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: { scale: 2.5, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    await html2pdf().set(opt).from(sheet).save();
  } catch (err) {
    console.error("PDF generation error:", err);
    alert("PDF তৈরিতে সমস্যা হয়েছে! প্রিন্ট অপশন ব্যবহার করে দেখতে পারেন।");
  } finally {
    const container = document.getElementById("monthlyExpensePdfContainer");
    if (container) container.classList.add("hidden");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

function printExpenseStatement() {
  if (!currentUser || currentUser.role !== "admin") {
    alert("শুধুমাত্র অ্যাডমিন প্রিন্ট করতে পারবেন!");
    return;
  }

  const data = prepareExpensePdfData();
  const sheet = document.getElementById("monthlyExpensePdfSheet");
  if (!sheet) return;

  const targetMonth = selectedExpenseMonth || new Date().toISOString().slice(0, 7);
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>MONTHLY FINANCIAL STATEMENT - ${data.monthEn || targetMonth}</title>
        <base href="${window.location.origin}/" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;800&family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <style>
          body { font-family: 'Poppins', 'Noto Sans Bengali', Arial, sans-serif; margin: 0; padding: 15px; color: #111827; }
          @page { size: A4 portrait; margin: 8mm; }
        </style>
      </head>
      <body>
        ${sheet.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
