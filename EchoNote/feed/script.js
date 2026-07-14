/* ==========================================================
   feed/script.js
   Dipakai di semua halaman dalam /EchoNote/feed/*
   (Home, Chat, Profile, dst) — logic yang sama di semua
   halaman: guard login, tandai "sudah sampai home", cek
   koneksi.
   ========================================================== */

(function(){

    /* Guard: kalau belum login, tendang balik ke halaman login.
       NOTE: ini guard di sisi client (UX saja). Data
       sebenarnya tetap harus dilindungi Firestore Security
       Rules di server, guard ini BUKAN pengaman keamanan. */

    if (!EchoSession.isLoggedIn()) {

        window.location.replace("/login/index.html");

    }

})();

function EchoFeed_markHomeReached(){

    /* Dipanggil dari home.html setelah halaman pertama kali
       kebuka. Ini yang jadi syarat install banner boleh
       muncul (sesuai keputusan: banner muncul setelah user
       "unlock" /feed/home). */

    EchoSession.markReachedHome();

    /* Coba tampilkan banner sekarang juga kalau kondisi
       lain (event beforeinstallprompt) sudah terpenuhi
       duluan sebelum halaman ini kebuka. */

    if (EchoInstall.deferredPrompt) {

        EchoInstall._maybeShowBanner();

    }

}

/* ==========================
   Deteksi Offline -> khusus dipakai di home.html
   (loading terus sampai online, TANPA nyangkut walau
   internet sebenarnya sudah nyala lagi)
========================== */

function EchoFeed_watchOffline(onOnline, onOffline){

    EchoNetwork.onChange((isOnline) => {

        if (isOnline) {
            onOnline();
        } else {
            onOffline();
        }

    });

    /* Jalankan sekali di awal sesuai status terkini */

    if (navigator.onLine) {
        onOnline();
    } else {
        onOffline();
    }

}
