"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils/currency";

export interface UsageRow {
  label: string;
  amount: number;
}

interface Totals {
  income: number;
  expense: number; // pengeluaran bersih
}

interface Props {
  month: Totals; // bulan yang dipilih
  all: Totals; // semua bulan
  allGross: number; // pengeluaran kotor semua waktu (sebelum dikurangi pengambilan tabungan)
  allWithdrawal: number; // total diambil dari tabungan / dana darurat / orang have
  usage: UsageRow[]; // pengeluaran semua waktu per kategori
  monthLabel: string;
}

const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
const fmtPct = (n: number) => `${n.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;

export default function MonthlyChart({ month, all, allGross, allWithdrawal, usage, monthLabel }: Props) {
  const [mode, setMode] = useState<"month" | "all">("month");
  const { income, expense } = mode === "month" ? month : all;
  const max = Math.max(income, expense, 1);
  const diff = income - expense;

  const rows = usage.filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount);
  const usageTotal = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 break-words text-sm text-neutral-400">
          Pemasukan vs Pengeluaran {mode === "month" ? monthLabel : "(Semua Waktu)"}
        </p>
        <div className="flex shrink-0 overflow-hidden rounded-md border border-neutral-700 text-xs">
          <button
            type="button"
            onClick={() => setMode("month")}
            className={`px-2 py-1 ${mode === "month" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400"}`}
          >
            Bulan ini
          </button>
          <button
            type="button"
            onClick={() => setMode("all")}
            className={`px-2 py-1 ${mode === "all" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400"}`}
          >
            Semua
          </button>
        </div>
      </div>

      <div className="flex h-40 items-end justify-center gap-6">
        <div className="flex h-full min-w-0 flex-col items-center justify-end">
          <div className="w-16 rounded-t-md bg-green-500" style={{ height: `${(income / max) * 100}%` }} />
          <span className="mt-2 text-xs text-neutral-400">Masuk</span>
          <span className="whitespace-nowrap text-xs text-green-400">{formatRupiah(income)}</span>
        </div>
        <div className="flex h-full min-w-0 flex-col items-center justify-end">
          <div className="w-16 rounded-t-md bg-red-500" style={{ height: `${(expense / max) * 100}%` }} />
          <span className="mt-2 text-xs text-neutral-400">Keluar</span>
          <span className="whitespace-nowrap text-xs text-red-400">{formatRupiah(expense)}</span>
        </div>
      </div>

      <p className="text-center text-xs text-neutral-500">
        Selisih{" "}
        <span className={diff >= 0 ? "text-green-400" : "text-red-400"}>
          {diff > 0 ? "+" : diff < 0 ? "−" : ""}
          {formatRupiah(Math.abs(diff))}
        </span>
        {mode === "all" && " · tanpa hutang/piutang & sisa bulan lalu"}
      </p>

      {mode === "all" && (
        <div className="space-y-3 border-t border-neutral-800 pt-3">
          <p className="text-sm text-neutral-300">Uang dipakai untuk apa saja</p>
          <p className="text-xs text-neutral-500">
            Persen kiri = bagian dari total pengeluaran. Persen kanan = bagian dari total pemasukan ({formatRupiah(income)}).
          </p>

          {rows.length === 0 ? (
            <p className="text-sm text-neutral-500">Belum ada pengeluaran.</p>
          ) : (
            rows.map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="min-w-0 break-words text-neutral-300">{r.label}</span>
                  <span className="shrink-0 text-neutral-200">{formatRupiah(r.amount)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, pct(r.amount, usageTotal))}%` }} />
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {fmtPct(pct(r.amount, usageTotal))} dari pengeluaran · {fmtPct(pct(r.amount, income))} dari pemasukan
                </p>
              </div>
            ))
          )}

          <div className="space-y-1 rounded-lg border border-neutral-800 p-3 text-xs text-neutral-400">
            <div className="flex justify-between gap-2">
              <span>Total pengeluaran</span>
              <span className="text-neutral-200">{formatRupiah(allGross)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Diambil dari tabungan / dana darurat / Orang Have</span>
              <span className="text-green-400">− {formatRupiah(allWithdrawal)}</span>
            </div>
            <div className="flex justify-between gap-2 border-t border-neutral-800 pt-1">
              <span>Pengeluaran bersih</span>
              <span className="text-red-400">
                {formatRupiah(all.expense)} ({fmtPct(pct(all.expense, income))} dari pemasukan)
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Sisa dari pemasukan</span>
              <span className={income - all.expense >= 0 ? "text-green-400" : "text-red-400"}>
                {formatRupiah(income - all.expense)} ({fmtPct(pct(income - all.expense, income))})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}