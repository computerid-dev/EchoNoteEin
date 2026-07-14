/* ==========================================================
   EchoNote — core.js
   Dipakai di SEMUA halaman (auth & app). Isinya utilitas
   yang dipakai bersama, bukan logic spesifik 1 halaman.
   ========================================================== */

/* ==========================
   1. Firebase Init (PLACEHOLDER)
   -> firebaseConfig diisi sendiri sama Nugroho,
      taruh di file terpisah "firebase-config.js"
      supaya gampang di-.gitignore-kan (jangan sampai
      API key ke-commit ke repo publik).
========================== */

/* Load firebaseConfig dari window.__FIREBASE_CONFIG__
   yang didefinisikan di assets/firebase-config.js
   (file itu SENGAJA tidak diisi di sini — diisi manual). */

if (typeof firebase !== "undefined" && window.__FIREBASE_CONFIG__) {

    if (!firebase.apps.length) {

        firebase.initializeApp(window.__FIREBASE_CONFIG__);

    }

}

/* ==========================
   2. Session Helper
   Status login disimpan ringan di sessionStorage untuk
   kebutuhan UI (redirect, install banner trigger).
   Validasi SEBENARNYA tetap harus di server/Firebase Auth,
   ini cuma flag UI, bukan sumber kebenaran keamanan.
========================== */

const EchoSession = {

    isLoggedIn(){
        return sessionStorage.getItem("echo_logged_in") === "true";
    },

    setLoggedIn(uid){
        sessionStorage.setItem("echo_logged_in", "true");
        if (uid) sessionStorage.setItem("echo_uid", uid);
    },

    clear(){
        sessionStorage.removeItem("echo_logged_in");
        sessionStorage.removeItem("echo_uid");
    },

    hasReachedHome(){
        return localStorage.getItem("echo_reached_home") === "true";
    },

    markReachedHome(){
        localStorage.setItem("echo_reached_home", "true");
    }

};

/* ==========================
   3. Deteksi Online / Offline
   Dipakai supaya "loading" saat offline TIDAK nyangkut
   walau koneksi sudah balik (fix bug yang diminta).

   Pakai KOMBINASI 2 cara supaya reliable:
   a) event 'online'/'offline' bawaan browser
   b) heartbeat check tiap 8 detik (jaring pengaman,
      soalnya event 'online' kadang telat/gak fire di
      beberapa WebView/PWA installed)
========================== */

const EchoNetwork = {

    listeners: [],

    onChange(callback){
        this.listeners.push(callback);
    },

    _notify(isOnline){
        this.listeners.forEach(fn => fn(isOnline));
    },

    async _heartbeat(){

        try {

            /* Fetch file kecil dengan cache dimatikan,
               cara paling akurat cek koneksi beneran nyala
               (navigator.onLine kadang keliru true padahal
               nyambung ke wifi tanpa internet). */

            const res = await fetch("/manifest.json", {
                method: "HEAD",
                cache: "no-store"
            });

            return res.ok;

        } catch (err) {

            return false;

        }

    },

    init(){

        window.addEventListener("online", () => this._check());
        window.addEventListener("offline", () => this._notify(false));

        this._check();

        /* Failsafe: cek ulang tiap 8 detik SELAMA status
           terakhir yang diketahui adalah offline. Begitu
           online, interval berhenti sendiri sampai nanti
           event 'offline' nyala lagi. */

        setInterval(() => {

            if (this._lastKnown === false) {

                this._check();

            }

        }, 8000);

    },

    _lastKnown: null,

    async _check(){

        const online = navigator.onLine ? await this._heartbeat() : false;

        if (online !== this._lastKnown) {

            this._lastKnown = online;
            this._notify(online);

        }

    }

};

/* ==========================
   4. Install Banner (PWA)
   Sesuai keputusan: banner instal HANYA muncul setelah
   user berhasil login/daftar DAN sudah pernah membuka
   /EchoNote/feed/Home/home.html minimal 1x.
========================== */

const EchoInstall = {

    deferredPrompt: null,

    init(){

        window.addEventListener("beforeinstallprompt", (e) => {

            e.preventDefault();
            this.deferredPrompt = e;
            this._maybeShowBanner();

        });

        window.addEventListener("appinstalled", () => {

            this._hideBanner();
            this._showToast();

        });

    },

    _maybeShowBanner(){

        const eligible =
            EchoSession.isLoggedIn() &&
            EchoSession.hasReachedHome() &&
            !localStorage.getItem("echo_install_dismissed");

        if (!eligible || !this.deferredPrompt) return;

        const banner = document.getElementById("installBanner");

        if (banner) banner.classList.remove("hidden");

    },

    async promptInstall(){

        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();

        await this.deferredPrompt.userChoice;

        this.deferredPrompt = null;

        this._hideBanner();

    },

    dismiss(){

        localStorage.setItem("echo_install_dismissed", "true");
        this._hideBanner();

    },

    _hideBanner(){

        const banner = document.getElementById("installBanner");
        if (banner) banner.classList.add("hidden");

    },

    _showToast(){

        const toast = document.getElementById("installToast");

        if (!toast) return;

        toast.classList.remove("hidden");

        setTimeout(() => toast.classList.add("hidden"), 3500);

    }

};

/* ==========================
   5. Registrasi Service Worker
   Scope "/" -> menaungi SELURUH halaman (auth + app),
   satu PWA, bukan dua yang terpisah.
========================== */

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("/sw.js", { scope: "/" })
            .catch(err => console.error("SW register gagal:", err.message));

    });

}

/* Jalankan modul yang aman dijalankan di semua halaman */

EchoNetwork.init();
EchoInstall.init();
