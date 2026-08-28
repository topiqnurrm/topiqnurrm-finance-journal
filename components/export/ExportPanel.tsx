"use client";
import { useState } from "react";
import { useFinance } from "@/lib/hooks/useFinance";
import { useJournal } from "@/lib/hooks/useJournal";
import { exportToExcel } from "@/lib/utils/export-excel";

export default function ExportPanel() {
  const { transactions } = useFinance();
  const { entries: journals } = useJournal();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleExportRange = () => {
    setExporting(true);
    try {
      exportToExcel({ transactions, journals, from: from || undefined, to: to || undefined });
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = () => {
    setExporting(true);
    try {
      exportToExcel({ transactions, journals });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
      <p className="text-sm text-neutral-400">Export berdasarkan rentang tanggal</p>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-neutral-500 block mb-1">Dari</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full bg-neutral-800 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-neutral-500 block mb-1">Sampai</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-neutral-800 rounded-lg px-3 py-2 text-white"
          />
        </div>
      </div>

      <button
        onClick={handleExportRange}
        disabled={exporting || (!from && !to)}
        className="w-full bg-blue-600 hover:bg-blue-500 rounded-lg py-2 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {exporting ? "Mengekspor..." : "Export Rentang Tanggal"}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-800" />
        <span className="text-xs text-neutral-500">atau</span>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>

      <button
        onClick={handleExportAll}
        disabled={exporting}
        className="w-full bg-neutral-700 hover:bg-neutral-600 rounded-lg py-2 text-white font-medium disabled:opacity-40"
      >
        {exporting ? "Mengekspor..." : "Export Semua Data"}
      </button>

      <p className="text-xs text-neutral-500">
        File .xlsx akan berisi 3 sheet: Ringkasan, Transaksi, dan Jurnal.
      </p>
    </div>
  );
}