// Impor fungsi yang Anda perlukan dari SDK yang Anda perlukan
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================================================================
// !!! PENTING !!!
// GANTI SEMUA NILAI DI BAWAH INI DENGAN KONFIGURASI PROYEK FIREBASE ANDA.
// Anda bisa mendapatkan ini dari Firebase Console -> Project Settings -> General -> Your apps.
// Jika nilai-nilai ini tidak diisi dengan benar, APLIKASI TIDAK AKAN BERFUNGSI.
// ==========================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyADosrww3hCyiFFnqqlxRLayliaSc0HWrg", // <-- GANTI INI
  authDomain: "sengkudapp-1c219.firebaseapp.com",      // <-- GANTI INI
  projectId: "sengkudapp-1c219",                       // <-- GANTI INI
  storageBucket: "sengkudapp-1c219.firebasestorage.app",       // <-- GANTI INI
  messagingSenderId: "531323092285",      // <-- GANTI INI
  appId: "1:531323092285:web:50cc6eec3f73187782d954"   // <-- GANTI INI
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
