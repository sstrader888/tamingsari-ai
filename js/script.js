function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  if (username === 'user' && password === 'password') {
    window.location.href = 'dashboard.html';
  } else {
    alert('Username atau password salah.');
  }
}

function logout() {
  window.location.href = 'walletlogin.html';
}

function requestWithdrawal() {
  alert('Permintaan withdrawal telah dihantar ke admin.');
}

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('tradeHistory')) {
    generateTradeHistory();
  }
});

function generateTradeHistory() {
  const tradeBody = document.getElementById('tradeHistory').querySelector('tbody');
  const today = new Date();
  let totalProfit = 0;
  const targetProfit = 2000;
  for (let i = 0; i < 22; i++) {
    const day = new Date();
    day.setDate(today.getDate() - i);
    const dayOfWeek = day.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Saturday and Sunday

    const profit = Math.floor(Math.random() * (110 - 90 + 1)) + 90;
    totalProfit += profit;
    if (totalProfit > targetProfit) break;

    const row = document.createElement('tr');
    row.innerHTML = `<td>${day.toISOString().split('T')[0]}</td><td>XAU/USD</td><td>+RM${profit}</td>`;
    tradeBody.appendChild(row);
  }

  document.getElementById('withdrawalAvailable').innerText = `RM${totalProfit}`;
}
