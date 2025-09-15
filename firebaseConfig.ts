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
  apiKey: "AIzahCyic0HWrg", // <-- GANTI INI
  authDomain: "sengkud.com",      // <-- GANTI INI
  projectId: "sengk219",                       // <-- GANTI INI
  storageBucket: "storage.app",       // <-- GANTI INI
  messagingSenderId: "5392285",      // <-- GANTI INI
  appId: "1:587782d954"   // <-- GANTI INI
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
