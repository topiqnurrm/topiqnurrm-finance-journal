import { OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { OH_DUE_DAY, OH_GRACE_DAY, OH_PERIOD_END, OH_PERIOD_START } from "./config";

const pad = (n: number) => String(n).padStart(2, "0");

export function nextMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
}

// Daftar bulan periode: ["2026-11", ..., "2027-07"]
export function periodMonths(start = OH_PERIOD_START, end = OH_PERIOD_END): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = nextMonth(cur);
  }
  return out;
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
}

export function monthLabelLong(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

// paid: sudah ada catatan setoran
// due: sedang di jendela bayar (tanggal 25 s/d 5 bulan berikutnya)
// late: lewat jendela bayar, belum ada catatan
// upcoming: belum waktunya
export type MonthStatus = "paid" | "due" | "late" | "upcoming";

export function monthStatus(month: string, today: string, paid: boolean): MonthStatus {
  if (paid) return "paid";
  const windowStart = `${month}-${pad(OH_DUE_DAY)}`;
  const windowEnd = `${nextMonth(month)}-${pad(OH_GRACE_DAY)}`;
  if (today > windowEnd) return "late";
  if (today >= windowStart) return "due";
  return "upcoming";
}

export function memberTotals(member: OhMember, payments: OhPayment[]) {
  const mine = payments.filter((p) => p.memberId === member.id);
  const savings = mine.reduce((s, p) => s + p.savings, 0);
  const kas = mine.reduce((s, p) => s + p.kas, 0);
  const paidMonths = new Set(mine.map((p) => p.month)).size;
  const remaining = Math.max(member.target - savings, 0);
  const progress = member.target > 0 ? Math.min(100, Math.round((savings / member.target) * 100)) : 0;
  return { savings, kas, paidMonths, remaining, progress };
}

// Biaya pinjaman dihitung masuk kas setelah pinjaman ditandai lunas.
export function kasSummary(
  payments: OhPayment[],
  expenses: OhKasExpense[],
  loans: OhLoan[],
  memberCount: number
) {
  const kasIn = payments.reduce((s, p) => s + p.kas, 0);
  const feeIn = loans.filter((l) => l.repaidDate).reduce((s, l) => s + l.fee, 0);
  const kasOut = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = kasIn + feeIn - kasOut;
  // sisa kas dibagi rata; dibulatkan ke bawah (sisa receh tetap di kas)
  const share = memberCount > 0 ? Math.floor(balance / memberCount) : 0;
  return { kasIn, feeIn, kasOut, balance, share };
}

export function poolSummary(payments: OhPayment[], kasBalance: number, loans: OhLoan[]) {
  const savingsTotal = payments.reduce((s, p) => s + p.savings, 0);
  const outstanding = loans.filter((l) => !l.repaidDate).reduce((s, l) => s + l.amount, 0);
  const total = savingsTotal + kasBalance; // seluruh dana kelompok (tabungan + kas)
  return { savingsTotal, outstanding, total, available: total - outstanding };
}

// Estimasi diterima saat pembagian = tabungan pokok yang sudah disetor + bagian sisa kas (kondisi saat ini)
export function projection(member: OhMember, payments: OhPayment[], kasShare: number) {
  const { savings } = memberTotals(member, payments);
  return { savings, kasShare, estimate: savings + kasShare, gapToTarget: Math.max(member.target - savings, 0) };
}

// Nama file bukti yang aman: tanpa folder / karakter aneh
export function isValidProofName(name: string) {
  return name === "" || (/^[A-Za-z0-9._ -]+$/.test(name) && !name.includes(".."));
}