"use client";

import { useMemo } from "react";
import { useFinance } from "@/lib/hooks/useFinance";
import { useBudget } from "@/lib/hooks/useBudget";
import CategoryBreakdown from "@/components/analysis/CategoryBreakdown";
import { formatRupiah } from "@/lib/utils/currency";
import { getLocalDateStr } from "@/lib/utils/date";
import { calcMonthTotals } from "@/lib/utils/finance";

export default function MonthOverview() {
  // Pakai tanggal lokal (bukan toISOString) supaya bulan tidak meleset karena UTC
  const monthId = getLocalDateStr().slice(0, 7);
  const { transactions, loading: loadingFinance } = useFinance();
  const { budget, loading: loadingBudget } = useBudget(monthId);

  const monthlyTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(monthId)),
    [transactions, monthId]
  );

  // Hutang/piutang tidak dihitung; sisa bulan lalu dan sisa dibawa sudah diperhitungkan
  const { sisaUang } = calcMonthTotals(transactions, monthId);

  const monthLabel = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="min-w-0 rounded-lg border border-neutral-800 p-4">
        <p className="text-xs text-neutral-500">Sisa Uang Bulan Ini · {monthLabel}</p>
        <p
          className={`break-words text-lg font-semibold ${
            sisaUang < 0 ? "text-red-500" : "text-green-500"
          }`}
        >
          {loadingFinance ? "..." : formatRupiah(sisaUang)}
        </p>
        <p className="mt-1 text-xs text-neutral-600">Pemasukan + sisa bulan lalu − pengeluaran − sisa dibawa</p>
      </div>

      {loadingBudget ? (
        <div className="rounded-lg border border-neutral-800 p-4">
          <p className="text-sm text-neutral-500">Memuat budget...</p>
        </div>
      ) : (
        <CategoryBreakdown budget={budget} transactions={monthlyTransactions} />
      )}
    </div>
  );
}