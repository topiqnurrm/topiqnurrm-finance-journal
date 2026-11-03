import * as XLSX from "xlsx";
import { Transaction } from "@/lib/types/finance";
import { JournalEntry } from "@/lib/types/journal";

const CATEGORY_LABELS: Record<string, string> = {
  kehidupan: "Kehidupan",
  mendadak: "Mendadak",
  tabungan: "Tabungan",
  foya_foya: "Foya-foya",
  grooming: "Grooming",
  dana_darurat: "Dana Darurat",
  audit: "Audit",
  sisa_dibawa: "Sisa Dibawa ke Bulan Depan",
  hutang: "Hutang / Piutang",
};

interface ExportOptions {
  transactions: Transaction[];
  journals: JournalEntry[];
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

function inRange(date: string, from?: string, to?: string) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function exportToExcel({ transactions, journals, from, to }: ExportOptions) {
  const filteredTransactions = transactions
    .filter((t) => inRange(t.date, from, to))
    .sort((a, b) => a.date.localeCompare(b.date));

  const filteredJournals = journals
    .filter((j) => inRange(j.date, from, to))
    .sort((a, b) => a.date.localeCompare(b.date));

  const transactionRows = filteredTransactions.map((t) => ({
    Tanggal: t.date,
    Tipe: t.type === "income" ? "Pemasukan" : "Pengeluaran",
    Kategori: t.category ? CATEGORY_LABELS[t.category] ?? t.category : "-",
    Jumlah: t.amount,
    Catatan: t.note || "-",
  }));

  const journalRows = filteredJournals.map((j) => ({
    Tanggal: j.date,
    Kategori: j.categoryName,
    Isi: j.content,
  }));

  // Hutang/piutang tidak dihitung sebagai pemasukan maupun pengeluaran
  const counted = filteredTransactions.filter((t) => t.category !== "hutang");
  const totalIncome = counted.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = counted.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const debtOut = filteredTransactions
    .filter((t) => t.category === "hutang" && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const debtIn = filteredTransactions
    .filter((t) => t.category === "hutang" && t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const carryOut = filteredTransactions
    .filter((t) => t.category === "sisa_dibawa")
    .reduce((s, t) => s + t.amount, 0);

  // Dihitung dari baris yang ada di sheet Transaksi pada rentang ini
  const summaryRows = [
    { Ringkasan: "Total Pemasukan (tanpa hutang/piutang)", Nilai: totalIncome },
    { Ringkasan: "Total Pengeluaran (tanpa hutang/piutang)", Nilai: totalExpense },
    { Ringkasan: "Selisih", Nilai: totalIncome - totalExpense },
    { Ringkasan: "Sisa Dibawa ke Bulan Depan (sudah termasuk di pengeluaran)", Nilai: carryOut },
    { Ringkasan: "Hutang/Piutang Uang Keluar (tidak dihitung)", Nilai: debtOut },
    { Ringkasan: "Hutang/Piutang Uang Masuk (tidak dihitung)", Nilai: debtIn },
    { Ringkasan: "Jumlah Transaksi", Nilai: filteredTransactions.length },
    { Ringkasan: "Jumlah Jurnal", Nilai: filteredJournals.length },
  ];

  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Ringkasan");

  const transactionSheet = XLSX.utils.json_to_sheet(
    transactionRows.length > 0 ? transactionRows : [{ Tanggal: "", Tipe: "", Kategori: "", Jumlah: "", Catatan: "Tidak ada data" }]
  );
  XLSX.utils.book_append_sheet(wb, transactionSheet, "Transaksi");

  const journalSheet = XLSX.utils.json_to_sheet(
    journalRows.length > 0 ? journalRows : [{ Tanggal: "", Kategori: "", Isi: "Tidak ada data" }]
  );
  XLSX.utils.book_append_sheet(wb, journalSheet, "Jurnal");

  const rangeLabel = from || to ? `${from || "awal"}_sd_${to || "akhir"}` : "semua-data";
  const filename = `keuangan-jurnal_${rangeLabel}.xlsx`;

  XLSX.writeFile(wb, filename);
}