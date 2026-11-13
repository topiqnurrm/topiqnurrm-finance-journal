import type { TransactionType, TransactionCategory } from "@/lib/types/finance";

// [tanggal, jenis, kategori, jumlah, catatan]
export type ArchiveTxRow = [string, TransactionType, TransactionCategory | null, number, string];

// [tanggal, nama kategori, isi]
export type ArchiveJournalRow = [string, string, string];

// Isi 1 file bulan (lib/archive/months/YYYY-MM.ts)
export interface ArchiveMonth {
  tx: ArchiveTxRow[];
  jr: ArchiveJournalRow[];
}