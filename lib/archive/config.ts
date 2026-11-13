// ============================================================
//  PENGATURAN ARSIP  (satu-satunya file yang perlu kamu ubah)
// ============================================================
//
// LIVE_FROM = bulan pertama yang dibaca dari FIREBASE.
// Bulan-bulan SEBELUM LIVE_FROM dibaca dari file di lib/archive/months/ (read-only, tanpa baca Firebase).
//
// Contoh: LIVE_FROM = "2026-11"
//   2026-08, 2026-09, 2026-10  -> dari file  lib/archive/months/2026-08.ts, 2026-09.ts, 2026-10.ts
//   2026-11 dan seterusnya      -> dari Firebase
//
// Mengarsipkan bulan baru (mis. November):
//   1. Buat file bulannya:  npm run archive -- <file.xlsx> 2026-11   (menghasilkan lib/archive/months/2026-11.ts)
//   2. Ubah LIVE_FROM di bawah menjadi "2026-12".
//
// Mau membaca bulan tertentu dari Firebase lagi? Turunkan LIVE_FROM (file arsip tidak perlu dihapus).
// Syarat: data bulan itu masih ada di Firebase.
export const LIVE_FROM = "2026-11";

// Bulan paling awal yang punya file arsip. Jarang perlu diubah.
export const ARCHIVE_FIRST = "2026-08";