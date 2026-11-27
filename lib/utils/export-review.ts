import * as XLSX from "xlsx";
import { CARRYOVER_LABEL } from "@/lib/types/finance";
import type { ReviewItem } from "@/components/review/types";

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

export interface ReviewExportFilters {
  search: string;
  kind: "all" | "transaction" | "journal";
  categoryLabel: string; // "Semua kategori" kalau tidak difilter
  from: string;
  to: string;
  showChecked: boolean;
  auditDate: string | null;
  includeOld: boolean; // false = data hanya dimuat sejak tanggal audit
}

const KIND_LABEL = { all: "Semua (Transaksi + Jurnal)", transaction: "Transaksi", journal: "Jurnal" } as const;

// Export persis hasil filter Review Detail (semua halaman, bukan hanya yang tampil di layar).
export function exportReviewToExcel(items: ReviewItem[], f: ReviewExportFilters) {
  const byDate = (a: { date: string; createdAt: number }, b: { date: string; createdAt: number }) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.createdAt - b.createdAt;

  const tx = items.filter((i): i is Extract<ReviewItem, { kind: "transaction" }> => i.kind === "transaction").sort(byDate);
  const jr = items.filter((i): i is Extract<ReviewItem, { kind: "journal" }> => i.kind === "journal").sort(byDate);

  const txRows = tx.map((t) => ({
    Tanggal: t.date,
    Tipe:
      t.txType === "carryover"
        ? "Sisa Bulan"
        : t.txType === "withdrawal"
        ? "Ambil Tabungan"
        : t.txType === "income"
        ? "Pemasukan"
        : "Pengeluaran",
    Kategori:
      t.txType === "carryover" ? CARRYOVER_LABEL : t.category ? CATEGORY_LABELS[t.category] ?? t.category : "-",
    Jumlah: t.amount,
    Catatan: t.note || "-",
  }));

  const jrRows = jr.map((j) => ({ Tanggal: j.date, Kategori: j.categoryLabel, Isi: j.content }));

  // Sama seperti Export biasa: hutang/piutang, sisa bulan, dan pengambilan tabungan tidak dihitung
  const counted = tx.filter((t) => t.category !== "hutang" && t.txType !== "carryover" && t.txType !== "withdrawal");
  const income = counted.filter((t) => t.txType === "income").reduce((s, t) => s + t.amount, 0);
  const expense = counted.filter((t) => t.txType === "expense").reduce((s, t) => s + t.amount, 0);

  const range = f.from || f.to ? `${f.from || "awal"} s/d ${f.to || "akhir"}` : "Semua tanggal";
  const summary: { Ringkasan: string; Nilai: string | number }[] = [
    { Ringkasan: "EXPORT REVIEW DETAIL (sesuai filter)", Nilai: "" },
    { Ringkasan: "Pencarian", Nilai: f.search.trim() || "-" },
    { Ringkasan: "Jenis", Nilai: KIND_LABEL[f.kind] },
    { Ringkasan: "Kategori", Nilai: f.categoryLabel },
    { Ringkasan: "Rentang tanggal", Nilai: range },
    ...(f.auditDate
      ? [
          { Ringkasan: "Tampilkan juga yang sudah dicek (hijau)", Nilai: f.showChecked ? "Ya" : "Tidak" },
          {
            Ringkasan: "Cakupan data",
            Nilai: f.includeOld ? "Termasuk sebelum tanggal audit" : `Hanya sejak tanggal audit (${f.auditDate})`,
          },
        ]
      : []),
    { Ringkasan: "", Nilai: "" },
    { Ringkasan: "Total Pemasukan (tanpa hutang/piutang & sisa bulan)", Nilai: income },
    { Ringkasan: "Total Pengeluaran (tanpa hutang/piutang & sisa bulan)", Nilai: expense },
    { Ringkasan: "Selisih", Nilai: income - expense },
    { Ringkasan: "Jumlah Transaksi", Nilai: txRows.length },
    { Ringkasan: "Jumlah Jurnal", Nilai: jrRows.length },
  ];

  const wb = XLSX.utils.book_new();
  const sheet = (rows: Record<string, string | number>[], empty: Record<string, string>, widths: number[]) => {
    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [empty]);
    ws["!cols"] = widths.map((wch) => ({ wch }));
    return ws;
  };

  const sumSheet = XLSX.utils.json_to_sheet(summary);
  sumSheet["!cols"] = [{ wch: 58 }, { wch: 34 }];
  XLSX.utils.book_append_sheet(wb, sumSheet, "Ringkasan");

  if (f.kind !== "journal") {
    XLSX.utils.book_append_sheet(
      wb,
      sheet(txRows, { Tanggal: "", Tipe: "", Kategori: "", Jumlah: "", Catatan: "Tidak ada data" }, [12, 16, 28, 14, 50]),
      "Transaksi"
    );
  }
  if (f.kind !== "transaction") {
    XLSX.utils.book_append_sheet(
      wb,
      sheet(jrRows, { Tanggal: "", Kategori: "", Isi: "Tidak ada data" }, [12, 24, 80]),
      "Jurnal"
    );
  }

  const rangeLabel = f.from || f.to ? `${f.from || "awal"}_sd_${f.to || "akhir"}` : "semua-tanggal";
  const kindLabel = f.kind === "all" ? "" : `_${f.kind === "transaction" ? "transaksi" : "jurnal"}`;
  XLSX.writeFile(wb, `review-detail${kindLabel}_${rangeLabel}.xlsx`);
}