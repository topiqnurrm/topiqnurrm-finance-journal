// Tabungan Bersama Orang Have. Disimpan di Firestore (baca publik, tulis hanya owner).

export interface OhMember {
  id?: string;
  name: string;
  target: number; // target tabungan pokok (Rp)
  createdAt: number;
}

// Satu catatan setoran. Satu anggota boleh punya lebih dari satu catatan di bulan yang sama.
export interface OhPayment {
  id?: string;
  memberId: string;
  month: string; // periode setoran, YYYY-MM
  savings: number; // tabungan pokok (Rp)
  kas: number; // iuran kas (Rp)
  paidDate: string; // tanggal transfer, YYYY-MM-DD
  proof: string; // nama file bukti setoran (folder nabung), "" kalau tidak ada
  note: string;
  createdAt: number;
}

// Catatan kas: "expense" = pengeluaran biasa (selalu mengurangi kas).
// "audit" = penyesuaian hasil audit: arah "in" = uang lebih (mis. bonus bank), "out" = uang kurang.
export type OhKasEntryType = "expense" | "audit";
export type OhKasDirection = "in" | "out";

export interface OhKasExpense {
  id?: string;
  type?: OhKasEntryType; // kosong (data lama) = expense
  direction?: OhKasDirection; // kosong (data lama) = out
  date: string;
  amount: number;
  note: string;
  proof: string;
  createdAt: number;
}

export interface OhLoan {
  id?: string;
  borrower: string;
  amount: number; // pokok pinjaman
  fee: number; // biaya pinjaman (diisi manual); masuk kas setelah pinjaman lunas
  date: string; // tanggal pinjam
  dueDate: string; // "" kalau tidak ada
  repaidDate: string | null; // null = belum kembali
  note: string;
  proof: string; // bukti pinjaman
  repaidProof?: string; // bukti pelunasan (folder lunas); kosong kalau belum ada
  createdAt: number;
}