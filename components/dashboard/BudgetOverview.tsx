"use client";

import { useMemo } from "react";
import { useFinance } from "@/lib/hooks/useFinance";
import { useBudget } from "@/lib/hooks/useBudget";
import CategoryBreakdown from "@/components/analysis/CategoryBreakdown";
import { getLocalDateStr } from "@/lib/utils/date";

// Sisa Budget per Kategori bulan ini (dulu bagian dari MonthOverview)
export default function BudgetOverview() {
  const monthId = getLocalDateStr().slice(0, 7);
  const { transactions } = useFinance();
  const { budget, loading } = useBudget(monthId);

  // Pengambilan tabungan bukan pengeluaran, jangan ikut hitungan budget
  const monthlyTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(monthId) && t.type !== "withdrawal"),
    [transactions, monthId]
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-neutral-800 p-4">
        <p className="text-sm text-neutral-500">Memuat budget...</p>
      </div>
    );
  }

  return <CategoryBreakdown budget={budget} transactions={monthlyTransactions} />;
}