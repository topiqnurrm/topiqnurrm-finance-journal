# Panduan Arsip Bulanan: Tabungan Bersama Orang Have

Sistem ini **terpisah** dari arsip jurnal pribadi. Mekanismenya sama: bulan yang sudah selesai disimpan sebagai file di kode
(`lib/orang-have/archive/months/`), jadi tidak dibaca dari Firebase lagi.
Satu-satunya pengaturan: `OH_LIVE_FROM` di `lib/orang-have/archive/config.ts` (bulan pertama yang dibaca dari Firebase).

Satu file bulan memuat:

| Data | Dikelompokkan menurut |
|---|---|
| Setoran (tabungan + kas) | **tanggal transfer** (bukan periode setoran) |
| Catatan kas (pengeluaran dan audit) | tanggal catatan |
| Pinjaman | **tanggal lunas** |

Anggota tidak diarsipkan; daftar anggota tetap di Firebase.

## Kondisi awal

`OH_LIVE_FROM = "2026-11"` dan `OH_ARCHIVE_FIRST = "2026-11"`: belum ada bulan yang diarsipkan, semua data dibaca dari Firebase.
Bulan pertama yang diarsipkan nanti adalah November 2026 (dikerjakan mulai 1 Desember).

## Alur tiap bulan (contoh: mengarsipkan November, dikerjakan mulai 1 Desember)

1. **Export semua data**
   Buka halaman Tabungan Bersama, tab **Export**, kosongkan tanggal, klik *Download Excel*.
   Lakukan ini SEBELUM langkah 3. Hasilnya file `tabungan-orang-have_semua-data.xlsx` di folder Downloads.

2. **Pastikan pinjaman bulan itu sudah dicatat lunas**
   Pinjaman yang belum lunas tidak ikut diarsipkan; ia tetap di Firebase dan baru masuk arsip di bulan ia dilunasi.
   Skrip memberi peringatan dan menyebut peminjamnya.

3. **Buat file bulan**
   Di terminal, di folder utama proyek:
   ```
   npm run archive:oh -- ~/Downloads/tabungan-orang-have_semua-data.xlsx 2026-11
   ```
   Muncul `lib/orang-have/archive/months/2026-11.ts`. Cocokkan ringkasan di terminal dengan aplikasi, contohnya:
   ```
   ✅ 2026-11: 3 setoran (tabungan Rp ..., kas Rp ...), 2 catatan kas, 0 pinjaman lunas
   ```

4. **Ubah satu baris** di `lib/orang-have/archive/config.ts`
   ```ts
   export const OH_LIVE_FROM = "2026-12";
   ```

5. **Cek di lokal** (`npm run dev`)
   - Ringkasan: Total dana, Saldo kas, Uang aktual, dan progress tiap anggota sama seperti sebelumnya.
   - Setoran, Kas, Pinjaman, dan History: data November masih lengkap, dan saldo di History sama seperti sebelumnya.
   - Export: data November masih ikut terekspor.

6. **Deploy.**

7. **Simpan** file Excel sebagai cadangan. Data November di Firebase tidak perlu dihapus.

## Hal yang perlu diingat
- Arsipkan hanya bulan yang sudah lewat. Skrip menolak bulan berjalan (kecuali `--force`).
- Setelah `OH_LIVE_FROM` dinaikkan, setoran, catatan kas, dan pelunasan pinjaman bertanggal sampai akhir November
  tidak bisa ditambah/diubah/dihapus dari aplikasi (muncul peringatan).
- Pinjaman yang dicatat belum lunas boleh bertanggal berapa pun. Yang tidak boleh: tanggal lunas di bulan yang sudah diarsipkan.
- Setoran arsip menyimpan **nama** anggota. Jangan mengganti nama anggota yang setorannya sudah diarsipkan, supaya setorannya tetap tersambung.
- Setoran yang ditransfer sebelum bulan pertama arsip ikut masuk ke file bulan pertama (`OH_ARCHIVE_FIRST`), supaya tidak hilang.
- Gambar bukti tidak ikut diarsipkan, hanya nama filenya. Gambarnya tetap di `public/tabungan-bersama/<versi>/...`; jangan dihapus.
- Salah catat di bulan yang sudah diarsip: turunkan `OH_LIVE_FROM` ke bulan itu (data masih ada di Firebase), perbaiki di aplikasi, lalu ulangi langkah 1 sampai 6.
- Kalau muncul peringatan "File arsip Tabungan Bersama belum ada untuk bulan ...": file bulan itu belum dibuat, atau `OH_LIVE_FROM` terlalu tinggi.
- Jangan edit file di `months/` dengan tangan; skrip membuatnya ulang dari Excel.