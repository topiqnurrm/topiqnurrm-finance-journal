"use client";

import { useMemo, useState } from "react";
import { OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { formatRupiah } from "@/lib/utils/currency";
import { OhHistoryKind, buildHistory, monthLabelLong } from "@/lib/orang-have/calc";
import { OhProofKind } from "@/lib/orang-have/config";
import OhProofLink from "./OhProofLink";
import OhPager, { usePaged } from "./OhPager";

interface Props {
  members: (OhMember & { id: string })[];
  payments: OhPayment[];
  expenses: OhKasExpense[];
  loans: OhLoan[];
}

const KIND_LABEL: Record<OhHistoryKind, string> = {
  setoran: "Setoran",
  kas: "Kas keluar",
  audit: "Audit",
  pinjam: "Pinjam",
  lunas: "Lunas",
};
const KIND_BADGE: Record<OhHistoryKind, string> = {
  setoran: "bg-green-950/40 text-green-400 border-green-800",
  kas: "bg-red-950/40 text-red-400 border-red-800",
  audit: "bg-purple-950 text-purple-300 border-purple-600",
  pinjam: "bg-amber-950/30 text-amber-400 border-amber-700",
  lunas: "bg-blue-950 text-blue-300 border-blue-500",
};
const PROOF_KIND: Record<OhHistoryKind, OhProofKind> = {
  setoran: "nabung",
  kas: "kas",
  audit: "audit",
  pinjam: "pinjaman",
  lunas: "lunas",
};

type Filter = "semua" | OhHistoryKind;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "setoran", label: "Setoran" },
  { id: "kas", label: "Kas keluar" },
  { id: "audit", label: "Audit" },
  { id: "pinjam", label: "Pinjam" },
  { id: "lunas", label: "Lunas" },
];

export default function OhHistory({ members, payments, expenses, loans }: Props) {
  const [filter, setFilter] = useState<Filter>("semua");
  const [month, setMonth] = useState("semua");

  // saldo berjalan dihitung dari SEMUA data, supaya angka saldo tetap benar walau daftar difilter
  const all = useMemo(() => buildHistory(members, payments, expenses, loans), [members, payments, expenses, loans]);
  const months = useMemo(() => Array.from(new Set(all.map((i) => i.date.slice(0, 7)))).sort().reverse(), [all]);

  const shown = useMemo(
    () =>
      all
        .filter((i) => (filter === "semua" ? true : i.kind === filter))
        .filter((i) => (month === "semua" ? true : i.date.startsWith(month)))
        .reverse(), // terbaru di atas
    [all, filter, month]
  );

  const pg = usePaged(shown, `${filter}|${month}`);

  const masuk = shown.filter((i) => i.delta > 0).reduce((s, i) => s + i.delta, 0);
  const keluar = shown.filter((i) => i.delta < 0).reduce((s, i) => s + i.delta, 0);
  const saldoAkhir = all.length ? all[all.length - 1].balance : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          <p className="text-xs text-neutral-400">Uang masuk</p>
          <p className="break-words text-sm font-semibold text-green-500">{formatRupiah(masuk)}</p>
        </div>
        <div className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          <p className="text-xs text-neutral-400">Uang keluar</p>
          <p className="break-words text-sm font-semibold text-red-500">{formatRupiah(Math.abs(keluar))}</p>
        </div>
        <div className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          <p className="text-xs text-neutral-400">Uang aktual</p>
          <p className="break-words text-sm font-semibold text-white">{formatRupiah(saldoAkhir)}</p>
        </div>
      </div>

      <div ref={pg.topRef} className="min-w-0 scroll-mt-4 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">History keseluruhan</h2>
          <p className="text-xs text-neutral-500">{shown.length} catatan</p>
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-md px-3 py-1 text-xs ${
                filter === f.id ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
        >
          <option value="semua">Semua bulan</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabelLong(m)}
            </option>
          ))}
        </select>

        {shown.length === 0 ? (
          <p className="text-sm text-neutral-500">Belum ada catatan.</p>
        ) : (
          pg.pageItems.map((i) => (
            <div key={i.key} className="space-y-1 border-t border-neutral-800 pt-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] ${KIND_BADGE[i.kind]}`}>
                      {KIND_LABEL[i.kind]}
                    </span>
                    <span className="text-xs text-neutral-500">{i.date}</span>
                  </div>
                  <p className="mt-1 break-words text-sm text-white">{i.title}</p>
                  <p className="break-words text-xs text-neutral-500">{i.detail}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-semibold ${i.delta >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {i.delta >= 0 ? "+" : "−"}
                    {formatRupiah(Math.abs(i.delta))}
                  </p>
                  <p className="text-xs text-neutral-600">Saldo {formatRupiah(i.balance)}</p>
                </div>
              </div>
              <OhProofLink proof={i.proof} kind={PROOF_KIND[i.kind]} />
            </div>
          ))
        )}
        <OhPager {...pg} />
      </div>
    </div>
  );
}