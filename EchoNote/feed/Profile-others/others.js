/* ==========================================================
   others.js — Lihat profil user lain
   Akses lewat: Profile-others/index.html?tag=namatag
   ========================================================== */

(async function loadOtherProfile(){

    const params = new URLSearchParams(window.location.search);
    const tag = params.get("tag");

    if (!tag) {

        document.getElementById("profileName").textContent = "Profil tidak ditemukan";
        return;

    }

    const snap = await firebase.firestore()
        .collection("users")
        .where("tagname", "==", tag)
        .limit(1)
        .get();

    if (snap.empty) {

        document.getElementById("profileName").textContent = "Profil tidak ditemukan";
        return;

    }

    const data = snap.docs[0].data();

    document.getElementById("topbarTag").textContent = "@" + data.tagname;
    document.getElementById("profileName").textContent = data.username || "Tanpa nama";
    document.getElementById("profileTag").textContent = "@" + data.tagname;
    document.getElementById("profileBio").textContent = data.bio || "";
    document.getElementById("profileAvatar").src = data.avatarUrl || "/EchoNote/logo-profile-default/en.png";

    if (data.bannerUrl) {
        document.getElementById("profileBanner").style.backgroundImage = `url(${data.bannerUrl})`;
    }

    if (data.verified) {
        document.getElementById("verifiedBadge").classList.remove("hidden");
    }

    if (data.link) {

        const linkEl = document.getElementById("profileLink");
        linkEl.href = data.link;
        linkEl.textContent = data.link;
        linkEl.classList.remove("hidden");

    }

    /* TODO: cek status follow yang sebenarnya dari Firestore,
       ini masih tombol statis. */

    document.getElementById("followBtn").addEventListener("click", (e) => {

        e.target.textContent = e.target.textContent === "Ikuti" ? "Mengikuti" : "Ikuti";

    });

})();
