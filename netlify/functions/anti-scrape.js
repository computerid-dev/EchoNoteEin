/* ==========================================================
   anti-scrape.js
   Helper (BUKAN endpoint sendiri) — dipakai dengan cara
   di-require dari function lain, contoh:

     const { checkRequest } = require("../../netlify/functions/anti-scrape");
     const block = checkRequest(event);
     if (block) return block;

   Status: proteksi DASAR saja (User-Agent bot umum).
   Ini BUKAN pengganti rate limiting beneran — untuk itu
   pertimbangkan pakai Netlify Rate Limiting (fitur bawaan,
   diatur di netlify.toml) atau layanan seperti Upstash
   Redis untuk hitung request per-IP secara akurat, karena
   Netlify Functions itu stateless (gak bisa nyimpen
   counter antar-request di memori dengan reliable).
   ========================================================== */

const BLOCKED_UA_PATTERNS = [

    /curl/i,
    /wget/i,
    /python-requests/i,
    /scrapy/i,
    /HeadlessChrome/i,
    /PhantomJS/i,
    /^$/ // User-Agent kosong

];

function checkRequest(event){

    const ua = (event.headers["user-agent"] || "");

    const isBlocked = BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(ua));

    if (isBlocked) {

        return {
            statusCode: 403,
            body: JSON.stringify({ error: "Akses ditolak." })
        };

    }

    return null; // null = lolos, lanjut proses normal

}

module.exports = { checkRequest };
