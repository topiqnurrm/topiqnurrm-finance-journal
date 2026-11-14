import { Transaction, isCarryover } from "@/lib/types/finance";
import { formatRupiah } from "@/lib/utils/currency";

type TxLike = Pick<Transaction, "type" | "category" | "amount" | "date">;

export type AmountTone = "positive" | "negative" | "neutral";

function shiftMonthId(monthId: string, delta: number) {
  const [y, m] = monthId.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface MonthTotals {
  income: number; // pemasukan bulan ini (tanpa hutang, tanpa sisa bulan lalu)
  expense: number; // pengeluaran bulan ini (tanpa hutang, tanpa sisa dibawa)
  carryIn: number; // sisa uang dari bulan lalu
  carryOut: number; // sisa uang yang dibawa ke bulan depan
  withdrawal: number; // uang diambil dari tabungan / dana darurat bulan ini
  sisaUang: number; // income + carryIn + withdrawal - expense - carryOut
  debtOut: number; // hutang/piutang uang keluar (tidak dihitung)
  debtIn: number; // hutang/piutang uang masuk (tidak dihitung)
}

// Aturan:
// - Hutang/Piutang: tidak masuk pemasukan maupun pengeluaran.
// - Sisa Bulan (carryover): bukan pemasukan dan bukan pengeluaran. Dicatat di bulannya
//   sebagai "dibawa ke bulan depan", lalu otomatis jadi "sisa bulan lalu" di bulan berikutnya.
export function calcMonthTotals(transactions: TxLike[], monthId: string): MonthTotals {
  const prev = shiftMonthId(monthId, -1);
  const r: MonthTotals = {
    income: 0,
    expense: 0,
    carryIn: 0,
    carryOut: 0,
    withdrawal: 0,
    sisaUang: 0,
    debtOut: 0,
    debtIn: 0,
  };

  for (const t of transactions) {
    const m = t.date.slice(0, 7);

    if (t.category === "hutang") {
      if (m === monthId) {
        if (t.type === "income") r.debtIn += t.amount;
        else r.debtOut += t.amount;
      }
      continue;
    }

    if (isCarryover(t)) {
      if (m === monthId) r.carryOut += t.amount;
      if (m === prev) r.carryIn += t.amount;
      continue;
    }

    if (m !== monthId) continue;
    if (t.type === "income") r.income += t.amount;
    else if (t.type === "expense") r.expense += t.amount;
    else if (t.type === "withdrawal") r.withdrawal += t.amount;
  }

  r.sisaUang = r.income + r.carryIn + r.withdrawal - r.expense - r.carryOut;
  return r;
}

// Saldo Tabungan & Dana Darurat kumulatif sampai akhir bulan yang dipilih:
// setoran (pengeluaran berkategori tabungan / dana_darurat) dikurangi pengambilan.
export function calcSavingsBalance(transactions: TxLike[], upToMonthId: string) {
  let tabungan = 0;
  let danaDarurat = 0;
  let tabunganOh = 0;
  for (const t of transactions) {
    if (t.date.slice(0, 7) > upToMonthId) continue;
    const sign = t.type === "expense" ? 1 : t.type === "withdrawal" ? -1 : 0;
    if (sign === 0) continue;
    if (t.category === "tabungan") tabungan += sign * t.amount;
    else if (t.category === "dana_darurat") danaDarurat += sign * t.amount;
    else if (t.category === "tabungan_oh" && sign === 1) tabunganOh += t.amount;
  }
  return { tabungan, danaDarurat, tabunganOh };
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

// Untuk ringkasan per hari / daftar: pemasukan & pengeluaran tanpa hutang/piutang dan sisa bulan
export function sumIncomeExpense(list: TxLike[]) {
  let income = 0;
  let expense = 0;
  for (const t of list) {
    if (t.category === "hutang" || isCarryover(t)) continue;
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
  }
  return { income, expense };
}

// Tampilan nominal:
// - pengeluaran bernilai minus (mis. -5000) tampil +Rp 5.000 hijau
// - sisa bulan tampil netral tanpa tanda +/-
// - ambil tabungan / dana darurat tampil netral dengan tanda +
export function getAmountDisplay(t: Pick<Transaction, "type" | "amount" | "category">): {
  tone: AmountTone;
  text: string;
} {
  if (isCarryover(t)) {
    return { tone: "neutral", text: formatRupiah(t.amount) };
  }
  if (t.type === "withdrawal") {
    // uang masuk ke kantong, tapi bukan pemasukan -> warna netral
    return { tone: "neutral", text: `+${formatRupiah(t.amount)}` };
  }
  const positive = t.type === "income" ? t.amount >= 0 : t.amount < 0;
  return {
    tone: positive ? "positive" : "negative",
    text: `${positive ? "+" : "-"}${formatRupiah(Math.abs(t.amount))}`,
  };
}