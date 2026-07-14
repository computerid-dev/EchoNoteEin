/* ==========================================================
   submit-verification.js
   Endpoint: POST /.netlify/functions/submit-verification

   Tugas file ini:
   - Terima dokumen verifikasi (KTP / Kartu Pelajar / Sertifikat Izin)
     dari FORM DI APP (bukan chat manual)
   - Simpan file ke Firebase Storage
   - Buat record di Firestore dengan status "pending" dan
     "expireAt" sebagai jaring pengaman (failsafe)

   Kenapa perlu "expireAt" walau nanti dihapus manual saat
   admin approve/reject?
   -> Supaya kalau admin lupa / telat review, dokumen TETAP
      otomatis kehapus maksimal 48 jam sejak upload.
      Jangan sampai dokumen "nyangkut" tanpa batas waktu.
   ========================================================== */

const admin = require("firebase-admin");

/* Inisialisasi Firebase Admin sekali saja (reuse antar invocation) */

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

/* Dokumen "hidup" maksimal 48 jam sejak upload,
   walau belum sempat direview admin */
const MAX_LIFETIME_HOURS = 48;

/* Tipe dokumen yang valid sesuai aturan terbaru:
   - ktp            -> user 18-50 tahun
   - kartu_pelajar  -> user 13-17 tahun
   - sertifikat_izin -> verifikasi bisnis
   (TIDAK ADA lagi: kartu_keluarga, status_pernikahan) */

const VALID_DOC_TYPES = ["ktp", "kartu_pelajar", "sertifikat_izin"];

exports.handler = async (event) => {

    if (event.httpMethod !== "POST") {

        return { statusCode: 405, body: "Method Not Allowed" };

    }

    try {

        const body = JSON.parse(event.body);

        const { userId, docType, fileBase64, fileMimeType, birthDate } = body;

        /* Validasi dasar input */

        if (!userId || !docType || !fileBase64 || !fileMimeType) {

            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Data tidak lengkap." })
            };

        }

        if (!VALID_DOC_TYPES.includes(docType)) {

            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Tipe dokumen tidak valid." })
            };

        }

        /* Kartu Pelajar wajib disertai tanggal lahir manual
           (karena kartu pelajar sering tidak mencantumkan
           tanggal lahir secara baku) */

        if (docType === "kartu_pelajar" && !birthDate) {

            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Tanggal lahir wajib diisi untuk verifikasi Kartu Pelajar."
                })
            };

        }

        /* PENTING: jangan pernah console.log(fileBase64) atau
           payload lain yang mengandung isi dokumen.
           Logging Netlify Functions bisa tersimpan di luar
           kendali kita -> jangan pernah catat isi file di log. */

        const docId = db.collection("verifications").doc().id;

        const storagePath = `verifications/${userId}/${docId}`;

        const fileBuffer = Buffer.from(fileBase64, "base64");

        /* Batas ukuran file 8MB, cegah abuse/upload berlebihan */

        const MAX_FILE_SIZE = 8 * 1024 * 1024;

        if (fileBuffer.length > MAX_FILE_SIZE) {

            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Ukuran file maksimal 8MB." })
            };

        }

        await bucket.file(storagePath).save(fileBuffer, {
            metadata: { contentType: fileMimeType }
        });

        const now = admin.firestore.Timestamp.now();

        const expireAt = admin.firestore.Timestamp.fromMillis(
            now.toMillis() + MAX_LIFETIME_HOURS * 60 * 60 * 1000
        );

        /* Simpan METADATA saja di Firestore, bukan isi file.
           Isi file cuma ada di Storage (storagePath). */

        await db.collection("verifications").doc(docId).set({

            userId,
            docType,
            storagePath,
            birthDate: birthDate || null,
            status: "pending",          // pending | approved | rejected
            createdAt: now,
            expireAt,                    // failsafe auto-delete
            reviewedAt: null,
            reviewedBy: null

        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                verificationId: docId,
                message: "Dokumen berhasil dikirim, menunggu review admin."
            })
        };

    } catch (err) {

        /* Jangan log detail error yang mungkin memuat data sensitif */

        console.error("submit-verification failed:", err.message);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Gagal memproses dokumen." })
        };

    }

};
