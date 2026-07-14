/* ==========================================================
   app.js — Entry point root ("/")
   Tugas: cek status login, redirect ke tempat yang sesuai.
   ========================================================== */

(function(){

    /* NOTE: EchoSession.isLoggedIn() cuma flag UI ringan.
       Begitu firebase-config.js diisi, ganti pengecekan ini
       pakai firebase.auth().onAuthStateChanged() supaya
       statusnya beneran valid, bukan cuma sessionStorage. */

    function redirect(){

        if (EchoSession.isLoggedIn()) {

            window.location.replace("/EchoNote/feed/Home/home.html");

        } else {

            window.location.replace("/login/index.html");

        }

    }

    /* Kasih jeda dikit biar splash kelihatan, bukan flash
       langsung pindah (UX lebih halus). */

    setTimeout(redirect, 400);

})();
