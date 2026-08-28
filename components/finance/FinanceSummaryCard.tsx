"use client";
 
import { useFinance } from "@/lib/hooks/useFinance";
import { formatRupiah } from "@/lib/utils/currency";
 
export default function FinanceSummaryCard() {
  const { transactions } = useFinance();
  const today = new Date().toISOString().slice(0, 10);
  const todayTx = transactions.filter((t) => t.date === today);
 
  const income = todayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = todayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
 
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-neutral-800 p-4">
        <p className="text-xs text-neutral-500">Pemasukan Hari Ini</p>
        <p className="text-lg font-semibold text-green-500">{formatRupiah(income)}</p>
      </div>
      <div className="rounded-lg border border-neutral-800 p-4">
        <p className="text-xs text-neutral-500">Pengeluaran Hari Ini</p>
        <p className="text-lg font-semibold text-red-500">{formatRupiah(expense)}</p>
      </div>
    </div>
  );
}
