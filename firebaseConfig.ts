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
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // <-- GANTI INI
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",      // <-- GANTI INI
  projectId: "YOUR_PROJECT_ID",                       // <-- GANTI INI
  storageBucket: "YOUR_PROJECT_ID.appspot.com",       // <-- GANTI INI
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",      // <-- GANTI INI
  appId: "1:YOUR_APP_ID:web:XXXXXXXXXXXXXXXXXXXXXX"   // <-- GANTI INI
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
