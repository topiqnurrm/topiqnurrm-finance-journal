import type { TransactionType, TransactionCategory, Budget } from "@/lib/types/finance";

// [tanggal, jenis, kategori, jumlah, catatan]
export type ArchiveTxRow = [string, TransactionType, TransactionCategory | null, number, string];

// [tanggal, nama kategori, isi]
export type ArchiveJournalRow = [string, string, string];

// [tanggal beli / dapat, nama, jumlah, satuan, nilai (Rp) atau null, catatan]
export type ArchiveAssetRow = [string, string, number, string, number | null, string];

// [jatuh tempo, judul, catatan, penting, selesai]
export type ArchiveReminderRow = [string, string, string, boolean, boolean];

// Budget 1 bulan (tanpa id; id = bulan file)
export type ArchiveBudget = Omit<Budget, "id">;

// Isi 1 file bulan (lib/archive/months/YYYY-MM.ts)
// as / rm / bg bersifat opsional supaya file bulan lama (hanya tx + jr) tetap valid.
// Kalau as & rm ada (walau kosong) = bulan itu sudah "dimigrasi" dan aset/pengingatnya dibaca dari file ini.
// bg: undefined = budget bulan itu dibaca dari Firebase; null = memang tidak ada budget.
export interface ArchiveMonth {
  tx: ArchiveTxRow[];
  jr: ArchiveJournalRow[];
  as?: ArchiveAssetRow[];
  rm?: ArchiveReminderRow[];
  bg?: ArchiveBudget | null;
}