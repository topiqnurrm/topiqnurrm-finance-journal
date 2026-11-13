// Arsip 2026-08 (read-only). Transaksi 9, jurnal 2.
// Dibuat otomatis oleh scripts/archive-month.mjs dari export Excel. JANGAN diedit manual.
// [tanggal, jenis, kategori, jumlah, catatan] / [tanggal, nama kategori, isi]
// Urutan: tanggal naik, dalam 1 hari terbaru dulu (sama seperti export).
import type { ArchiveMonth } from "../types";

const data: ArchiveMonth = {
  tx: [
    ["2026-08-17","expense","kehidupan",800000,"bayar kos ke 1"],
    ["2026-08-18","income",null,3000000,"sangu dari orang tua "],
    ["2026-08-24","income",null,120000,"dikei bapak pas nyusul bis "],
    ["2026-08-24","income","hutang",500000,"dihutangi nadya buat wisuda"],
    ["2026-08-27","expense","kehidupan",38000,"mama lemon 9k, indomie, wow spaghetti, azelia sabut cuci piring 5k, telur 8 butir 11.600k"],
    ["2026-08-31","carryover",null,1588000,"uang bulan ini untuk bulan depan"],
    ["2026-08-31","expense","kehidupan",10000,"nasi padang"],
    ["2026-08-31","expense","kehidupan",610000,"sisa uang kehidupan saya hanya tinggal 1.598.000 (500k utang nadya), karena tanggal 25 agus belum gajian, tutup buku 16, jadi aku gajian 25 September 2026, mulai kerjane aku 18 agustus"],
    ["2026-08-31","expense","kehidupan",74000,"beras 5kg sphp (61k), telur 8 butir (13k)"],
  ],
  jr: [
    ["2026-08-31","cyber","download utm, download ubuntu 3.5 gb, dan kali linux 3.5 gb, windows otomatis uis ono"],
    ["2026-08-31","religi","baca alfatihah sampai halaman 5 (al baqarah, ayat 25) di https://quran.com/id/sapi-betina?startingVerse=26,, shalat duha"],
  ],
};

export default data;