/* ==========================================================
   sign-in/script.js — Daftar akun baru
   ========================================================== */

const form = document.getElementById("signinForm");
const submitBtn = document.getElementById("signinSubmit");
const passwordInput = document.getElementById("regPassword");

document.getElementById("genPasswordBtn").addEventListener("click", () => {

    const random = generateRandomPassword();
    passwordInput.value = random;
    passwordInput.type = "text";

    /* Kasih tau user passwordnya biar sempat dicatat,
       karena begitu form pindah halaman ini gak muncul lagi. */
    alert("Kata sandi acak kamu: " + random + "\n\nCatat/simpan dulu sebelum lanjut.");

});

function generateRandomPassword(){

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let out = "";

    for (let i = 0; i < 12; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }

    return out;

}

function isValidPhone(phone){
    /* Format sederhana nomor Indonesia: 08xxxxxxxxxx (10-14 digit) */
    return /^08[0-9]{8,12}$/.test(phone);
}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    document.getElementById("errEmail").textContent = "";
    document.getElementById("errPhone").textContent = "";
    document.getElementById("errPassword").textContent = "";

    const email = document.getElementById("regEmail").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const password = passwordInput.value;

    let hasError = false;

    if (!email) {
        document.getElementById("errEmail").textContent = "Wajib diisi.";
        hasError = true;
    }

    if (!isValidPhone(phone)) {
        document.getElementById("errPhone").textContent = "Format nomor tidak valid (contoh: 08123456789).";
        hasError = true;
    }

    if (!password || password.length < 8) {
        document.getElementById("errPassword").textContent = "Minimal 8 karakter.";
        hasError = true;
    }

    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Memproses...";

    try {

        const cred = await firebase.auth()
            .createUserWithEmailAndPassword(email, password);

        /* Simpan nomor telepon ke profil user via Firestore
           dilakukan di halaman Create-Account (langkah
           berikutnya), supaya 1 form gak kepanjangan. */

        sessionStorage.setItem("echo_pending_phone", phone);

        EchoSession.setLoggedIn(cred.user.uid);

        window.location.replace("/Create-Account/accoun-create.html");

    } catch (err) {

        document.getElementById("errEmail").textContent = mapAuthError(err.code);

    } finally {

        submitBtn.disabled = false;
        submitBtn.textContent = "Daftar";

    }

});

function mapAuthError(code){

    const map = {
        "auth/email-already-in-use": "Email sudah terdaftar.",
        "auth/invalid-email": "Format email tidak valid.",
        "auth/weak-password": "Kata sandi terlalu lemah.",
        "auth/operation-not-allowed": "Metode Email/Password belum diaktifkan di Firebase Console.",
        "auth/unauthorized-domain": "Domain ini belum diizinkan di Firebase Authorized domains.",
        "auth/network-request-failed": "Gagal terhubung ke server, cek koneksi internet."
    };

    return map[code] || `Gagal mendaftar, coba lagi. (kode: ${code})`;

}
