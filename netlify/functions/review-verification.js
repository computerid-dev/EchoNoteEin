/* ==========================================================
   review-verification.js
   Endpoint: POST /.netlify/functions/review-verification

   Tugas file ini:
   - Dipanggil dari PANEL ADMIN (bukan dari app user biasa)
   - Admin approve/reject dokumen verifikasi
   - Begitu diputuskan, dokumen langsung ditandai untuk
     dihapus SEGERA (readyToDelete = true), tidak perlu
     nunggu batas 48 jam dari submit-verification.js

   Keamanan: endpoint ini WAJIB dicek token admin, supaya
   gak sembarang orang bisa panggil endpoint ini.
   ========================================================== */

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

exports.handler = async (event) => {

    if (event.httpMethod !== "POST") {

        return { statusCode: 405, body: "Method Not Allowed" };

    }

    try {

        /* ==========================
           Cek Token Admin
           (contoh sederhana, sesuaikan
           dengan sistem auth admin lo)
        ========================== */

        const authHeader = event.headers.authorization || "";
        const idToken = authHeader.replace("Bearer ", "");

        if (!idToken) {

            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Tidak ada token." })
            };

        }

        const decoded = await admin.app("admin-auth").auth().verifyIdToken(idToken);

        const adminDoc = await db.collection("admins").doc(decoded.uid).get();

        if (!adminDoc.exists) {

            return {
                statusCode: 403,
                body: JSON.stringify({ error: "Bukan akun admin." })
            };

        }

        /* ==========================
           Proses Review
        ========================== */

        const body = JSON.parse(event.body);

        const { verificationId, decision } = body;
        // decision: "approved" atau "rejected"

        if (!verificationId || !["approved", "rejected"].includes(decision)) {

            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Input tidak valid." })
            };

        }

        const verifRef = db.collection("verifications").doc(verificationId);

        const verifSnap = await verifRef.get();

        if (!verifSnap.exists) {

            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Data tidak ditemukan." })
            };

        }

        await verifRef.update({

            status: decision,
            reviewedAt: admin.firestore.Timestamp.now(),
            reviewedBy: decoded.uid,

            /* Tandai buat dihapus SEGERA oleh cleanup-verifications.js
               (dijalankan otomatis tiap 15 menit) */
            readyToDelete: true

        });

        /* Kalau approved, di sinilah tempat yang pas buat
           update status akun user (misal: centang biru aktif),
           TAPI TANPA menyalin data dokumen ke tempat lain.
           Yang disimpan cukup: "userId sudah terverifikasi",
           bukan salinan foto dokumennya. */

        if (decision === "approved") {

            await db.collection("users").doc(verifSnap.data().userId).update({
                verified: true,
                verifiedAt: admin.firestore.Timestamp.now()
            });

        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Verifikasi ditandai sebagai ${decision}.`
            })
        };

    } catch (err) {

        console.error("review-verification failed:", err.message);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Gagal memproses review." })
        };

    }

};
