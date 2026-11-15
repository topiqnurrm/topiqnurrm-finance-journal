"use client";

import { useState } from "react";
import { OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { exportOrangHave, exportOrangHaveJson } from "@/lib/utils/export-orang-have";

interface Props {
  members: (OhMember & { id: string })[];
  payments: OhPayment[];
  expenses: OhKasExpense[];
  loans: OhLoan[];
}

export default function OhExport({ members, payments, expenses, loans }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const data = { members, payments, expenses, loans };

  function handleExcel() {
    if (from && to && from > to) {
      window.alert("Tanggal awal tidak boleh setelah tanggal akhir.");
      return;
    }
    exportOrangHave({ ...data, from: from || undefined, to: to || undefined });
  }

  return (
    <div className="space-y-4">
      <div className="min-w-0 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-semibold text-white">Export ke Excel</h2>
        <p className="text-xs text-neutral-500">
          Berisi sheet Ringkasan, Anggota, Setoran, Matriks Setoran, Kas, Pinjaman, dan History. Kosongkan tanggal untuk
          mengekspor semua data. Sheet Ringkasan dan Anggota selalu memakai seluruh data.
        </p>
        <label className="block text-xs text-neutral-500">
          Dari tanggal (opsional)
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
          />
        </label>
        <label className="block text-xs text-neutral-500">
          Sampai tanggal (opsional)
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
          />
        </label>
        <button onClick={handleExcel} className="w-full rounded-md bg-green-600 py-2 text-sm font-medium text-white">
          Download Excel
        </button>
      </div>

      <div className="min-w-0 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-semibold text-white">Cadangan data (JSON)</h2>
        <p className="text-xs text-neutral-500">Salinan mentah semua data Tabungan Bersama, untuk arsip atau pemulihan.</p>
        <button
          onClick={() => exportOrangHaveJson(data)}
          className="w-full rounded-md bg-neutral-700 py-2 text-sm font-medium text-white"
        >
          Download JSON
        </button>
      </div>

      <p className="text-xs text-neutral-600">
        Gambar bukti tidak ikut terekspor. Yang tercatat hanya nama filenya; gambarnya tetap ada di folder
        public/tabungan-bersama.
      </p>
    </div>
  );
}