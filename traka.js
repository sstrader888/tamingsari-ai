// traka.js

// 1. Semak status login pengguna
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html"; // Tukar ke halaman login jika belum login
  } else {
    loadTrades(user);
  }
});

// 2. Fungsi tarik & paparkan data trade dari Firestore
function loadTrades(user) {
  const tradeTable = document.querySelector("#tradeTable tbody");
  tradeTable.innerHTML = "";

  db.collection("users")
    .doc(user.uid)
    .collection("trades")
    .orderBy("date", "desc")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const d = doc.data();
        const row = `<tr class="border-t">
          <td class="px-4 py-2">${d.date}</td>
          <td class="px-4 py-2">${d.pair}</td>
          <td class="px-4 py-2">${d.setup}</td>
          <td class="px-4 py-2 ${d.profit >= 0 ? 'text-green-600' : 'text-red-600'} font-semibold">${d.profit >= 0 ? '+' : ''}RM${d.profit}</td>
          <td class="px-4 py-2">${d.emotion}</td>
          <td class="px-4 py-2">${d.note || ''}</td>
        </tr>`;
        tradeTable.insertAdjacentHTML("beforeend", row);
      });
    });
}

// 3. Simpan trade baru ke Firestore
document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const form = e.target;
  const trade = {
    date: form[0].value,
    pair: form[1].value,
    setup: form[2].value,
    profit: parseFloat(form[3].value),
    emotion: form[4].value,
    note: form[5].value
  };

  db.collection("users")
    .doc(user.uid)
    .collection("trades")
    .add(trade)
    .then(() => {
      alert("Trade berjaya disimpan!");
      location.reload();
    })
    .catch((err) => {
      console.error("Ralat simpan:", err);
      alert("Ralat semasa menyimpan trade.");
    });
});
