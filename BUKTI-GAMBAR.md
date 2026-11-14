# Penyimpanan Gambar Bukti (Tabungan Bersama Orang Have)

Gambar bukti **tidak disimpan di Firebase**. Gambar disimpan sebagai file di folder `public/` proyek. Di Firebase hanya tersimpan **nama filenya**.

## Struktur folder

```
public/
└── tabungan-bersama/
    └── v1/
        ├── nabung/      bukti setoran (tab Setoran)
        ├── kas/         bukti pengeluaran kas (tab Kas)
        ├── pinjaman/    bukti pinjaman (tab Pinjaman)
        └── lunas/       bukti pelunasan pinjaman (tab Pinjaman, "Tandai lunas")
```

Buat folder yang belum ada. Pengaturan (versi dan nama folder) ada di `lib/orang-have/config.ts`:

| Setting | Isi | Fungsi |
|---|---|---|
| `OH_PROOF_VERSION` | `"v1"` | Nama folder versi. Ganti ke `"v2"` untuk mulai folder baru |
| `OH_PROOF_FOLDERS` | `nabung`, `kas`, `pinjaman`, `lunas` | Nama subfolder per jenis bukti |

## Cara menambah bukti

1. Simpan gambar di folder sesuai jenisnya, misalnya `public/tabungan-bersama/v1/nabung/nov-hani.jpg`.
2. Di aplikasi, isi kolom **bukti** di form dengan **nama file saja**: `nov-hani.jpg`. Jangan tulis folder atau `public/`.
3. Simpan datanya di aplikasi.
4. **Commit dan push** gambarnya ke repo agar ikut ter-deploy ke Vercel. Sebelum itu, gambar belum muncul di web.

## Cara gambar ditampilkan

Link **Lihat bukti** membuka popup besar di halaman yang sama. Klik area gelap di luar gambar, tombol ✕, atau tombol Esc untuk menutupnya. URL gambar disusun otomatis dari jenis bukti dan nama file:

```
/tabungan-bersama/v1/<jenis>/<nama-file>
```

## Aturan nama file

- Hanya huruf, angka, titik, spasi, minus (`-`), dan underscore (`_`).
- Tanpa folder atau `..`.
- Disarankan huruf kecil, tanpa spasi, dengan ekstensi `.jpg`, `.jpeg`, `.png`, atau `.webp`.
- Nama di aplikasi harus **sama persis** dengan nama file, termasuk huruf besar-kecil dan ekstensi.
- Nama file yang sama di dua jenis berbeda tidak bentrok, karena foldernya terpisah.

## Pemecahan masalah

| Masalah | Penyebab umum |
|---|---|
| Popup menampilkan "Gambar … tidak ditemukan" | Nama file beda dengan di folder, salah folder, atau belum di-push |
| Gambar muncul di lokal tapi tidak di Vercel | Gambar belum di-commit dan push |
| Gambar lama tidak muncul | Gambar masih di `public/bukti/`. Pindahkan ke folder jenisnya |
| Form menolak nama file | Ada karakter terlarang, atau nama file ditulis dengan folder |

## Catatan keamanan

- Isi `public/` bisa dibuka siapa saja yang tahu URL-nya. Gambar bukti **tidak ikut terlindungi login**.
- Sensor nomor rekening atau data sensitif lain sebelum gambar disimpan.
- Ukuran gambar sebaiknya dikompres (idealnya di bawah 500 KB) agar halaman cepat dibuka dan repo tidak membengkak.
