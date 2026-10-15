// js/expenses.js
// Expense Management with MongoDB

document
  .getElementById("expenseForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const memberId = document.getElementById("expenseMemberSelect").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const date = document.getElementById("expenseDate").value;
    const note = document.getElementById("expenseNote").value;

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
      renderExpenses();
      alert("বাজার খরচ সফলভাবে যোগ হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে!");
    }
  });

function renderExpenses() {
  const tbody = document.getElementById("expenseTableBody");
  tbody.innerHTML = "";
  expenses.forEach((ex) => {
    const member = members.find((m) => m.id === ex.memberId);
    tbody.innerHTML += `
            <tr class="border-b">
                <td class="p-3">${ex.date}</td>
                <td class="p-3">${member ? member.name : "Unknown"}</td>
                <td class="p-3">${ex.note || "বাজার"}</td>
                <td class="p-3 font-semibold text-indigo-600">৳ ${ex.amount}</td>
                <td class="p-3">
                    <button onclick="deleteExpense('${ex.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
  });
}

async function deleteExpense(id) {
  if (confirm("আপনি কি নিশ্চিত?")) {
    try {
      await fetch(`${API_BASE}/expenses/${id}`, { method: "DELETE" });
      expenses = expenses.filter((ex) => ex.id !== id);
      renderExpenses();
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে!");
    }
  }
}
