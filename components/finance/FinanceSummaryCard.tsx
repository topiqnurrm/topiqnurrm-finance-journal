"use client";

import { useFinance } from "@/lib/hooks/useFinance";
import { formatRupiah } from "@/lib/utils/currency";
import { getLocalDateStr } from "@/lib/utils/date";
import { sumIncomeExpense } from "@/lib/utils/finance";

export default function FinanceSummaryCard() {
  const { transactions, loading } = useFinance();
  const today = getLocalDateStr();

  // Hutang/piutang tidak dihitung sebagai pemasukan maupun pengeluaran
  const { income, expense } = sumIncomeExpense(transactions.filter((t) => t.date === today));

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="min-w-0 rounded-lg border border-neutral-800 p-4">
        <p className="text-xs text-neutral-500">Pemasukan Hari Ini</p>
        <p className="break-words text-lg font-semibold text-green-500">
          {loading ? "..." : formatRupiah(income)}
        </p>
      </div>
      <div className="min-w-0 rounded-lg border border-neutral-800 p-4">
        <p className="text-xs text-neutral-500">Pengeluaran Hari Ini</p>
        <p className="break-words text-lg font-semibold text-red-500">
          {loading ? "..." : formatRupiah(expense)}
        </p>
      </div>
    </div>
  );
}