# Panduan Arsip Bulanan

Bulan yang sudah selesai disimpan sebagai file di kode (`lib/archive/months/`), jadi tidak dibaca dari Firebase lagi.
Satu-satunya pengaturan: `LIVE_FROM` di `lib/archive/config.ts` (bulan pertama yang dibaca dari Firebase).

## Alur tiap bulan (contoh: mengarsipkan November, dikerjakan mulai 1 Desember)

1. **Export semua data**
   Buka halaman Export di aplikasi, klik *Export semua data* (jangan pilih rentang tanggal).
   Lakukan ini SEBELUM langkah 3. Hasilnya file `.xlsx` di folder Downloads.

2. **Buat file bulan**
   Di terminal, di folder utama proyek:
   ```
   npm run archive -- ~/Downloads/keuangan-jurnal_semua-data.xlsx 2026-11
   ```
   Muncul `lib/archive/months/2026-11.ts`. Cocokkan ringkasan di terminal (jumlah transaksi, pemasukan, pengeluaran) dengan angka bulan itu di aplikasi.

3. **Ubah satu baris** di `lib/archive/config.ts`
   ```ts
   export const LIVE_FROM = "2026-12";
   ```

4. **Cek di lokal** (`npm run dev`)
   - Analisis, pilih November: angkanya sama seperti sebelumnya.
   - Dashboard: Sisa Uang Desember sama seperti sebelumnya.
   - Review Detail dan Export: data November masih lengkap.
   - Ada tulisan "Arsip" di baris bulan November, tanpa tombol Edit/Hapus.

5. **Deploy.**

6. **Simpan** file Excel sebagai cadangan. Data November di Firebase tidak perlu dihapus.

## Hal yang perlu diingat
- Arsipkan hanya bulan yang sudah lewat. Skrip menolak bulan berjalan (kecuali `--force`).
- Setelah `LIVE_FROM` dinaikkan, tanggal November tidak bisa ditambah/diubah/dihapus dari aplikasi (form menolak tanggal arsip).
- Salah catat di bulan yang sudah diarsip: turunkan `LIVE_FROM` ke bulan itu (data masih ada di Firebase), perbaiki di aplikasi, lalu ulangi langkah 1 sampai 5.
- Kalau muncul peringatan "File arsip belum ada untuk bulan ...": file bulan itu belum dibuat, atau `LIVE_FROM` terlalu tinggi.
- Jangan edit file di `months/` dengan tangan; skrip membuatnya ulang dari Excel.
