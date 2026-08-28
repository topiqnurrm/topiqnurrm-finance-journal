"use client";
 
import { useState } from "react";
import { useFinance } from "@/lib/hooks/useFinance";
import { EXPENSE_CATEGORIES, ExpenseCategory, TransactionType } from "@/lib/types/finance";
 
export default function FinanceForm() {
  const { addTransaction } = useFinance();
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<ExpenseCategory>("kehidupan");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    await addTransaction({
      type,
      category: type === "expense" ? category : null,
      amount: parseInt(amount, 10),
      note,
      date,
      createdAt: Date.now(),
    });
    setAmount("");
    setNote("");
    setSubmitting(false);
  }
 
  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-neutral-800 p-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex-1 rounded-md py-2 text-sm ${
            type === "expense" ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-400"
          }`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex-1 rounded-md py-2 text-sm ${
            type === "income" ? "bg-green-600 text-white" : "bg-neutral-800 text-neutral-400"
          }`}
        >
          Pemasukan
        </button>
      </div>
 
      {type === "expense" && (
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
      )}
 
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
        onChange={(e) => setDate(e.target.value)}
        className="w-full rounded-md bg-neutral-800 p-2 text-sm"
      />
 
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
