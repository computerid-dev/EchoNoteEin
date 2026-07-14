/* ==========================================================
   verify.js
   Menentukan docType otomatis sesuai aturan yang sudah
   disepakati:
   - 13-17 tahun -> kartu_pelajar (wajib tanggal lahir manual)
   - 18-50 tahun -> ktp
   - bisnis -> sertifikat_izin
   Lalu kirim ke /.netlify/functions/submit-verification
   ========================================================== */

let selectedFile = null;

const categorySelect = document.getElementById("verifyCategory");
const ageRange = document.getElementById("ageRange");
const individuFields = document.getElementById("individuFields");
const bisnisFields = document.getElementById("bisnisFields");
const birthDateWrap = document.getElementById("birthDateWrap");
const docTypeLabel = document.getElementById("docTypeLabel");

function currentDocType(){

    if (categorySelect.value === "bisnis") return "sertifikat_izin";

    return ageRange.value === "13-17" ? "kartu_pelajar" : "ktp";

}

function updateFieldsVisibility(){

    const isBisnis = categorySelect.value === "bisnis";

    individuFields.classList.toggle("hidden", isBisnis);
    bisnisFields.classList.toggle("hidden", !isBisnis);

    const isMinor = !isBisnis && ageRange.value === "13-17";

    birthDateWrap.classList.toggle("hidden", !isMinor);

    if (!isBisnis) {

        docTypeLabel.textContent =
            "Dokumen: " + (ageRange.value === "13-17" ? "Kartu Tanda Pelajar" : "KTP");

    }

}

categorySelect.addEventListener("change", updateFieldsVisibility);
ageRange.addEventListener("change", updateFieldsVisibility);
updateFieldsVisibility();

document.getElementById("uploadBox").addEventListener("click", () => {
    document.getElementById("docInput").click();
});

document.getElementById("docInput").addEventListener("change", (e) => {

    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;
    document.getElementById("uploadBoxText").textContent = `Terpilih: ${file.name}`;

});

function fileToBase64(file){

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {

            /* Buang prefix "data:image/...;base64," -> sisakan
               base64 murni yang dipakai submit-verification.js */

            const base64 = reader.result.split(",")[1];
            resolve(base64);

        };

        reader.onerror = reject;
        reader.readAsDataURL(file);

    });

}

document.getElementById("submitVerifyBtn").addEventListener("click", async () => {

    const errBox = document.getElementById("errDoc");
    const statusBox = document.getElementById("statusBox");

    errBox.textContent = "";
    statusBox.classList.add("hidden");

    const isMinor = categorySelect.value === "individu" && ageRange.value === "13-17";

    if (isMinor && !document.getElementById("birthDate").value) {

        errBox.textContent = "Tanggal lahir wajib diisi untuk Kartu Pelajar.";
        return;

    }

    if (!selectedFile) {

        errBox.textContent = "Pilih dokumen dulu.";
        return;

    }

    const user = firebase.auth().currentUser;

    if (!user) {

        window.location.replace("/login/index.html");
        return;

    }

    const btn = document.getElementById("submitVerifyBtn");
    btn.disabled = true;
    btn.textContent = "Mengunggah...";

    try {

        const fileBase64 = await fileToBase64(selectedFile);

        const res = await fetch("/.netlify/functions/submit-verification", {

            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({

                userId: user.uid,
                docType: currentDocType(),
                fileBase64,
                fileMimeType: selectedFile.type,
                birthDate: isMinor ? document.getElementById("birthDate").value : null

            })

        });

        const data = await res.json();

        if (!res.ok) {

            throw new Error(data.error || "Gagal mengirim dokumen.");

        }

        statusBox.textContent = "Dokumen berhasil dikirim, menunggu review admin (biasanya diproses dalam 1x24 jam).";
        statusBox.className = "status-box success";
        statusBox.classList.remove("hidden");

        selectedFile = null;

    } catch (err) {

        statusBox.textContent = err.message;
        statusBox.className = "status-box error";
        statusBox.classList.remove("hidden");

    } finally {

        btn.disabled = false;
        btn.textContent = "Kirim untuk Direview";

    }

});
