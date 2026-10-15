// js/deposits.js
// Deposit Management with MongoDB

document
  .getElementById("depositForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const memberId = document.getElementById("depositMemberSelect").value;
    const amount = parseFloat(document.getElementById("depositAmount").value);
    const date = document.getElementById("depositDate").value;

    try {
      const res = await fetch(`${API_BASE}/deposits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, amount, date }),
      });
      const newDeposit = await res.json();
      deposits.push({ ...newDeposit, id: newDeposit._id });

      this.reset();
      document.getElementById("depositDate").valueAsDate = new Date();
      renderDeposits();
      alert("টাকা জমা সফল হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে!");
    }
  });

function renderDeposits() {
  const tbody = document.getElementById("depositTableBody");
  tbody.innerHTML = "";
  deposits.forEach((d) => {
    const member = members.find((m) => m.id === d.memberId);
    tbody.innerHTML += `
            <tr class="border-b">
                <td class="p-3">${d.date}</td>
                <td class="p-3">${member ? member.name : "Unknown"}</td>
                <td class="p-3 font-semibold text-green-600">৳ ${d.amount}</td>
                <td class="p-3">
                    <button onclick="deleteDeposit('${d.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
  });
}

async function deleteDeposit(id) {
  if (confirm("আপনি কি নিশ্চিত?")) {
    try {
      await fetch(`${API_BASE}/deposits/${id}`, { method: "DELETE" });
      deposits = deposits.filter((d) => d.id !== id);
      renderDeposits();
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে!");
    }
  }
}
