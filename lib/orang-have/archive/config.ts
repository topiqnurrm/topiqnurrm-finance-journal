// ============================================================
//  PENGATURAN ARSIP TABUNGAN BERSAMA ORANG HAVE
//  (terpisah dari arsip jurnal pribadi di lib/archive/config.ts)
// ============================================================
//
// OH_LIVE_FROM = bulan pertama yang dibaca dari FIREBASE.
// Bulan-bulan SEBELUM OH_LIVE_FROM dibaca dari file di lib/orang-have/archive/months/ (read-only).
//
// Sekarang belum ada bulan yang diarsipkan (OH_LIVE_FROM = OH_ARCHIVE_FIRST), jadi semuanya dari Firebase.
//
// Mengarsipkan bulan baru (mis. November 2026), setelah bulannya lewat:
//   1. Di tab Export halaman Tabungan Bersama, download Excel "semua data".
//   2. npm run archive:oh -- <file.xlsx> 2026-11     (membuat lib/orang-have/archive/months/2026-11.ts)
//   3. Ubah OH_LIVE_FROM di bawah menjadi "2026-12".
//
// Aturan: setoran dikelompokkan menurut TANGGAL TRANSFER, catatan kas menurut tanggalnya,
// dan pinjaman menurut TANGGAL LUNAS (pinjaman yang belum lunas selalu tetap di Firebase).
export const OH_LIVE_FROM = "2026-11";

// Bulan paling awal yang punya file arsip. Data bertanggal sebelum bulan ini ikut dimasukkan ke file bulan ini.
export const OH_ARCHIVE_FIRST = "2026-11";