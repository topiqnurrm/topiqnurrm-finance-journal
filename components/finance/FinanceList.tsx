"use client";
 
import { useFinance } from "@/lib/hooks/useFinance";
import { formatRupiah } from "@/lib/utils/currency";
import { EXPENSE_CATEGORIES } from "@/lib/types/finance";
 
export default function FinanceList({ isOwner }: { isOwner: boolean }) {
  const { transactions, loading, removeTransaction } = useFinance();
 
  if (loading) return <p className="text-sm text-neutral-500">Memuat...</p>;
  if (transactions.length === 0)
    return <p className="text-sm text-neutral-500">Belum ada transaksi.</p>;
 
  return (
    <div className="space-y-2">
      {transactions.map((t) => {
        const categoryLabel = EXPENSE_CATEGORIES.find((c) => c.value === t.category)?.label;
        return (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-md border border-neutral-800 p-3"
          >
            <div>
              <p className="text-sm font-medium">
                {t.type === "income" ? "Pemasukan" : categoryLabel}
              </p>
              <p className="text-xs text-neutral-500">
                {t.date} {t.note && `· ${t.note}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-semibold ${
                  t.type === "income" ? "text-green-500" : "text-red-500"
                }`}
              >
                {t.type === "income" ? "+" : "-"}
                {formatRupiah(t.amount)}
              </span>
              {isOwner && (
                <button
                  onClick={() => t.id && removeTransaction(t.id)}
                  className="text-xs text-neutral-500 hover:text-red-500"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
