# Failsafe Kedua: Storage Lifecycle Rule

`cleanup-verifications.js` adalah lapisan pertama (aktif, jalan
tiap 15 menit). Tapi kalau function ini gagal jalan karena suatu
sebab (server error, bug, lupa deploy, dst), file dokumen di
Storage bisa "nyangkut" tanpa batas waktu.

Makanya perlu **lapisan kedua yang independen dari kode**, diatur
langsung di level Firebase Storage bucket. Ini jalan otomatis oleh
sistem Google sendiri, gak bergantung sama kode kita.

## Cara setup (sekali saja, lewat gcloud CLI)

1. Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
   kalau belum ada.

2. Buat file `lifecycle.json`:

```json
{
  "rule": [
    {
      "action": { "type": "Delete" },
      "condition": {
        "age": 3,
        "matchesPrefix": ["verifications/"]
      }
    }
  ]
}
```

Artinya: **semua file di folder `verifications/` otomatis
dihapus permanen kalau umurnya lebih dari 3 hari** — apapun
yang terjadi di sisi kode.

3. Terapkan ke bucket Firebase Storage lo:

```bash
gcloud storage buckets update gs://NAMA_BUCKET_LO \
  --lifecycle-file=lifecycle.json
```

(Ganti `NAMA_BUCKET_LO` dengan nama bucket Storage project
Firebase lo, biasanya format `nama-project.appspot.com`)

## Kenapa 3 hari, bukan 48 jam kayak di kode?

Sengaja dikasih jarak lebih lama supaya lapisan pertama
(`cleanup-verifications.js`, yang harusnya sudah beres di
bawah 48 jam) selalu kebagian jalan duluan dalam kondisi
normal. Lapisan Storage ini murni jaring pengaman terakhir,
bukan mekanisme utama.

## Cara cek sudah aktif atau belum

```bash
gcloud storage buckets describe gs://NAMA_BUCKET_LO --format="json(lifecycle)"
```
