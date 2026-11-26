# Panduan Arsip Bulanan: Jurnal & Keuangan Pribadi

Bulan yang sudah selesai disimpan sebagai file di kode (`lib/archive/months/`), jadi tidak dibaca dari Firebase lagi.
Satu-satunya pengaturan: `LIVE_FROM` di `lib/archive/config.ts` (bulan pertama yang dibaca dari Firebase).

Satu file bulan sekarang memuat **semua** data pribadi bulan itu:

| Data | Dikelompokkan menurut |
|---|---|
| Transaksi (pemasukan, pengeluaran, sisa bulan, ambil tabungan) | tanggal transaksi |
| Jurnal | tanggal jurnal |
| Catatan aset | tanggal beli / dapat |
| Pengingat | tanggal jatuh tempo |
| Budget | bulan budget (satu budget per file) |

(Tabungan Bersama Orang Have punya sistem arsip sendiri: lihat `ARSIP-ORANG-HAVE.md`.)

## Alur tiap bulan (contoh: mengarsipkan November, dikerjakan mulai 1 Desember)

1. **Selesaikan pengingat bulan itu**
   Buka Pengingat di dashboard, tandai selesai (centang) atau hapus semua pengingat yang jatuh tempo di November.
   Skrip akan berhenti dan menampilkan daftarnya kalau masih ada yang belum selesai.

2. **Export semua data**
   Buka halaman Export di aplikasi, klik *Export semua data* (jangan pilih rentang tanggal).
   Lakukan ini SEBELUM langkah 4. Hasilnya file `.xlsx` di folder Downloads, berisi sheet
   Ringkasan, Transaksi, Jurnal, **Aset, Pengingat, Budget**.

3. **Buat file bulan**
   Di terminal, di folder utama proyek:
   ```
   npm run archive -- ~/Downloads/keuangan-jurnal_semua-data.xlsx 2026-11
   ```
   Muncul `lib/archive/months/2026-11.ts`. Cocokkan ringkasan di terminal dengan aplikasi, contohnya:
   ```
   ✅ 2026-11: 80 transaksi (pemasukan Rp ..., pengeluaran Rp ...), 60 jurnal, 2 aset, 5 pengingat, budget ada
   ```
   Kalau muncul peringatan sheet Aset/Pengingat/Budget tidak ada, berarti Excel-nya dari export versi lama.
   Export ulang dari aplikasi yang sudah diperbarui.

4. **Ubah satu baris** di `lib/archive/config.ts`
   ```ts
   export const LIVE_FROM = "2026-12";
   ```

5. **Cek di lokal** (`npm run dev`)
   - Analisis, pilih November: angkanya sama seperti sebelumnya, dan **budget November** masih sama.
   - Dashboard: Sisa Uang Desember sama seperti sebelumnya.
   - Catatan Aset di Analisis: semua aset masih ada. Aset dari arsip bertanda "Arsip" tanpa tombol Edit/Hapus.
   - Pengingat: pengingat November yang sudah selesai ada di "Tampilkan yang selesai", bertanda "Arsip".
   - Review Detail dan Export: data November masih lengkap.
   - Ada tulisan "Arsip" di baris November, tanpa tombol Edit/Hapus.

6. **Deploy.**

7. **Simpan** file Excel sebagai cadangan. Data November di Firebase tidak perlu dihapus.

## Migrasi pertama (sekali saja): memasukkan aset, pengingat, dan budget ke file Agustus - Oktober

File Agustus - Oktober yang sudah ada hanya berisi transaksi dan jurnal. Supaya aset, pengingat, dan budget
bulan-bulan itu ikut tersimpan di kode:

1. Pasang file-file versi baru (`lib/archive/index.ts`, `types.ts`, hook `useAssets`, `useReminders`, `useBudget`, `export-excel.ts`, `scripts/archive-month.mjs`).
   Aplikasi tetap aman sebelum migrasi: selama sebuah bulan belum memuat aset/pengingat, aset dan pengingatnya masih dibaca dari Firebase.
2. Tandai selesai (atau hapus) pengingat Agustus - Oktober yang masih aktif.
3. Export semua data (versi baru, ada sheet Aset, Pengingat, Budget).
4. Jalankan sekaligus:
   ```
   npm run archive -- ~/Downloads/keuangan-jurnal_semua-data.xlsx 2026-08 2026-09 2026-10
   ```
   File bulan ditimpa dengan versi lengkap. Transaksi dan jurnalnya identik dengan sebelumnya.
5. Cek (langkah 5 di atas), lalu deploy.

Catatan: aset yang tanggalnya lebih lama dari Agustus ikut masuk ke file Agustus (bulan pertama arsip),
supaya tidak ada aset yang hilang.

## Hal yang perlu diingat
- Arsipkan hanya bulan yang sudah lewat. Skrip menolak bulan berjalan (kecuali `--force`).
- Setelah `LIVE_FROM` dinaikkan, tanggal November tidak bisa ditambah/diubah/dihapus dari aplikasi
  (form menolak tanggal arsip). Ini berlaku untuk transaksi, jurnal, aset, pengingat, dan budget bulan itu.
- Aset dan pengingat baru tidak bisa bertanggal sebelum `LIVE_FROM`.
- Pengingat yang belum selesai di bulan yang akan diarsipkan menghentikan skrip. Selesaikan dulu (langkah 1), atau `--force` kalau memang mau diarsipkan apa adanya (pengingat itu tidak bisa dicentang lagi).
- Salah catat di bulan yang sudah diarsip: turunkan `LIVE_FROM` ke bulan itu (data masih ada di Firebase), perbaiki di aplikasi, lalu ulangi langkah 2 sampai 6.
- Kalau muncul peringatan "File arsip belum ada untuk bulan ...": file bulan itu belum dibuat, atau `LIVE_FROM` terlalu tinggi.
- Jangan edit file di `months/` dengan tangan; skrip membuatnya ulang dari Excel.