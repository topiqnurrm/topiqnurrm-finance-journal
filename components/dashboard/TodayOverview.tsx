"use client";
 
import { useFinance } from "@/lib/hooks/useFinance";
import { useJournal } from "@/lib/hooks/useJournal";
import { formatRupiah } from "@/lib/utils/currency";
 
export default function TodayOverview() {
  const { transactions, loading: loadingFinance } = useFinance();
  const { entries, loading: loadingJournal } = useJournal();
 
  const today = new Date().toISOString().slice(0, 10);
  const todayTx = transactions.filter((t) => t.date === today);
  const todayEntries = entries.filter((e) => e.date === today);
 
  const income = todayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = todayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
 
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-800 p-4">
          <p className="text-xs text-neutral-500">Pemasukan Hari Ini</p>
          <p className="text-lg font-semibold text-green-500">
            {loadingFinance ? "..." : formatRupiah(income)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800 p-4">
          <p className="text-xs text-neutral-500">Pengeluaran Hari Ini</p>
          <p className="text-lg font-semibold text-red-500">
            {loadingFinance ? "..." : formatRupiah(expense)}
          </p>
        </div>
      </div>
 
      <div className="rounded-lg border border-neutral-800 p-4">
        <p className="mb-2 text-xs text-neutral-500">
          Jurnal Hari Ini ({loadingJournal ? "..." : todayEntries.length})
        </p>
        {todayEntries.length === 0 ? (
          <p className="text-sm text-neutral-600">Belum ada jurnal hari ini.</p>
        ) : (
          <div className="space-y-2">
            {todayEntries.map((entry) => (
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
          Transaksi Hari Ini ({loadingFinance ? "..." : todayTx.length})
        </p>
        {todayTx.length === 0 ? (
          <p className="text-sm text-neutral-600">Belum ada transaksi hari ini.</p>
        ) : (
          <div className="space-y-1.5">
            {todayTx.slice(0, 5).map((t) => (
              <div key={t.id} className="flex justify-between text-sm">
                <span className="text-neutral-400">{t.note || t.category || "Pemasukan"}</span>
                <span className={t.type === "income" ? "text-green-500" : "text-red-500"}>
                  {t.type === "income" ? "+" : "-"}
                  {formatRupiah(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
