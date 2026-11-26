// [tanggal transfer, nama anggota, periode (YYYY-MM), tabungan, kas, file bukti, catatan]
export type OhArchivePayRow = [string, string, string, number, number, string, string];

// [tanggal, jenis ("expense" | "audit"), arah ("in" | "out"), jumlah, keterangan, file bukti]
export type OhArchiveKasRow = [string, "expense" | "audit", "in" | "out", number, string, string];

// [tanggal pinjam, peminjam, pokok, biaya, jatuh tempo, tanggal lunas, catatan, bukti pinjaman, bukti lunas]
export type OhArchiveLoanRow = [string, string, number, number, string, string, string, string, string];

// Isi 1 file bulan (lib/orang-have/archive/months/YYYY-MM.ts)
export interface OhArchiveMonth {
  pay: OhArchivePayRow[];
  kas: OhArchiveKasRow[];
  loan: OhArchiveLoanRow[];
}