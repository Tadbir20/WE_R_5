// js/members.js
// Member Management with MongoDB

document
  .getElementById("memberForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("memberName").value;
    const phone = document.getElementById("memberPhone").value;
    const room = document.getElementById("memberRoom").value;
    const pin = document.getElementById("memberPin").value;

    try {
      const res = await fetch(`${API_BASE}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, room, pin }),
      });
      const newMember = await res.json();
      members.push({ ...newMember, id: newMember._id });

      this.reset();
      renderMembers();
      updateDropdowns();
      alert("সদস্য সফলভাবে যোগ করা হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে!");
    }
  });

function renderMembers() {
  const tbody = document.getElementById("memberTableBody");
  tbody.innerHTML = "";
  members.forEach((m) => {
    tbody.innerHTML += `
            <tr class="border-b">
                <td class="p-3 font-medium">${m.name}</td>
                <td class="p-3">${m.phone}</td>
                <td class="p-3">${m.room}</td>
                <td class="p-3">
                    <button onclick="deleteMember('${m.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
  });
}

async function deleteMember(id) {
  if (confirm("আপনি কি নিশ্চিত?")) {
    try {
      await fetch(`${API_BASE}/members/${id}`, { method: "DELETE" });
      members = members.filter((m) => m.id !== id);
      renderMembers();
      updateDropdowns();
    } catch (err) {
      console.error(err);
      alert("এরর হয়েছে!");
    }
  }
}
