"use client";

import { useFinance } from "@/lib/hooks/useFinance";
import { formatRupiah } from "@/lib/utils/currency";
import { getLocalDateStr } from "@/lib/utils/date";
import { calcMonthTotals } from "@/lib/utils/finance";

// Hanya kartu Sisa Uang. "Sisa Budget per Kategori" dipindah ke BudgetOverview (paling bawah dashboard).
export default function MonthOverview() {
  // Pakai tanggal lokal (bukan toISOString) supaya bulan tidak meleset karena UTC
  const monthId = getLocalDateStr().slice(0, 7);
  const { transactions, loading: loadingFinance } = useFinance();

  // Hutang/piutang tidak dihitung; sisa bulan lalu, sisa dibawa, dan ambil tabungan sudah diperhitungkan
  const { sisaUang } = calcMonthTotals(transactions, monthId);

  const monthLabel = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="min-w-0 rounded-lg border border-neutral-800 p-4">
      <p className="text-xs text-neutral-500">Sisa Uang Bulan Ini · {monthLabel}</p>
      <p
        className={`break-words text-lg font-semibold ${
          sisaUang < 0 ? "text-red-500" : "text-green-500"
        }`}
      >
        {loadingFinance ? "..." : formatRupiah(sisaUang)}
      </p>
      <p className="mt-1 text-xs text-neutral-600">
        Pemasukan + sisa bulan lalu + ambil tabungan − pengeluaran − sisa dibawa
      </p>
    </div>
  );
}