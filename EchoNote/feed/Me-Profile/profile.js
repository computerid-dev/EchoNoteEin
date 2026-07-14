/* ==========================================================
   profile.js — Tampilkan data profil user yang sedang login
   ========================================================== */

(async function loadProfile(){

    const user = firebase.auth().currentUser
        || await new Promise((resolve) => {
            firebase.auth().onAuthStateChanged(resolve);
        });

    if (!user) {

        window.location.replace("/login/index.html");
        return;

    }

    const doc = await firebase.firestore()
        .collection("users").doc(user.uid).get();

    if (!doc.exists) {

        /* Profil belum lengkap -> arahkan ke setup */
        window.location.replace("/Create-Account/accoun-create.html");
        return;

    }

    const data = doc.data();

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

})();
