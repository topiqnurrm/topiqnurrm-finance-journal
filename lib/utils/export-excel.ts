import * as XLSX from "xlsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Budget, Transaction, isCarryover, CARRYOVER_LABEL } from "@/lib/types/finance";
import { JournalEntry } from "@/lib/types/journal";
import { Asset } from "@/lib/types/asset";
import { Reminder } from "@/lib/types/reminder";
import { EMPTY_ARCHIVE, loadArchive } from "@/lib/archive";

const CATEGORY_LABELS: Record<string, string> = {
  kehidupan: "Kehidupan",
  mendadak: "Mendadak",
  tabungan: "Tabungan",
  foya_foya: "Foya-foya",
  grooming: "Grooming",
  dana_darurat: "Dana Darurat",
  tabungan_oh: "Tabungan Orang Have",
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

const BUDGET_KEYS = [
  ["kehidupan", "Kehidupan"],
  ["mendadak", "Mendadak"],
  ["tabungan", "Tabungan"],
  ["foya_foya", "Foya-foya"],
  ["grooming", "Grooming"],
  ["dana_darurat", "Dana Darurat"],
  ["tabungan_oh", "Tabungan Orang Have"],
  ["audit", "Audit"],
] as const;

// Aset, pengingat, dan budget: gabungan Firebase + arsip (arsip hanya dipakai kalau belum ada padanannya di Firebase).
// Firebase dibaca penuh (koleksinya kecil) supaya data lama yang belum diarsipkan juga ikut terekspor.
async function loadExtras() {
  const [assetSnap, reminderSnap, budgetSnap, archive] = await Promise.all([
    getDocs(collection(db, "assets")),
    getDocs(collection(db, "reminders")),
    getDocs(collection(db, "budgets")),
    loadArchive().catch(() => EMPTY_ARCHIVE),
  ]);

  const liveAssets = assetSnap.docs.map((d) => d.data() as Asset);
  const assetSig = (a: Asset) => `${a.date}|${a.name}|${a.quantity}|${a.unit}|${a.value ?? ""}|${a.note ?? ""}`;
  const seenAssets = new Set(liveAssets.map(assetSig));
  const assets = [...liveAssets, ...archive.assets.filter((a) => !seenAssets.has(assetSig(a)))];

  const liveReminders = reminderSnap.docs.map((d) => d.data() as Reminder);
  const reminderSig = (r: Reminder) => `${r.dueDate}|${r.title}|${r.note ?? ""}`;
  const seenReminders = new Set(liveReminders.map(reminderSig));
  const reminders = [...liveReminders, ...archive.reminders.filter((r) => !seenReminders.has(reminderSig(r)))];

  const budgets = new Map<string, Omit<Budget, "id">>();
  for (const [month, b] of Object.entries(archive.budgets)) if (b) budgets.set(month, b);
  for (const d of budgetSnap.docs) budgets.set(d.id, d.data() as Omit<Budget, "id">); // Firebase menang

  return { assets, reminders, budgets };
}

export async function exportToExcel({ transactions, journals, from, to }: ExportOptions) {
  const extras = await loadExtras();
  const fromMonth = from?.slice(0, 7);
  const toMonth = to?.slice(0, 7);

  const assetRows = extras.assets
    .filter((a) => inRange(a.date, from, to))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => ({
      Tanggal: a.date,
      Nama: a.name,
      Jumlah: a.quantity,
      Satuan: a.unit,
      Nilai: a.value ?? "",
      Catatan: a.note || "",
    }));

  const reminderRows = extras.reminders
    .filter((r) => inRange(r.dueDate, from, to))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((r) => ({
      "Jatuh Tempo": r.dueDate,
      Judul: r.title,
      Catatan: r.note || "",
      Penting: r.important ? "Ya" : "Tidak",
      Selesai: r.done ? "Ya" : "Tidak",
    }));

  const budgetRows = Array.from(extras.budgets.entries())
    .filter(([m]) => (!fromMonth || m >= fromMonth) && (!toMonth || m <= toMonth))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, b]) => {
      const row: Record<string, string | number> = { Bulan: m };
      for (const [key, label] of BUDGET_KEYS) row[label] = (b as Record<string, number | undefined>)[key] ?? "";
      return row;
    });

  const filteredTransactions = transactions
    .filter((t) => inRange(t.date, from, to))
    .sort((a, b) => a.date.localeCompare(b.date));

  const filteredJournals = journals
    .filter((j) => inRange(j.date, from, to))
    .sort((a, b) => a.date.localeCompare(b.date));

  const transactionRows = filteredTransactions.map((t) => ({
    Tanggal: t.date,
    Tipe: isCarryover(t)
      ? "Sisa Bulan"
      : t.type === "withdrawal"
      ? "Ambil Tabungan"
      : t.type === "income"
      ? "Pemasukan"
      : "Pengeluaran",
    Kategori: isCarryover(t)
      ? CARRYOVER_LABEL
      : t.category
      ? CATEGORY_LABELS[t.category] ?? t.category
      : "-",
    Jumlah: t.amount,
    Catatan: t.note || "-",
  }));

  const journalRows = filteredJournals.map((j) => ({
    Tanggal: j.date,
    Kategori: j.categoryName,
    Isi: j.content,
  }));

  // Hutang/piutang dan sisa bulan tidak dihitung sebagai pemasukan maupun pengeluaran
  const counted = filteredTransactions.filter(
    (t) => t.category !== "hutang" && !isCarryover(t) && t.type !== "withdrawal"
  );
  const totalIncome = counted.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = counted.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const debtOut = filteredTransactions
    .filter((t) => t.category === "hutang" && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const debtIn = filteredTransactions
    .filter((t) => t.category === "hutang" && t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const carryOut = filteredTransactions
    .filter((t) => isCarryover(t))
    .reduce((s, t) => s + t.amount, 0);

  const withdrawTabungan = filteredTransactions
    .filter((t) => t.type === "withdrawal" && t.category === "tabungan")
    .reduce((s, t) => s + t.amount, 0);
  const withdrawDana = filteredTransactions
    .filter((t) => t.type === "withdrawal" && t.category === "dana_darurat")
    .reduce((s, t) => s + t.amount, 0);

  const withdrawOh = filteredTransactions
    .filter((t) => t.type === "withdrawal" && t.category === "tabungan_oh")
    .reduce((s, t) => s + t.amount, 0);

  // Dihitung dari baris yang ada di sheet Transaksi pada rentang ini
  const summaryRows = [
    { Ringkasan: "Total Pemasukan (tanpa hutang/piutang & sisa bulan)", Nilai: totalIncome },
    { Ringkasan: "Total Pengeluaran (tanpa hutang/piutang & sisa bulan)", Nilai: totalExpense },
    { Ringkasan: "Selisih", Nilai: totalIncome - totalExpense },
    { Ringkasan: "Sisa Dibawa ke Bulan Depan (bukan pemasukan/pengeluaran)", Nilai: carryOut },
    { Ringkasan: "Diambil dari Tabungan (bukan pemasukan/pengeluaran)", Nilai: withdrawTabungan },
    { Ringkasan: "Diambil dari Dana Darurat (bukan pemasukan/pengeluaran)", Nilai: withdrawDana },
    { Ringkasan: "Diambil dari Tabungan Orang Have (bukan pemasukan/pengeluaran)", Nilai: withdrawOh },
    { Ringkasan: "Hutang/Piutang Uang Keluar (tidak dihitung)", Nilai: debtOut },
    { Ringkasan: "Hutang/Piutang Uang Masuk (tidak dihitung)", Nilai: debtIn },
    { Ringkasan: "Jumlah Transaksi", Nilai: filteredTransactions.length },
    { Ringkasan: "Jumlah Jurnal", Nilai: filteredJournals.length },
    { Ringkasan: "Jumlah Aset", Nilai: assetRows.length },
    { Ringkasan: "Jumlah Pengingat", Nilai: reminderRows.length },
    { Ringkasan: "Jumlah Budget (bulan)", Nilai: budgetRows.length },
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

  const assetSheet = XLSX.utils.json_to_sheet(
    assetRows.length > 0 ? assetRows : [{ Tanggal: "", Nama: "", Jumlah: "", Satuan: "", Nilai: "", Catatan: "Tidak ada data" }]
  );
  XLSX.utils.book_append_sheet(wb, assetSheet, "Aset");

  const reminderSheet = XLSX.utils.json_to_sheet(
    reminderRows.length > 0
      ? reminderRows
      : [{ "Jatuh Tempo": "", Judul: "", Catatan: "Tidak ada data", Penting: "", Selesai: "" }]
  );
  XLSX.utils.book_append_sheet(wb, reminderSheet, "Pengingat");

  const budgetSheet = XLSX.utils.json_to_sheet(
    budgetRows.length > 0 ? budgetRows : [{ Bulan: "Tidak ada data" }]
  );
  XLSX.utils.book_append_sheet(wb, budgetSheet, "Budget");

  const rangeLabel = from || to ? `${from || "awal"}_sd_${to || "akhir"}` : "semua-data";
  const filename = `keuangan-jurnal_${rangeLabel}.xlsx`;

  XLSX.writeFile(wb, filename);
}