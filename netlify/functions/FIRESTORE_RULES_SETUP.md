# Firestore Security Rules — EchoNote

Karena sekarang feed & chat akses Firestore **langsung dari
browser** (bukan lewat server lagi), Security Rules ini WAJIB
dipasang. Tanpa ini, siapapun bisa baca/tulis/hapus data
orang lain.

## Cara pasang

1. Buka [Firebase Console](https://console.firebase.google.com/) → project **echonoteauth**
2. Menu **Build > Firestore Database**
3. Tab **Rules**
4. Hapus isi yang ada, ganti dengan kode di bawah
5. Klik **Publish**

## Rules starter (v1 — cukup buat MVP, akan dikembangkan)

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Profil user: semua orang boleh baca (biar profil bisa
    // dilihat publik), tapi cuma pemiliknya yang boleh edit.
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false; // hapus akun lewat flow khusus, bukan langsung
    }

    // Post feed: semua orang boleh baca, cuma yang login boleh
    // bikin post, cuma pemilik post yang boleh edit/hapus.
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.data.authorId == request.auth.uid;
      allow update, delete: if request.auth != null
                    && resource.data.authorId == request.auth.uid;
    }

    // Chat: cuma partisipan percakapan yang boleh baca/tulis.
    // (Asumsi: dokumen conversations/{id} punya field
    // "participants" berisi array UID)
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null
                    && request.auth.uid in resource.data.participants;

      match /messages/{messageId} {
        allow read: if request.auth != null
                    && request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        allow create: if request.auth != null
                    && request.resource.data.senderUid == request.auth.uid;
      }
    }

    // Verifikasi dokumen (KTP/Kartu Pelajar/dll): TIDAK BOLEH
    // diakses client sama sekali. Semua proses lewat Netlify
    // Function (submit-verification.js, review-verification.js)
    // yang pakai Admin SDK — otomatis bypass rules ini, tapi
    // kita tetap kunci total dari sisi client sebagai lapisan
    // keamanan tambahan.
    match /verifications/{verificationId} {
      allow read, write: if false;
    }

  }
}
```

## Catatan

Rules di atas masih level dasar (cukup buat v1). Beberapa hal
yang perlu diperketat nanti seiring fitur berkembang:
- Batasi ukuran field teks (`request.resource.data.text.size() < 1000`)
- Validasi field wajib ada saat create (`request.resource.data.keys().hasAll([...])`)
- Rate limiting tetap perlu ditangani terpisah (Security Rules
  gak bisa mencegah spam, cuma kontrol akses)
