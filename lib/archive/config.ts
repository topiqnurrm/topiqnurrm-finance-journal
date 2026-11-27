// Pengaturan arsip jurnal pribadi.
//
// ARCHIVE_FIRST = bulan PERTAMA yang diarsipkan. Aset / pengingat yang tanggalnya lebih lama dari bulan ini
//                 (mis. aset yang dibeli Maret) ikut ditampung di file bulan ini.
// LIVE_FROM     = bulan pertama yang masih "hidup" di Firebase. Bulan sebelum ini dibaca dari arsip (read-only).
export const ARCHIVE_FIRST = "2026-08";
export const LIVE_FROM = "2026-11";