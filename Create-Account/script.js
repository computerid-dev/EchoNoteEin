/* ==========================================================
   Create-Account/script.js
   Sesuai spesifikasi:
   - banner 16:9
   - avatar (default en.png atau upload)
   - username: semua font boleh, opsional -> default
     "user" + 9 digit acak kalau dikosongkan
   - tagname @: huruf kecil saja, tanpa spasi/karakter
     khusus/font luar, "_" dan "-" pengganti spasi
   - bio: default "hai saya menggunakan EchoNote"
   - link: opsional
   ========================================================== */

let bannerFile = null;
let avatarFile = null;

document.getElementById("bannerPreview").addEventListener("click", () => {
    document.getElementById("bannerInput").click();
});

document.getElementById("bannerInput").addEventListener("change", (e) => {

    const file = e.target.files[0];
    if (!file) return;

    bannerFile = file;

    const url = URL.createObjectURL(file);
    const preview = document.getElementById("bannerPreview");
    preview.style.backgroundImage = `url(${url})`;
    preview.querySelector("span").style.display = "none";

});

document.getElementById("avatarBtn").addEventListener("click", () => {
    document.getElementById("avatarInput").click();
});

document.getElementById("avatarInput").addEventListener("change", (e) => {

    const file = e.target.files[0];
    if (!file) return;

    avatarFile = file;
    document.getElementById("avatarPreview").src = URL.createObjectURL(file);

});

/* Tagname: hanya huruf kecil a-z, angka, underscore, strip.
   Tanpa spasi, tanpa karakter spesial lain, tanpa emoji/font luar. */

const TAGNAME_REGEX = /^[a-z0-9_-]+$/;

document.getElementById("tagname").addEventListener("input", (e) => {

    /* Paksa lowercase otomatis biar user gak perlu mikir */
    e.target.value = e.target.value.toLowerCase().replace(/\s+/g, "_");

});

function generateDefaultUsername(){

    const digits = Math.floor(100000000 + Math.random() * 900000000);
    return "user" + digits;

}

async function isTagnameTaken(tagname){

    /* Cek ke Firestore: koleksi "users", field "tagname".
       Query unik ini WAJIB dijalankan lagi di sisi server
       (Firestore Security Rules / Cloud Function) supaya
       gak bisa dicurangi lewat request langsung ke API. */

    const snap = await firebase.firestore()
        .collection("users")
        .where("tagname", "==", tagname)
        .limit(1)
        .get();

    return !snap.empty;

}

document.getElementById("saveBtn").addEventListener("click", async () => {

    const errBox = document.getElementById("errTagname");
    errBox.textContent = "";

    const rawTagname = document.getElementById("tagname").value.trim();
    const username = document.getElementById("username").value.trim() || generateDefaultUsername();
    const bio = document.getElementById("bio").value.trim() || "hai saya menggunakan EchoNote";
    const link = document.getElementById("link").value.trim();

    if (!rawTagname) {
        errBox.textContent = "Tag akun wajib diisi.";
        return;
    }

    if (!TAGNAME_REGEX.test(rawTagname)) {
        errBox.textContent = "Tag hanya boleh huruf kecil, angka, _ dan -, tanpa spasi.";
        return;
    }

    const saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Menyimpan...";

    try {

        const taken = await isTagnameTaken(rawTagname);

        if (taken) {
            errBox.textContent = "Tag ini sudah dipakai orang lain.";
            saveBtn.disabled = false;
            saveBtn.textContent = "Simpan & Selesai";
            return;
        }

        const user = firebase.auth().currentUser
            || await new Promise((resolve) => {
                firebase.auth().onAuthStateChanged(resolve);
            });

        if (!user) {
            window.location.replace("/sign-in/index.html");
            return;
        }

        let avatarUrl = "/EchoNote/logo-profile-default/en.png";
        let bannerUrl = null;

        const storage = firebase.storage();

        if (avatarFile) {

            const ref = storage.ref(`avatars/${user.uid}`);
            await ref.put(avatarFile);
            avatarUrl = await ref.getDownloadURL();

        }

        if (bannerFile) {

            const ref = storage.ref(`banners/${user.uid}`);
            await ref.put(bannerFile);
            bannerUrl = await ref.getDownloadURL();

        }

        await firebase.firestore().collection("users").doc(user.uid).set({

            username,
            tagname: rawTagname,
            bio,
            link: link || null,
            avatarUrl,
            bannerUrl,
            phone: sessionStorage.getItem("echo_pending_phone") || null,
            verified: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        });

        sessionStorage.removeItem("echo_pending_phone");

        window.location.replace("/EchoNote/feed/Home/home.html");

    } catch (err) {

        errBox.textContent = "Gagal menyimpan, coba lagi.";
        console.error(err.message);

    } finally {

        saveBtn.disabled = false;
        saveBtn.textContent = "Simpan & Selesai";

    }

});
