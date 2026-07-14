/* ==========================================================
   anti-clone.js
   Helper (BUKAN endpoint sendiri) — cek header Origin/Referer
   supaya API cuma bisa dipanggil dari domain EchoNote resmi,
   bukan dari situs/app kloningan yang manggil endpoint kita
   langsung.

   Cara pakai (dari function lain):

     const { checkOrigin } = require("../../netlify/functions/anti-clone");
     const block = checkOrigin(event);
     if (block) return block;

   PENTING: ini bukan proteksi anti-clone yang sempurna —
   orang yang niat tetap bisa palsukan header ini kalau
   manggil API langsung (bukan lewat browser). Proteksi
   paling kuat tetap: autentikasi wajib (verifyIdToken) +
   Firestore Security Rules, bukan cuma cek header.
   ========================================================== */

const ALLOWED_ORIGINS = [

    "https://computerid-dev.github.io",
    "https://echonoteein.netlify.app",
    "http://localhost:8888" // buat testing lokal (netlify dev)

    /* Domain lama "echonote404wwwnotfound.netlify.app" SENGAJA
       gak dimasukin — itu percobaan deploy yang gagal/ditinggalin,
       udah gak dipakai. Kalau nanti mau pakai custom domain
       sendiri (bukan *.netlify.app), tambahin di sini. */

];

function checkOrigin(event){

    const origin = event.headers["origin"] || event.headers["referer"] || "";

    const isAllowed = ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));

    if (!isAllowed) {

        return {
            statusCode: 403,
            body: JSON.stringify({ error: "Origin tidak diizinkan." })
        };

    }

    return null;

}

module.exports = { checkOrigin };
