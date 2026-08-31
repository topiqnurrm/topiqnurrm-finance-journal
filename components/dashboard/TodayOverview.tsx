"use client";

import { useState } from "react";
import { useFinance } from "@/lib/hooks/useFinance";
import { useJournal } from "@/lib/hooks/useJournal";
import { formatRupiah } from "@/lib/utils/currency";
import { getLocalDateStr, shiftDate } from "@/lib/utils/date";

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function TodayOverview() {
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const { transactions, loading: loadingFinance } = useFinance();
  const { entries, loading: loadingJournal } = useJournal();

  const today = getLocalDateStr();
  const isToday = selectedDate === today;

  const dayTx = transactions.filter((t) => t.date === selectedDate);
  const dayEntries = entries.filter((e) => e.date === selectedDate);

  const income = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-neutral-800 p-3">
        <button
          onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white"
          aria-label="Hari sebelumnya"
        >
          ‹
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm text-neutral-200 capitalize">{formatDateLabel(selectedDate)}</span>
          {isToday && <span className="text-xs text-blue-400">Hari ini</span>}
        </div>
        <button
          onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
          disabled={isToday}
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Hari berikutnya"
        >
          ›
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex-1 min-w-0 bg-neutral-800 rounded-lg px-3 py-2 text-sm text-white"
        />
        {!isToday && (
          <button
            onClick={() => setSelectedDate(today)}
            className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
          >
            ← Hari ini
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-800 p-4">
          <p className="text-xs text-neutral-500">Pemasukan</p>
          <p className="text-lg font-semibold text-green-500">
            {loadingFinance ? "..." : formatRupiah(income)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800 p-4">
          <p className="text-xs text-neutral-500">Pengeluaran</p>
          <p className="text-lg font-semibold text-red-500">
            {loadingFinance ? "..." : formatRupiah(expense)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-800 p-4">
        <p className="mb-2 text-xs text-neutral-500">
          Jurnal ({loadingJournal ? "..." : dayEntries.length})
        </p>
        {dayEntries.length === 0 ? (
          <p className="text-sm text-neutral-600">Belum ada jurnal di tanggal ini.</p>
        ) : (
          <div className="space-y-2">
            {dayEntries.map((entry) => (
              <div key={entry.id} className="border-l-2 border-neutral-700 pl-3">
                <span className="text-xs text-neutral-500">{entry.categoryName}</span>
                <p className="line-clamp-2 text-sm text-neutral-200">{entry.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-neutral-800 p-4">
        <p className="mb-2 text-xs text-neutral-500">
          Transaksi ({loadingFinance ? "..." : dayTx.length})
        </p>
        {dayTx.length === 0 ? (
          <p className="text-sm text-neutral-600">Belum ada transaksi di tanggal ini.</p>
        ) : (
          <div className="space-y-2">
            {dayTx.slice(0, 5).map((t) => (
              <div key={t.id} className="border-l-2 border-neutral-700 pl-3 flex justify-between text-sm">
                <span className="text-neutral-400">{t.note || t.category || "Pemasukan"}</span>
                <span className={t.type === "income" ? "text-green-500" : "text-red-500"}>
                  {t.type === "income" ? "+" : "-"}
                  {formatRupiah(t.amount)}
                </span>
              </div>
            ))}
            {dayTx.length > 5 && (
              <p className="text-xs text-neutral-600 pt-1">
                +{dayTx.length - 5} transaksi lainnya, lihat di halaman Transaksi.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}