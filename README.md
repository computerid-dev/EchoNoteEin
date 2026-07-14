# EchoNote

Progressive Web App sosial media dengan dukungan offline
(termasuk video offline) dan verifikasi akun berlapis.

## Arsitektur (v1 — disederhanakan)

Cuma pakai **1 project Firebase** (`echonoteauth`) untuk
semuanya: auth, profil, feed, chat, storage. Client (browser)
akses Firestore/Storage langsung, dilindungi Security Rules —
bukan lewat server, biar simpel dan gampang dikembangkan.

Server (Netlify Functions) HANYA dipakai untuk 1 hal yang
emang butuh diproses aman di server: **verifikasi dokumen
identitas** (KTP/Kartu Pelajar/Sertifikat Izin) — karena ini
menyangkut data sensitif yang perlu auto-delete terjadwal dan
gak boleh bisa diakses/dimanipulasi langsung dari client.

## Struktur
- `/assets` — file bersama (tema, core.js, config Firebase)
- `/login`, `/sign-in`, `/Create-Account` — alur autentikasi
- `/EchoNote/feed` — aplikasi utama setelah login
- `/netlify/functions` — backend verifikasi identitas +
  helper anti-scrape/anti-clone

## Setup sebelum deploy

1. `assets/firebase-config.js` sudah terisi (project `echonoteauth`)
2. Set Environment Variables di Netlify:
   - `FIREBASE_SERVICE_ACCOUNT_AUTH` (JSON service account project echonoteauth)
   - `FIREBASE_STORAGE_BUCKET_AUTH` = `echonoteauth.firebasestorage.app`
3. Pasang Firestore Security Rules — lihat
   `netlify/functions/FIRESTORE_RULES_SETUP.md`
4. Setup Storage Lifecycle Rule (failsafe auto-delete dokumen
   verifikasi) — lihat `netlify/functions/STORAGE_FAILSAFE_SETUP.md`

## Project Firebase yang gak dipakai lagi

`echonotefeed` dan `echonotechat` sempat dibuat di percobaan
arsitektur sebelumnya (3-project), sekarang gak direferensikan
di kode manapun. Boleh dibiarkan nganggur atau dihapus dari
Firebase Console kalau mau beres-beres.
