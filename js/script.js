import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Register user
const registerBtn = document.getElementById('registerBtn');
if (registerBtn) {
  registerBtn.onclick = async () => {
    const nama = document.getElementById('nama').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const pakej = document.getElementById('pakej').value;

    if (!nama || !email || !password || !pakej) {
      alert('Sila isi semua maklumat.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      await setDoc(doc(db, "wallet_users", uid), {
        nama: nama,
        email: email,
        pakej: pakej,
        modal: pakej === 'Pakej A' ? 5000 : pakej === 'Pakej B' ? 15000 : 25000,
        date_registered: new Date()
      });
      alert('Pendaftaran Berjaya! Sila login.');
      window.location.href = 'walletlogin.html';
    } catch (error) {
      alert(error.message);
    }
  }
}

// Login user
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
  loginBtn.onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = 'dashboard.html';
    } catch (error) {
      alert(error.message);
    }
  }
}

// Google login
const googleLoginBtn = document.getElementById('googleLoginBtn');
if (googleLoginBtn) {
  googleLoginBtn.onclick = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      window.location.href = 'dashboard.html';
    } catch (error) {
      alert(error.message);
    }
  }
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await signOut(auth);
    window.location.href = 'walletlogin.html';
  }
}

// Load dashboard
const modalAmount = document.getElementById('modalAmount');
if (modalAmount) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "wallet_users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        modalAmount.innerText = `RM${data.modal}`;
        document.getElementById('pakejType').innerText = data.pakej;
        generateTradeHistory();
      } else {
        alert('Data pengguna tidak ditemui.');
        signOut(auth);
      }
    } else {
      window.location.href = 'walletlogin.html';
    }
  });
}

function requestWithdrawal() {
  alert('Request withdrawal telah dihantar.');
}

function generateTradeHistory() {
  const tradeBody = document.getElementById('tradeHistory').querySelector('tbody');
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const day = new Date();
    day.setDate(today.getDate() - i);
    if (day.getDay() === 0 || day.getDay() === 6) continue; // Skip weekend

    const profit = Math.floor(Math.random() * (110 - 90 + 1)) + 90;
    const row = document.createElement('tr');
    row.innerHTML = `<td>${day.toISOString().split('T')[0]}</td><td>XAU/USD</td><td>+RM${profit}</td>`;
    tradeBody.appendChild(row);
  }
}
