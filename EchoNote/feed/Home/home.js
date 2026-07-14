/* ==========================================================
   home.js — logic khusus halaman Home
   ========================================================== */

const offlineState = document.getElementById("offlineState");
const feedList = document.getElementById("feedList");

EchoFeed_watchOffline(

    /* onOnline */
    () => {

        offlineState.classList.add("hidden");
        feedList.classList.remove("hidden");

        /* TODO: panggil fungsi fetch feed sebenarnya di sini,
           misal loadFeedFromServer(). Untuk sekarang feed
           statis di HTML sudah cukup buat MVP. */

    },

    /* onOffline */
    () => {

        feedList.classList.add("hidden");
        offlineState.classList.remove("hidden");

    }

);

/* Tandai user sudah sampai Home -> syarat install banner */

EchoFeed_markHomeReached();

/* Tombol pasang di banner */

document.getElementById("installBtn").addEventListener("click", () => {

    EchoInstall.promptInstall();

});
