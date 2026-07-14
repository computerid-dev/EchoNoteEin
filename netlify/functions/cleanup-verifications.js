/* ==========================================================
   cleanup-verifications.js
   Netlify SCHEDULED FUNCTION - jalan otomatis tiap 15 menit
   (jadwalnya diatur di netlify.toml, bukan dipanggil manual)

   Tugas file ini, menghapus dokumen verifikasi yang:
   1. Sudah direview admin (readyToDelete = true), ATAU
   2. Sudah melewati batas waktu 48 jam sejak upload
      (expireAt <= sekarang) -- ini jaring pengaman kalau
      admin lupa/telat review

   Yang dihapus:
   - File asli di Firebase Storage (foto KTP/Kartu Pelajar/
     sertifikat izin)
   - Document metadata di Firestore

   Hasil akhir: TIDAK ADA jejak dokumen identitas yang
   tersimpan permanen di sistem manapun.
   ========================================================== */

const { schedule } = require("@netlify/functions");
const admin = require("firebase-admin");

if (!admin.apps.some(a => a && a.name === "admin-auth")) {

    admin.initializeApp({
        credential: admin.credential.cert(
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_AUTH)
        ),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET_AUTH
    }, "admin-auth");

}

const db = admin.app("admin-auth").firestore();
const bucket = admin.app("admin-auth").storage().bucket();

async function cleanupHandler() {

    const now = admin.firestore.Timestamp.now();

    let deletedCount = 0;

    /* ==========================
       1. Hapus yang sudah direview
          (readyToDelete = true)
    ========================== */

    const reviewedSnap = await db
        .collection("verifications")
        .where("readyToDelete", "==", true)
        .get();

    for (const doc of reviewedSnap.docs) {

        await deleteVerification(doc);
        deletedCount++;

    }

    /* ==========================
       2. Hapus yang sudah expire
          (belum direview tapi lewat 48 jam)
    ========================== */

    const expiredSnap = await db
        .collection("verifications")
        .where("status", "==", "pending")
        .where("expireAt", "<=", now)
        .get();

    for (const doc of expiredSnap.docs) {

        await deleteVerification(doc);
        deletedCount++;

    }

    console.log(`cleanup-verifications: ${deletedCount} dokumen dihapus.`);

    return {
        statusCode: 200,
        body: JSON.stringify({ deleted: deletedCount })
    };

}

async function deleteVerification(doc) {

    const data = doc.data();

    try {

        /* Hapus file di Storage.
           `{ ignoreNotFound: true }` supaya gak error kalau
           file udah kehapus duluan (misal proses ke-run 2x) */

        await bucket.file(data.storagePath).delete({ ignoreNotFound: true });

    } catch (err) {

        console.error(`Gagal hapus file storage untuk ${doc.id}:`, err.message);

    }

    /* Hapus document Firestore-nya juga, jangan cuma file-nya.
       Kita TIDAK menyimpan arsip/backup manual di sini -
       sesuai prinsip "data minimization" yang udah disepakati. */

    await doc.ref.delete();

}

/* Dibungkus `schedule()` supaya Netlify tahu ini scheduled
   function, jadwal cron-nya diambil dari netlify.toml */

exports.handler = schedule("*/15 * * * *", cleanupHandler);
