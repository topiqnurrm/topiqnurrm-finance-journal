"use client";

import { useEffect, useState } from "react";
import { useFinance } from "@/lib/hooks/useFinance";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  WITHDRAWAL_CATEGORIES,
  ExpenseCategory,
  IncomeCategory,
  WithdrawalCategory,
  Transaction,
  TransactionType,
  getEffectiveType,
} from "@/lib/types/finance";
import { getLocalDateStr } from "@/lib/utils/date";
import { ARCHIVE_END, LIVE_START } from "@/lib/archive";

type EditableTransaction = Transaction & { id: string };

interface Props {
  editingTransaction?: EditableTransaction | null;
  onCancelEdit?: () => void;
  onSavedEdit?: () => void;
}

export default function FinanceForm({ editingTransaction, onCancelEdit, onSavedEdit }: Props) {
  const { addTransaction, editTransaction } = useFinance();
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<ExpenseCategory>("kehidupan");
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory | "">("");
  const [withdrawCategory, setWithdrawCategory] = useState<WithdrawalCategory>("tabungan");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getLocalDateStr());
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!editingTransaction;

  useEffect(() => {
    if (editingTransaction) {
      const cat = editingTransaction.category;
      // Data lama (pengeluaran "sisa_dibawa") otomatis dibuka sebagai jenis Sisa Bulan
      const effType = getEffectiveType(editingTransaction);
      setType(effType);
      setCategory(effType === "expense" && cat ? (cat as ExpenseCategory) : "kehidupan");
      setIncomeCategory(effType === "income" && cat ? (cat as IncomeCategory) : "");
      setWithdrawCategory(effType === "withdrawal" && cat === "dana_darurat" ? "dana_darurat" : "tabungan");
      setAmount(String(editingTransaction.amount));
      setNote(editingTransaction.note || "");
      setDate(editingTransaction.date);
    } else {
      setType("expense");
      setCategory("kehidupan");
      setIncomeCategory("");
      setWithdrawCategory("tabungan");
      setAmount("");
      setNote("");
      setDate(getLocalDateStr());
    }
  }, [editingTransaction]);

  // Keterangan singkat untuk jenis khusus
  const hint =
    type === "withdrawal"
      ? "Mengambil uang dari tabungan / dana darurat. Mengurangi totalnya dan menambah Sisa Uang bulan ini. Bukan pemasukan dan bukan pengeluaran."
      : type === "carryover"
      ? "Sisa uang akhir bulan. Bukan pemasukan dan bukan pengeluaran; otomatis tampil sebagai sisa bulan lalu di bulan berikutnya."
      : (type === "expense" && category === "hutang") || (type === "income" && incomeCategory === "hutang")
      ? "Hutang/piutang tidak dihitung sebagai pemasukan maupun pengeluaran."
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;

    const confirmMessage = isEditing
      ? "Simpan perubahan transaksi ini?"
      : "Simpan transaksi baru ini?";
    if (!window.confirm(confirmMessage)) return;

    setSubmitting(true);

    const payload = {
      type,
      category:
        type === "expense"
          ? category
          : type === "income"
          ? incomeCategory || null
          : type === "withdrawal"
          ? withdrawCategory
          : null,
      amount: parseInt(amount, 10),
      note,
      date,
    };

    if (isEditing && editingTransaction) {
      await editTransaction(editingTransaction.id, payload);
      onSavedEdit?.();
    } else {
      await addTransaction({ ...payload, createdAt: Date.now() });
      setAmount("");
      setNote("");
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-neutral-800 p-4">
      {isEditing && (
        <p className="text-xs text-blue-400">
          Mengedit transaksi tanggal {editingTransaction?.date}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`rounded-md py-2 text-sm ${
            type === "expense" ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-400"
          }`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`rounded-md py-2 text-sm ${
            type === "income" ? "bg-green-600 text-white" : "bg-neutral-800 text-neutral-400"
          }`}
        >
          Pemasukan
        </button>
        <button
          type="button"
          onClick={() => setType("carryover")}
          className={`rounded-md py-2 text-sm ${
            type === "carryover" ? "bg-sky-700 text-white" : "bg-neutral-800 text-neutral-400"
          }`}
        >
          Sisa Bulan
        </button>
        <button
          type="button"
          onClick={() => setType("withdrawal")}
          className={`rounded-md py-2 text-sm ${
            type === "withdrawal" ? "bg-amber-600 text-white" : "bg-neutral-800 text-neutral-400"
          }`}
        >
          Ambil Tabungan
        </button>
      </div>

      {type === "expense" ? (
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className="w-full rounded-md bg-neutral-800 p-2 text-sm"
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      ) : type === "income" ? (
        <select
          value={incomeCategory}
          onChange={(e) => setIncomeCategory(e.target.value as IncomeCategory | "")}
          className="w-full rounded-md bg-neutral-800 p-2 text-sm"
        >
          {INCOME_CATEGORIES.map((c) => (
            <option key={c.value || "general"} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      ) : type === "withdrawal" ? (
        <select
          value={withdrawCategory}
          onChange={(e) => setWithdrawCategory(e.target.value as WithdrawalCategory)}
          className="w-full rounded-md bg-neutral-800 p-2 text-sm"
        >
          {WITHDRAWAL_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              Ambil dari {c.label}
            </option>
          ))}
        </select>
      ) : null}

      {hint && <p className="text-xs text-neutral-500">{hint}</p>}

      <input
        type="number"
        placeholder="Jumlah (Rp)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full rounded-md bg-neutral-800 p-2 text-sm"
        required
      />

      <input
        type="text"
        placeholder="Catatan (opsional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded-md bg-neutral-800 p-2 text-sm"
      />

      <input
        type="date"
        value={date}
        min={LIVE_START}
        onChange={(e) => setDate(e.target.value)}
        className="w-full rounded-md bg-neutral-800 p-2 text-sm"
      />
      <p className="text-[11px] text-neutral-600">
        Data sampai {ARCHIVE_END} sudah diarsipkan; tanggal minimal {LIVE_START}.
      </p>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-md bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => onCancelEdit?.()}
            className="flex-1 rounded-md bg-neutral-700 py-2 text-sm font-medium text-white"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}