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

// Folder bukti di dalam proyek. Struktur:
//   public/tabungan-bersama/<OH_PROOF_VERSION>/nabung/    -> bukti setoran
//   public/tabungan-bersama/<OH_PROOF_VERSION>/kas/       -> bukti pengeluaran kas
//   public/tabungan-bersama/<OH_PROOF_VERSION>/pinjaman/  -> bukti pinjaman
//   public/tabungan-bersama/<OH_PROOF_VERSION>/lunas/     -> bukti pelunasan pinjaman
// Mau ganti versi (mis. v2)? Cukup ubah OH_PROOF_VERSION dan buat folder barunya.
export const OH_PROOF_VERSION = "v1";
export const OH_PROOF_ROOT = `/tabungan-bersama/${OH_PROOF_VERSION}/`;
export type OhProofKind = "nabung" | "kas" | "pinjaman" | "lunas";
export const OH_PROOF_FOLDERS: Record<OhProofKind, string> = {
  nabung: "nabung",
  kas: "kas",
  pinjaman: "pinjaman",
  lunas: "lunas",
};
// Teks bantu di form: public/tabungan-bersama/v1/<folder>
export const ohProofDir = (kind: OhProofKind) =>
  `public/tabungan-bersama/${OH_PROOF_VERSION}/${OH_PROOF_FOLDERS[kind]}`;