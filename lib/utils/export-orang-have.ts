import * as XLSX from "xlsx";
import { OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { OH_PAYOUT_LABEL } from "@/lib/orang-have/config";
import { buildHistory, isAudit, kasEntryDelta, kasSummary, memberTotals, monthLabelLong, periodMonths, poolSummary, projection } from "@/lib/orang-have/calc";

type Member = OhMember & { id: string };

export interface OhExportOptions {
  members: Member[];
  payments: OhPayment[];
  expenses: OhKasExpense[];
  loans: OhLoan[];
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

const inRange = (date: string, from?: string, to?: string) => !((from && date < from) || (to && date > to));

// Kalau sheet kosong, isi satu baris keterangan supaya file tetap valid
const sheet = (rows: Record<string, unknown>[], empty: Record<string, unknown>) =>
  XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [empty]);

function setWidths(ws: XLSX.WorkSheet, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  ws["!cols"] = Object.keys(rows[0]).map((k) => ({
    wch: Math.min(60, Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)) + 2),
  }));
}

export function exportOrangHave({ members, payments, expenses, loans, from, to }: OhExportOptions) {
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "(anggota dihapus)";

  // Ringkasan selalu dari seluruh data (tidak terpengaruh rentang tanggal)
  const kas = kasSummary(payments, expenses, loans, members.length);
  const pool = poolSummary(payments, kas.balance, loans);

  const summaryRows: Record<string, unknown>[] = [
    { Ringkasan: "Total Tabungan Pokok", Nilai: pool.savingsTotal },
    { Ringkasan: "Kas Masuk (iuran)", Nilai: kas.kasIn },
    { Ringkasan: "Biaya Pinjaman Masuk Kas (pinjaman lunas)", Nilai: kas.feeIn },
    { Ringkasan: "Pengeluaran Kas", Nilai: kas.kasOut },
    { Ringkasan: "Audit: Uang Lebih (menambah kas)", Nilai: kas.auditIn },
    { Ringkasan: "Audit: Uang Kurang (mengurangi kas)", Nilai: kas.auditOut },
    { Ringkasan: "Saldo Kas", Nilai: kas.balance },
    { Ringkasan: "Total Dana Kelompok", Nilai: pool.total },
    { Ringkasan: "Sedang Dipinjam", Nilai: pool.outstanding },
    { Ringkasan: "Uang Aktual (Total Dana - Dipinjam)", Nilai: pool.available },
    { Ringkasan: `Bagian Kas per Anggota (${OH_PAYOUT_LABEL})`, Nilai: kas.share },
    { Ringkasan: "Jumlah Anggota", Nilai: members.length },
    { Ringkasan: "Jumlah Catatan Setoran", Nilai: payments.length },
    { Ringkasan: "Jumlah Catatan Kas (pengeluaran + audit)", Nilai: expenses.length },
    { Ringkasan: "Jumlah Pinjaman", Nilai: loans.length },
    { Ringkasan: "Diekspor", Nilai: new Date().toLocaleString("id-ID") },
  ];

  const memberRows = members.map((m) => {
    const t = memberTotals(m, payments);
    const p = projection(m, payments, kas.share);
    return {
      Nama: m.name,
      "Target Tabungan": m.target,
      "Tabungan Disetor": t.savings,
      "Kas Disetor": t.kas,
      "Kurang dari Target": t.remaining,
      "Progress (%)": t.progress,
      "Bulan Tercatat": t.paidMonths,
      [`Estimasi Diterima ${OH_PAYOUT_LABEL}`]: p.estimate,
    };
  });

  const paymentRows = payments
    .filter((p) => inRange(p.paidDate, from, to))
    .sort((a, b) => a.paidDate.localeCompare(b.paidDate))
    .map((p) => ({
      "Tanggal Transfer": p.paidDate,
      Anggota: nameOf(p.memberId),
      "Periode Setoran": p.month,
      Tabungan: p.savings,
      Kas: p.kas,
      Total: p.savings + p.kas,
      "File Bukti (folder nabung)": p.proof || "",
      Catatan: p.note || "",
    }));

  // Matriks tabungan per anggota per bulan periode
  const months = periodMonths();
  const matrixRows = members.map((m) => {
    const row: Record<string, unknown> = { Anggota: m.name };
    months.forEach((mo) => {
      row[monthLabelLong(mo)] = payments
        .filter((p) => p.memberId === m.id && p.month === mo)
        .reduce((s, p) => s + p.savings, 0);
    });
    row["Total"] = memberTotals(m, payments).savings;
    return row;
  });

  const expenseRows = expenses
    .filter((e) => inRange(e.date, from, to))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      Tanggal: e.date,
      Jenis: isAudit(e) ? "Audit" : "Pengeluaran",
      Arah: kasEntryDelta(e) >= 0 ? "Masuk (lebih)" : "Keluar",
      Jumlah: e.amount,
      "Pengaruh ke Kas": kasEntryDelta(e),
      Keterangan: e.note || "",
      "File Bukti (folder kas / audit)": e.proof || "",
    }));

  const loanRows = loans
    .filter((l) => inRange(l.date, from, to))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({
      "Tanggal Pinjam": l.date,
      Peminjam: l.borrower,
      Pokok: l.amount,
      "Biaya Pinjaman": l.fee,
      "Jatuh Tempo": l.dueDate || "",
      Status: l.repaidDate ? "Lunas" : "Belum kembali",
      "Tanggal Lunas": l.repaidDate || "",
      "File Bukti Pinjaman (folder pinjaman)": l.proof || "",
      "File Bukti Lunas (folder lunas)": l.repaidProof || "",
      Catatan: l.note || "",
    }));

  // Saldo berjalan dihitung dari seluruh data, lalu difilter menurut rentang tanggal
  const historyRows = buildHistory(members, payments, expenses, loans)
    .filter((i) => inRange(i.date, from, to))
    .map((i) => ({
      Tanggal: i.date,
      Jenis: { setoran: "Setoran", kas: "Pengeluaran Kas", audit: "Audit Kas", pinjam: "Pinjaman", lunas: "Pelunasan" }[i.kind],
      Keterangan: i.title,
      Detail: i.detail,
      Pengaruh: i.delta,
      "Uang Aktual Setelahnya": i.balance,
      "File Bukti": i.proof,
    }));

  const wb = XLSX.utils.book_new();
  const add = (name: string, rows: Record<string, unknown>[], empty: Record<string, unknown>) => {
    const ws = sheet(rows, empty);
    setWidths(ws, rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  add("Ringkasan", summaryRows, { Ringkasan: "", Nilai: "" });
  add("Anggota", memberRows, { Nama: "Tidak ada data" });
  add("Setoran", paymentRows, { "Tanggal Transfer": "Tidak ada data" });
  add("Matriks Setoran", matrixRows, { Anggota: "Tidak ada data" });
  add("Kas", expenseRows, { Tanggal: "Tidak ada data" });
  add("Pinjaman", loanRows, { "Tanggal Pinjam": "Tidak ada data" });
  add("History", historyRows, { Tanggal: "Tidak ada data" });

  const rangeLabel = from || to ? `${from || "awal"}_sd_${to || "akhir"}` : "semua-data";
  XLSX.writeFile(wb, `tabungan-orang-have_${rangeLabel}.xlsx`);
}

// Cadangan mentah (semua koleksi) dalam JSON
export function exportOrangHaveJson({ members, payments, expenses, loans }: OhExportOptions) {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), members, payments, expenses, loans }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tabungan-orang-have_backup.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}