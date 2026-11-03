import { Transaction } from "@/lib/types/finance";
import { formatRupiah } from "@/lib/utils/currency";

type TxLike = Pick<Transaction, "type" | "category" | "amount" | "date">;

function shiftMonthId(monthId: string, delta: number) {
  const [y, m] = monthId.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface MonthTotals {
  income: number; // pemasukan bulan ini, sudah termasuk sisa dari bulan lalu, tanpa hutang
  expense: number; // pengeluaran bulan ini, sudah termasuk sisa yang dibawa ke bulan depan, tanpa hutang
  carryIn: number; // sisa uang dari bulan lalu (sudah termasuk di income)
  carryOut: number; // sisa uang yang dibawa ke bulan depan (sudah termasuk di expense)
  debtOut: number; // hutang/piutang uang keluar (tidak dihitung)
  debtIn: number; // hutang/piutang uang masuk (tidak dihitung)
}

// Aturan:
// - Hutang/Piutang: tidak masuk pemasukan maupun pengeluaran.
// - Sisa Dibawa: dihitung sebagai pengeluaran di bulannya, dan otomatis jadi pemasukan bulan berikutnya.
export function calcMonthTotals(transactions: TxLike[], monthId: string): MonthTotals {
  const prev = shiftMonthId(monthId, -1);
  const r: MonthTotals = { income: 0, expense: 0, carryIn: 0, carryOut: 0, debtOut: 0, debtIn: 0 };

  for (const t of transactions) {
    const m = t.date.slice(0, 7);

    if (t.category === "hutang") {
      if (m === monthId) {
        if (t.type === "income") r.debtIn += t.amount;
        else r.debtOut += t.amount;
      }
      continue;
    }

    if (t.type === "income") {
      if (m === monthId) r.income += t.amount;
      continue;
    }

    // pengeluaran
    if (m === monthId) {
      r.expense += t.amount;
      if (t.category === "sisa_dibawa") r.carryOut += t.amount;
    }
    if (m === prev && t.category === "sisa_dibawa") {
      r.income += t.amount;
      r.carryIn += t.amount;
    }
  }
  return r;
}

// Saldo hutang/piutang yang belum lunas, kumulatif sampai akhir bulan yang dipilih.
// Positif = orang lain masih berhutang ke kita (kita meminjamkan, belum dikembalikan).
// Negatif = kita masih berhutang (kita dipinjami, belum dibayar).
export function calcDebtBalance(transactions: TxLike[], upToMonthId: string): number {
  let balance = 0;
  for (const t of transactions) {
    if (t.category !== "hutang") continue;
    if (t.date.slice(0, 7) > upToMonthId) continue;
    balance += t.type === "expense" ? t.amount : -t.amount;
  }
  return balance;
}

// Untuk ringkasan per hari / daftar: jumlah pemasukan & pengeluaran tanpa hutang/piutang
export function sumIncomeExpense(list: TxLike[]) {
  let income = 0;
  let expense = 0;
  for (const t of list) {
    if (t.category === "hutang") continue;
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense };
}

// Tampilan nominal: pengeluaran bernilai minus (mis. -5000) tampil sebagai +Rp 5.000 hijau
export function getAmountDisplay(t: Pick<Transaction, "type" | "amount">) {
  const positive = t.type === "income" ? t.amount >= 0 : t.amount < 0;
  return {
    positive,
    text: `${positive ? "+" : "-"}${formatRupiah(Math.abs(t.amount))}`,
  };
}