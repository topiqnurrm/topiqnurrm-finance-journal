import { formatRupiah } from "@/lib/utils/currency";
import { Transaction } from "@/lib/types/finance";
 
export default function MonthlyChart({ transactions }: { transactions: Transaction[] }) {
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const max = Math.max(income, expense, 1);
 
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
      <p className="text-sm text-neutral-400">Pemasukan vs Pengeluaran Bulan Ini</p>
      <div className="flex items-end gap-6 h-40">
        <div className="flex flex-col items-center justify-end h-full">
          <div className="w-16 bg-green-500 rounded-t-md" style={{ height: `${(income / max) * 100}%` }} />
          <span className="text-xs text-neutral-400 mt-2">Masuk</span>
          <span className="text-xs text-green-400">{formatRupiah(income)}</span>
        </div>
        <div className="flex flex-col items-center justify-end h-full">
          <div className="w-16 bg-red-500 rounded-t-md" style={{ height: `${(expense / max) * 100}%` }} />
          <span className="text-xs text-neutral-400 mt-2">Keluar</span>
          <span className="text-xs text-red-400">{formatRupiah(expense)}</span>
        </div>
      </div>
    </div>
  );
}
