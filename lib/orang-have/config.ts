// ============================================================
//  PENGATURAN TABUNGAN BERSAMA ORANG HAVE  (ubah di sini)
// ============================================================

// Periode tabungan (format YYYY-MM)
export const OH_PERIOD_START = "2026-11";
export const OH_PERIOD_END = "2027-07";

// Bulan pembagian tabungan + sisa kas
export const OH_PAYOUT_LABEL = "Agustus 2027";

// Jatuh tempo setoran bulan M: tanggal OH_DUE_DAY bulan M sampai tanggal OH_GRACE_DAY bulan berikutnya.
// Lewat dari itu dan belum ada catatan setoran = "Telat".
export const OH_DUE_DAY = 25;
export const OH_GRACE_DAY = 5;

// Iuran kas per orang per bulan: hanya dipakai sebagai isian awal di form (tetap bisa diubah manual)
export const OH_KAS_PER_PERSON = 10000;

// Rekening tujuan transfer, tampil di halaman. Ganti teks ini kalau sudah ada.
export const OH_ACCOUNT_INFO = "Belum ditentukan";

// Folder bukti transfer di dalam proyek: public/bukti/<nama-file>
// Taruh gambarnya di folder itu, lalu tulis nama filenya (mis. nov-hani.jpg) di form.
export const OH_PROOF_BASE = "/bukti/";