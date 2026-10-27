"use client";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFinance } from "@/lib/hooks/useFinance";
import { useBudget } from "@/lib/hooks/useBudget";
import BudgetForm from "@/components/analysis/BudgetForm";
import MonthlyChart from "@/components/analysis/MonthlyChart";
import CategoryBreakdown from "@/components/analysis/CategoryBreakdown";
import { formatRupiah } from "@/lib/utils/currency";
import BackButton from "@/components/ui/BackButton";

function getCurrentMonthId() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(monthId: string, delta: number) {
  const [y, m] = monthId.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthId: string) {
  const [y, m] = monthId.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export default function AnalysisPage() {
  const { isOwner } = useAuth();
  const [monthId, setMonthId] = useState(getCurrentMonthId());
  const { transactions } = useFinance();
  const { budget, loading, saveBudget } = useBudget(monthId);

  const monthlyTransactions = useMemo(
    () => transactions.filter((f) => f.date.startsWith(monthId)),
    [transactions, monthId]
  );
  const totalIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const totalBudgetAllocated = budget
    ? (budget.kehidupan ?? 0) +
      (budget.mendadak ?? 0) +
      (budget.tabungan ?? 0) +
      (budget.foya_foya ?? 0) +
      (budget.grooming ?? 0) +
      (budget.dana_darurat ?? 0) +
      (budget.audit ?? 0)
    : 0;
  const sisaBudget = totalIncome - totalBudgetAllocated;
  const sisaUang = totalIncome - totalExpense;

  // Total terkumpul kumulatif sampai akhir bulan yang dipilih:
  // semua transaksi dengan bulan <= monthId (format YYYY-MM bisa dibandingkan sebagai string)
  const totalTabungan = transactions
    .filter((t) => t.type === "expense" && t.category === "tabungan" && t.date.slice(0, 7) <= monthId)
    .reduce((s, t) => s + t.amount, 0);
  const totalDanaDarurat = transactions
    .filter((t) => t.type === "expense" && t.category === "dana_darurat" && t.date.slice(0, 7) <= monthId)
    .reduce((s, t) => s + t.amount, 0);

  const isCurrentMonth = monthId === getCurrentMonthId();

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 overflow-x-hidden">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-semibold text-white">Analisis</h1>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setMonthId((m) => shiftMonth(m, -1))}
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white"
          aria-label="Bulan sebelumnya"
        >
          ‹
        </button>
        <span className="text-sm text-neutral-300 w-32 text-center capitalize">
          {formatMonthLabel(monthId)}
        </span>
        <button
          onClick={() => setMonthId((m) => shiftMonth(m, 1))}
          disabled={isCurrentMonth}
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Bulan berikutnya"
        >
          ›
        </button>
      </div>

      {!isCurrentMonth && (
        <div className="text-center">
          <button
            onClick={() => setMonthId(getCurrentMonthId())}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            ← Kembali ke bulan ini
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 min-w-0">
          <p className="text-sm text-neutral-400">Pemasukan Bulan Ini</p>
          <p className="text-lg font-semibold text-green-400 break-words">
            {formatRupiah(totalIncome)}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 min-w-0">
          <p className="text-sm text-neutral-400">Pengeluaran Bulan Ini</p>
          <p className="text-lg font-semibold text-red-400 break-words">
            {formatRupiah(totalExpense)}
          </p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 min-w-0">
        <p className="text-sm text-neutral-400">Sisa Uang (Pemasukan − Pengeluaran)</p>
        <p className={`text-lg font-semibold break-words ${sisaUang < 0 ? "text-red-400" : "text-green-400"}`}>
          {formatRupiah(sisaUang)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 min-w-0">
          <p className="text-sm text-neutral-400">Total Tabungan</p>
          <p className="text-lg font-semibold text-blue-400 break-words">
            {formatRupiah(totalTabungan)}
          </p>
          <p className="mt-1 text-xs text-neutral-600">Terkumpul sampai akhir {formatMonthLabel(monthId)}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 min-w-0">
          <p className="text-sm text-neutral-400">Total Dana Darurat</p>
          <p className="text-lg font-semibold text-blue-400 break-words">
            {formatRupiah(totalDanaDarurat)}
          </p>
          <p className="mt-1 text-xs text-neutral-600">Terkumpul sampai akhir {formatMonthLabel(monthId)}</p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 min-w-0">
        <p className="text-sm text-neutral-400">Sisa (Pemasukan − Total Budget)</p>
        <p className={`text-lg font-semibold break-words ${sisaBudget < 0 ? "text-red-400" : "text-green-400"}`}>
          {formatRupiah(sisaBudget)}
        </p>
      </div>

      {/* Form set budget hanya untuk owner; read-only tidak melihatnya sama sekali */}
      {isOwner && !loading && (
        <BudgetForm key={monthId} monthId={monthId} initialBudget={budget} onSave={saveBudget} />
      )}

      <MonthlyChart transactions={monthlyTransactions} />
      <CategoryBreakdown budget={budget} transactions={monthlyTransactions} />
    </div>
  );
}