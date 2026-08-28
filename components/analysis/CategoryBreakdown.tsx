import { formatRupiah } from "@/lib/utils/currency";
import { Budget, Transaction } from "@/lib/types/finance";
 
const CATEGORIES = ["kehidupan", "mendadak", "tabungan", "foya_foya"] as const;
const LABELS: Record<string, string> = { kehidupan: "Kehidupan", mendadak: "Mendadak", tabungan: "Tabungan", foya_foya: "Foya-foya" };
 
export default function CategoryBreakdown({ budget, transactions }: { budget: Budget | null; transactions: Transaction[] }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
      <p className="text-sm text-neutral-400">Sisa Budget per Kategori</p>
      {CATEGORIES.map((cat) => {
        const limit = budget?.[cat] ?? 0;
        const used = transactions.filter((t) => t.type === "expense" && t.category === cat).reduce((s, t) => s + t.amount, 0);
        const remaining = limit - used;
        const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
        const isOver = remaining < 0;
        return (
          <div key={cat}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-neutral-300">{LABELS[cat]}</span>
              <span className={isOver ? "text-red-400" : "text-green-400"}>{formatRupiah(remaining)}</span>
            </div>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div className={`h-full ${isOver ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-neutral-500 mt-1">Terpakai {formatRupiah(used)} dari {formatRupiah(limit)}</p>
          </div>
        );
      })}
    </div>
  );
}
