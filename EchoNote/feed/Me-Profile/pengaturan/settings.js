/* ==========================================================
   settings.js
   ========================================================== */

document.getElementById("changePasswordBtn").addEventListener("click", async () => {

    const user = firebase.auth().currentUser;

    if (!user || !user.email) {

        alert("Gagal mengirim link reset.");
        return;

    }

    try {

        await firebase.auth().sendPasswordResetEmail(user.email);
        alert("Link reset kata sandi sudah dikirim ke email kamu.");

    } catch (err) {

        alert("Gagal mengirim link reset, coba lagi.");

    }

});

document.getElementById("changePhoneBtn").addEventListener("click", () => {

    /* TODO: alur ganti nomor butuh verifikasi ulang (OTP)
       supaya nomor baru beneran milik user -> belum
       dirancang detail, ini placeholder dulu. */

    alert("Fitur ganti nomor telepon masih dalam pengembangan.");

});

document.getElementById("logoutBtn").addEventListener("click", async () => {

    const confirmed = confirm("Yakin mau keluar?");

    if (!confirmed) return;

    await firebase.auth().signOut();

    EchoSession.clear();

    window.location.replace("/login/index.html");

});
