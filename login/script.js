/* ==========================================================
   login/script.js
   ========================================================== */

const form = document.getElementById("loginForm");
const submitBtn = document.getElementById("loginSubmit");
const errIdentifier = document.getElementById("errIdentifier");
const errPassword = document.getElementById("errPassword");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    errIdentifier.textContent = "";
    errPassword.textContent = "";

    const identifier = document.getElementById("loginIdentifier").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!identifier) {
        errIdentifier.textContent = "Wajib diisi.";
        return;
    }

    if (!password) {
        errPassword.textContent = "Wajib diisi.";
        return;
    }

    /* Login pakai nomor telepon butuh alur berbeda (OTP) di
       Firebase Auth. Untuk sekarang form ini asumsikan
       identifier berupa email; kalau mau dukung nomor
       telepon juga, tambahkan pengecekan format di sini
       dan arahkan ke flow signInWithPhoneNumber. */

    submitBtn.disabled = true;
    submitBtn.textContent = "Memproses...";

    try {

        const cred = await firebase.auth()
            .signInWithEmailAndPassword(identifier, password);

        EchoSession.setLoggedIn(cred.user.uid);

        window.location.replace("/EchoNote/feed/Home/home.html");

    } catch (err) {

        errPassword.textContent = mapAuthError(err.code);

    } finally {

        submitBtn.disabled = false;
        submitBtn.textContent = "Masuk";

    }

});

function mapAuthError(code){

    const map = {
        "auth/user-not-found": "Akun tidak ditemukan.",
        "auth/wrong-password": "Kata sandi salah.",
        "auth/invalid-email": "Format email tidak valid.",
        "auth/too-many-requests": "Terlalu banyak percobaan, coba lagi nanti.",
        "auth/operation-not-allowed": "Metode Email/Password belum diaktifkan di Firebase Console.",
        "auth/unauthorized-domain": "Domain ini belum diizinkan di Firebase Authorized domains.",
        "auth/network-request-failed": "Gagal terhubung ke server, cek koneksi internet."
    };

    return map[code] || `Gagal masuk, coba lagi. (kode: ${code})`;

}
