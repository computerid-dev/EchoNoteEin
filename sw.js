/* ==========================================================
   sw.js — EchoNote Service Worker (satu-satunya, scope "/")
   ========================================================== */

const CACHE_NAME = "echonote-shell-v1";

/* App shell: file yang jarang berubah, aman di-cache-first.
   Halaman feed/chat/dll TIDAK dimasukkan sini karena
   isinya data dinamis (network-first, lihat fetch handler). */

const SHELL_FILES = [

    "/",
    "/index.html",
    "/offline.html",
    "/manifest.json",
    "/assets/theme.css",
    "/assets/core.js",
    "/assets/firebase-config.js",
    "/images/icons/icon-192.png",
    "/images/icons/icon-512.png"

];

self.addEventListener("install", (event) => {

    event.waitUntil(

        caches.open(CACHE_NAME).then((cache) =>
            cache.addAll(SHELL_FILES).catch((err) => {

                console.warn("SW: sebagian shell gagal di-cache", err);

            })
        )

    );

    self.skipWaiting();

});

self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )

    );

    self.clients.claim();

});

self.addEventListener("fetch", (event) => {

    const { request } = event;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    /* Video offline: JANGAN pernah dicache lewat Service
       Worker. Video disimpan manual lewat IndexedDB (lihat
       offline-video/offline.js), biarkan request video
       langsung ke network apa adanya. */

    if (url.pathname.includes("/video/") || url.pathname.endsWith(".mp4")) {

        return;

    }

    /* API / data dinamis (Netlify Functions) -> Network First */

    if (url.pathname.includes("/.netlify/functions/")) {

        event.respondWith(

            fetch(request).catch(() =>
                new Response(
                    JSON.stringify({ error: "offline" }),
                    { headers: { "Content-Type": "application/json" }, status: 503 }
                )
            )

        );

        return;

    }

    /* Halaman HTML navigasi -> Network First + fallback offline.html */

    if (request.mode === "navigate") {

        event.respondWith(

            fetch(request)
                .then((res) => {

                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(request, clone));
                    return res;

                })
                .catch(() =>
                    caches.match(request).then((cached) => cached || caches.match("/offline.html"))
                )

        );

        return;

    }

    /* Sisanya (CSS/JS/gambar shell) -> Cache First */

    event.respondWith(

        caches.match(request).then((cached) => {

            if (cached) return cached;

            return fetch(request).then((res) => {

                const clone = res.clone();
                caches.open(CACHE_NAME).then((c) => c.put(request, clone));
                return res;

            });

        })

    );

});
