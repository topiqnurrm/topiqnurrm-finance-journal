import { OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { formatRupiah } from "@/lib/utils/currency";
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

export const isAudit = (e: OhKasExpense) => e.type === "audit";

// Pengaruh satu catatan ke saldo kas: pengeluaran = minus; audit "in" = plus, audit "out" = minus
export function kasEntryDelta(e: OhKasExpense): number {
  if (isAudit(e)) return e.direction === "in" ? e.amount : -e.amount;
  return -e.amount;
}

// Biaya pinjaman dihitung masuk kas setelah pinjaman ditandai lunas.
// Audit: selisih lebih menambah kas, selisih kurang mengurangi kas (dipisah dari pengeluaran biasa).
export function kasSummary(
  payments: OhPayment[],
  expenses: OhKasExpense[],
  loans: OhLoan[],
  memberCount: number
) {
  const kasIn = payments.reduce((s, p) => s + p.kas, 0);
  const feeIn = loans.filter((l) => l.repaidDate).reduce((s, l) => s + l.fee, 0);
  const kasOut = expenses.filter((e) => !isAudit(e)).reduce((s, e) => s + e.amount, 0);
  const auditIn = expenses.filter((e) => isAudit(e) && e.direction === "in").reduce((s, e) => s + e.amount, 0);
  const auditOut = expenses.filter((e) => isAudit(e) && e.direction !== "in").reduce((s, e) => s + e.amount, 0);
  const balance = kasIn + feeIn + auditIn - kasOut - auditOut;
  // sisa kas dibagi rata; dibulatkan ke bawah (sisa receh tetap di kas)
  const share = memberCount > 0 ? Math.floor(balance / memberCount) : 0;
  return { kasIn, feeIn, kasOut, auditIn, auditOut, balance, share };
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

// ---------- History keseluruhan ----------
export type OhHistoryKind = "setoran" | "kas" | "audit" | "pinjam" | "lunas";

export interface OhHistoryItem {
  key: string;
  date: string; // YYYY-MM-DD
  kind: OhHistoryKind;
  title: string;
  detail: string;
  delta: number; // pengaruh ke uang aktual (+ masuk, - keluar)
  proof: string;
  balance: number; // uang aktual setelah transaksi ini
}

const KIND_ORDER: Record<OhHistoryKind, number> = { setoran: 0, pinjam: 1, lunas: 2, kas: 3, audit: 4 };

// Semua kejadian digabung dan diurutkan dari lama ke baru, lalu dihitung saldo berjalan.
// Saldo akhir = tabungan + saldo kas - pinjaman belum kembali (sama dengan "Uang aktual" di Ringkasan).
export function buildHistory(
  members: (OhMember & { id: string })[],
  payments: OhPayment[],
  expenses: OhKasExpense[],
  loans: OhLoan[]
): OhHistoryItem[] {
  const name = (id: string) => members.find((m) => m.id === id)?.name ?? "(anggota dihapus)";
  type Raw = Omit<OhHistoryItem, "balance"> & { created: number };
  const raw: Raw[] = [];

  payments.forEach((p, i) =>
    raw.push({
      key: `p:${p.id ?? i}`,
      date: p.paidDate,
      kind: "setoran",
      title: `Setoran ${name(p.memberId)}`,
      detail: `Periode ${monthLabelLong(p.month)} · tabungan ${formatRupiah(p.savings)} + kas ${formatRupiah(p.kas)}${p.note ? ` · ${p.note}` : ""}`,
      delta: p.savings + p.kas,
      proof: p.proof || "",
      created: p.createdAt ?? 0,
    })
  );
  expenses.forEach((e, i) =>
    raw.push({
      key: `e:${e.id ?? i}`,
      date: e.date,
      kind: isAudit(e) ? "audit" : "kas",
      title: isAudit(e) ? (e.direction === "in" ? "Audit: uang lebih" : "Audit: uang kurang") : "Pengeluaran kas",
      detail: e.note || "-",
      delta: kasEntryDelta(e),
      proof: e.proof || "",
      created: e.createdAt ?? 0,
    })
  );
  loans.forEach((l, i) => {
    raw.push({
      key: `l:${l.id ?? i}`,
      date: l.date,
      kind: "pinjam",
      title: `Pinjaman ${l.borrower}`,
      detail: `Biaya pinjaman ${formatRupiah(l.fee)}${l.dueDate ? ` · jatuh tempo ${l.dueDate}` : ""}${l.note ? ` · ${l.note}` : ""}`,
      delta: -l.amount,
      proof: l.proof || "",
      created: l.createdAt ?? 0,
    });
    if (l.repaidDate) {
      raw.push({
        key: `r:${l.id ?? i}`,
        date: l.repaidDate,
        kind: "lunas",
        title: `Pinjaman ${l.borrower} lunas`,
        detail: `Pokok ${formatRupiah(l.amount)} kembali + biaya ${formatRupiah(l.fee)} masuk kas`,
        delta: l.amount + l.fee,
        proof: l.repaidProof || "",
        created: l.createdAt ?? 0,
      });
    }
  });

  raw.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.created - b.created
  );
  let bal = 0;
  return raw.map(({ created: _c, ...r }) => {
    bal += r.delta;
    return { ...r, balance: bal };
  });
}