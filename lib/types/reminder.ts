// Pengingat (mis. paket data habis, bayar tagihan). Tidak berhubungan dengan keuangan.
export interface Reminder {
  id?: string;
  title: string; // mis. "Paket data habis"
  dueDate: string; // YYYY-MM-DD
  note: string;
  important: boolean; // ditandai penting
  done: boolean;
  createdAt: number;
}