/* ==========================================================
   firebase-config.js
   Inisialisasi Firebase — CUMA 1 PROJECT (echonoteauth)
   dipakai untuk semuanya: auth, feed, chat, storage.

   Kenapa disederhanain dari 3 project jadi 1? Karena 3
   project terpisah butuh server buat nyambungin login
   antar-project (custom token exchange), yang bikin app
   ini jauh lebih ribet dari yang dibutuhin untuk v1.
   Cukup 1 project + Firestore Security Rules, persis kayak
   pola paling umum dipakai buat app chat/sosmed sederhana.

   Project echonotefeed & echonotechat sengaja gak dipakai
   lagi di kode (boleh dibiarin nganggur atau dihapus nanti).
   ========================================================== */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDxmlI6j3rqGEIa1bcKY5E8PS3lMV4Z-18",
    authDomain: "echonoteauth.firebaseapp.com",
    projectId: "echonoteauth",
    storageBucket: "echonoteauth.firebasestorage.app",
    messagingSenderId: "923753058822",
    appId: "1:923753058822:web:b772b81aa7fbd84c522987",
    measurementId: "G-FGD9302377"
};

if (typeof firebase !== "undefined" && !firebase.apps.length) {

    firebase.initializeApp(FIREBASE_CONFIG);

}
