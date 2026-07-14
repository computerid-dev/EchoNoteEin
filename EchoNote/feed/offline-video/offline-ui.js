/* ==========================================================
   offline-ui.js — Render UI untuk halaman Video Offline
   ========================================================== */

(async function init(){

    await requestPersistentStorage();

    await renderQuota();
    await renderVideoList();

})();

async function renderQuota(){

    const { usage, quota, supported } = await getStorageEstimate();

    const quotaText = document.getElementById("quotaText");
    const quotaFill = document.getElementById("quotaFill");

    if (!supported) {

        quotaText.textContent = "Info kuota tidak didukung browser ini.";
        return;

    }

    const percent = quota ? Math.min(100, (usage / quota) * 100) : 0;

    quotaFill.style.width = percent.toFixed(1) + "%";

    quotaText.textContent =
        `${formatBytes(usage)} terpakai dari ${formatBytes(quota)} tersedia`;

}

async function renderVideoList(){

    const videos = await listOfflineVideos();

    const listEl = document.getElementById("videoList");
    const emptyEl = document.getElementById("emptyState");

    listEl.innerHTML = "";

    if (videos.length === 0) {

        emptyEl.classList.remove("hidden");
        return;

    }

    emptyEl.classList.add("hidden");

    videos.forEach((video) => {

        const item = document.createElement("div");
        item.className = "video-item";

        const thumbUrl = video.thumbnailBlob
            ? URL.createObjectURL(video.thumbnailBlob)
            : "";

        item.innerHTML = `
            <img class="thumb" src="${thumbUrl}" alt="">
            <div class="info">
                <div class="title">${escapeHtml(video.title)}</div>
                <div class="meta">${video.quality} • ${formatBytes(video.sizeBytes)}</div>
                <div class="actions">
                    <button class="save-btn secondary">Simpan ke Galeri</button>
                    <button class="delete-btn danger">Hapus</button>
                </div>
            </div>
        `;

        item.querySelector(".save-btn").addEventListener("click", async () => {

            const btn = item.querySelector(".save-btn");
            btn.disabled = true;
            btn.textContent = "Menyimpan...";

            const result = await saveVideoToDevice(video);

            btn.disabled = false;
            btn.textContent = "Simpan ke Galeri";

            if (!result.success && !result.cancelled) {

                alert("Gagal menyimpan ke galeri, coba lagi.");

            }

        });

        item.querySelector(".delete-btn").addEventListener("click", async () => {

            const confirmed = confirm(`Hapus "${video.title}" dari offline?`);

            if (!confirmed) return;

            await deleteOfflineVideo(video.id);
            await renderVideoList();
            await renderQuota();

        });

        listEl.appendChild(item);

    });

}

function formatBytes(bytes){

    if (!bytes) return "0 MB";

    const mb = bytes / (1024 * 1024);

    if (mb < 1024) return mb.toFixed(1) + " MB";

    return (mb / 1024).toFixed(2) + " GB";

}

function escapeHtml(str){

    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;

}
