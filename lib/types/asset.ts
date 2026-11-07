// Catatan aset (emas, dll). Tidak ada hubungannya dengan pemasukan/pengeluaran.
export interface Asset {
  id?: string;
  name: string; // mis. "Emas Semar"
  quantity: number; // mis. 1, 2, 0.5
  unit: string; // mis. "gram", "pcs"
  value: number | null; // perkiraan nilai / harga beli (Rp), opsional
  note: string;
  date: string; // tanggal beli / dapat (YYYY-MM-DD)
  createdAt: number;
}