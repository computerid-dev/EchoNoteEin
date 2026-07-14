/* ==========================================================
   offline.js — Sistem Video Offline (IndexedDB)

   Keputusan yang sudah disepakati:
   - Video offline disimpan kualitas 240p (hemat storage)
   - User bisa: hapus dari offline, ATAU simpan ke galeri
   - "Simpan ke galeri" dari video offline = tetap 240p
     (Opsi A yang disepakati - simpel & jujur ke user)
   - Tombol terpisah "Download" kualitas asli ada di post
     feed langsung, bukan di file ini
   ========================================================== */

const DB_NAME = "echonote_offline";
const DB_VERSION = 1;
const STORE_NAME = "videos";

let dbInstance = null;

function openDB(){

    return new Promise((resolve, reject) => {

        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {

            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {

                const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                store.createIndex("savedAt", "savedAt");

            }

        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };

    });

}

/* Simpan video ke offline storage. videoBlob HARUS sudah
   kualitas 240p (proses compress dilakukan sebelum manggil
   fungsi ini, saat user pencet "Simpan Offline" di post). */

async function saveVideoOffline({ id, title, thumbnailBlob, videoBlob, sourceUrl }){

    const db = await openDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        const record = {
            id,
            title: title || "Video tanpa judul",
            thumbnailBlob,
            videoBlob,
            sourceUrl: sourceUrl || null,
            quality: "240p",
            sizeBytes: videoBlob ? videoBlob.size : 0,
            savedAt: Date.now()
        };

        const req = store.put(record);

        req.onsuccess = () => resolve(record);
        req.onerror = () => reject(req.error);

    });

}

async function listOfflineVideos(){

    const db = await openDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {

            const results = req.result.sort((a, b) => b.savedAt - a.savedAt);
            resolve(results);

        };

        req.onerror = () => reject(req.error);

    });

}

async function deleteOfflineVideo(id){

    const db = await openDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);

    });

}

/* Simpan video (yang sudah ada di offline storage) ke
   galeri/Download perangkat. Web Share API sebagai utama,
   fallback ke <a download> kalau browser gak dukung. */

async function saveVideoToDevice(videoRecord){

    const file = new File(
        [videoRecord.videoBlob],
        `${sanitizeFilename(videoRecord.title)}.mp4`,
        { type: "video/mp4" }
    );

    const canShareFile =
        navigator.canShare && navigator.canShare({ files: [file] });

    if (navigator.share && canShareFile) {

        try {

            await navigator.share({
                files: [file],
                title: videoRecord.title
            });

            return { method: "share", success: true };

        } catch (err) {

            if (err.name === "AbortError") {
                return { method: "share", success: false, cancelled: true };
            }

        }

    }

    const url = URL.createObjectURL(videoRecord.videoBlob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${sanitizeFilename(videoRecord.title)}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 4000);

    return { method: "download", success: true };

}

function sanitizeFilename(name){

    return (name || "video")
        .replace(/[^a-z0-9_\- ]/gi, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 60);

}

async function getStorageEstimate(){

    if (!navigator.storage || !navigator.storage.estimate) {

        return { usage: 0, quota: 0, supported: false };

    }

    const { usage, quota } = await navigator.storage.estimate();

    return { usage, quota, supported: true };

}

async function requestPersistentStorage(){

    if (navigator.storage && navigator.storage.persist) {

        return await navigator.storage.persist();

    }

    return false;

}
