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
import AssetNotes from "@/components/analysis/AssetNotes";
import ActualMoneyChart from "@/components/analysis/ActualMoneyChart";
import { calcDebtBalance, calcMonthTotals, calcSavingsBalance } from "@/lib/utils/finance";

// Pembungkus satu kategori: judul + isi
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {hint && <p className="min-w-0 break-words text-right text-xs capitalize text-neutral-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// Satu angka di dalam kategori
function Stat({
  label,
  value,
  tone,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  tone: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-lg border border-neutral-800 p-3 ${className}`}>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`break-words text-lg font-semibold ${tone}`}>{value}</p>
      {hint && <p className="mt-1 break-words text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}

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
    // pengambilan tabungan bukan pengeluaran, jangan ikut hitungan budget/kategori
    () => transactions.filter((f) => f.date.startsWith(monthId) && f.type !== "withdrawal"),
    [transactions, monthId]
  );
  // Hutang/piutang tidak dihitung; sisa bulan lalu otomatis jadi pemasukan bulan ini
  const {
    income: totalIncome,
    expense: totalExpense,
    carryIn,
    carryOut,
    withdrawal,
    sisaUang,
  } = calcMonthTotals(transactions, monthId);

  const totalBudgetAllocated = budget
    ? (budget.kehidupan ?? 0) +
      (budget.mendadak ?? 0) +
      (budget.tabungan ?? 0) +
      (budget.foya_foya ?? 0) +
      (budget.grooming ?? 0) +
      (budget.dana_darurat ?? 0) +
      (budget.tabungan_oh ?? 0) +
      (budget.audit ?? 0)
    : 0;
  // Semua uang masuk bulan ini = pemasukan + sisa bulan lalu + diambil dari tabungan / dana darurat
  const totalDana = totalIncome + carryIn + withdrawal;
  const sisaBudget = totalDana - totalBudgetAllocated;

  // Piutang belum lunas, kumulatif sampai akhir bulan yang dipilih
  const piutang = calcDebtBalance(transactions, monthId);

  // Total terkumpul kumulatif sampai akhir bulan yang dipilih:
  // semua transaksi dengan bulan <= monthId (format YYYY-MM bisa dibandingkan sebagai string)
  // dikurangi pengambilan (jenis "Ambil Tabungan")
  const {
    tabungan: totalTabungan,
    danaDarurat: totalDanaDarurat,
    tabunganOh: totalTabunganOh,
  } = calcSavingsBalance(
    transactions,
    monthId
  );

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

      {/* 1. Ringkasan bulan ini */}
      <Section title="Bulan Ini" hint={formatMonthLabel(monthId)}>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Pemasukan" value={formatRupiah(totalIncome)} tone="text-green-400" />
          <Stat label="Pengeluaran" value={formatRupiah(totalExpense)} tone="text-red-400" />
          <Stat
            className="col-span-2"
            label="Sisa Uang Bulan Ini"
            value={formatRupiah(sisaUang)}
            tone={sisaUang < 0 ? "text-red-400" : "text-green-400"}
            hint={
              carryIn !== 0 || carryOut !== 0 || withdrawal !== 0
                ? "Pemasukan + sisa bulan lalu + ambil tabungan − pengeluaran − sisa dibawa"
                : "Pemasukan − Pengeluaran"
            }
          />
          <Stat
            className="col-span-2"
            label="Piutang"
            value={`${piutang > 0 ? "+" : ""}${formatRupiah(piutang)}`}
            tone={piutang > 0 ? "text-green-400" : piutang < 0 ? "text-red-400" : "text-neutral-300"}
            hint="+ orang lain berhutang ke kamu, − kamu berhutang (tidak dihitung di sisa uang)"
          />
        </div>
      </Section>

      {/* 2. Sisa antar bulan */}
      <Section title="Sisa Antar Bulan">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Sisa Bulan Lalu" value={formatRupiah(carryIn)} tone="text-sky-400" hint="Dibawa dari bulan sebelumnya" />
          <Stat label="Dibawa ke Bulan Depan" value={formatRupiah(carryOut)} tone="text-sky-400" hint="Bukan pengeluaran" />
        </div>
      </Section>

      {/* 3. Tabungan & dana (kumulatif) */}
      <Section title="Tabungan & Dana" hint={`Total sampai akhir ${formatMonthLabel(monthId)}`}>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total Tabungan" value={formatRupiah(totalTabungan)} tone="text-blue-400" hint="Setoran − pengambilan" />
          <Stat label="Total Dana Darurat" value={formatRupiah(totalDanaDarurat)} tone="text-blue-400" hint="Setoran − pengambilan" />
          <Stat
            className="col-span-2"
            label="Total Tabungan Orang Have"
            value={formatRupiah(totalTabunganOh)}
            tone="text-indigo-400"
            hint="Setoran − pengambilan"
          />
        </div>
      </Section>

      {/* 4. Pengambilan & sisa terhadap budget */}
      <Section title="Pengambilan & Sisa Budget">
        <div className="grid grid-cols-1 gap-3">
          <Stat
            label="Diambil dari Tabungan / Dana Darurat / Orang Have"
            value={formatRupiah(withdrawal)}
            tone="text-amber-400"
            hint="Menambah uang bulan ini, bukan pemasukan"
          />
          <Stat
            label="Sisa (Semua Pemasukan − Total Budget)"
            value={formatRupiah(sisaBudget)}
            tone={sisaBudget < 0 ? "text-red-400" : "text-green-400"}
            hint={`Pemasukan ${formatRupiah(totalIncome)} + sisa bulan lalu ${formatRupiah(carryIn)} + ambil tabungan/dana darurat/orang have ${formatRupiah(withdrawal)} = ${formatRupiah(totalDana)}; dikurangi total budget ${formatRupiah(totalBudgetAllocated)}`}
          />
        </div>
      </Section>

      {/* 5. Uang aktual yang dipegang */}
      <Section title="Uang Aktual yang Dipegang" hint="Sisa uang bulan ini + dana darurat">
        <ActualMoneyChart sisaUang={sisaUang} danaDarurat={totalDanaDarurat} monthLabel={formatMonthLabel(monthId)} />
      </Section>

      {/* Form set budget hanya untuk owner; read-only tidak melihatnya sama sekali */}
      {isOwner && !loading && (
        <BudgetForm key={monthId} monthId={monthId} initialBudget={budget} onSave={saveBudget} />
      )}

      <MonthlyChart income={totalIncome} expense={totalExpense} />
      <CategoryBreakdown budget={budget} transactions={monthlyTransactions} />

      {/* Catatan aset: tidak terikat bulan; hanya owner yang bisa menambah/ubah */}
      <AssetNotes isOwner={isOwner} />
    </div>
  );
}