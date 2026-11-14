"use client";

import { useState } from "react";
import { OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { formatRupiah } from "@/lib/utils/currency";
import { getLocalDateStr } from "@/lib/utils/date";
import { OH_PAYOUT_LABEL } from "@/lib/orang-have/config";
import { isValidProofName, kasSummary } from "@/lib/orang-have/calc";
import OhProofLink from "./OhProofLink";
import { ohProofDir } from "@/lib/orang-have/config";

type Expense = OhKasExpense & { id: string };

interface Props {
  isOwner: boolean;
  members: (OhMember & { id: string })[];
  payments: OhPayment[];
  expenses: Expense[];
  loans: OhLoan[];
  addExpense: (d: Omit<OhKasExpense, "id">) => Promise<unknown>;
  editExpense: (id: string, d: Partial<OhKasExpense>) => Promise<unknown>;
  removeExpense: (id: string) => Promise<unknown>;
}

export default function OhKas({ isOwner, members, payments, expenses, loans, addExpense, editExpense, removeExpense }: Props) {
  const kas = kasSummary(payments, expenses, loans, members.length);

  const [editing, setEditing] = useState<Expense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(getLocalDateStr());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setEditing(null);
    setShowForm(false);
    setDate(getLocalDateStr());
    setAmount("");
    setNote("");
    setProof("");
  }

  function startEdit(e: Expense) {
    if (!window.confirm("Edit pengeluaran kas ini? Form akan terisi otomatis.")) return;
    setEditing(e);
    setShowForm(true);
    setDate(e.date);
    setAmount(String(e.amount));
    setNote(e.note || "");
    setProof(e.proof || "");
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    const a = parseInt(amount, 10);
    if (!(a > 0) || !note.trim()) {
      window.alert("Isi jumlah dan keterangan pengeluaran.");
      return;
    }
    if (!isValidProofName(proof.trim())) {
      window.alert("Nama file bukti hanya boleh huruf, angka, titik, spasi, minus, dan underscore (tanpa folder).");
      return;
    }
    if (!window.confirm(editing ? "Simpan perubahan pengeluaran kas ini?" : "Simpan pengeluaran kas ini?")) return;

    setSubmitting(true);
    try {
      const payload = { date, amount: a, note: note.trim(), proof: proof.trim() };
      if (editing) await editExpense(editing.id, payload);
      else await addExpense({ ...payload, createdAt: Date.now() });
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert("Gagal menyimpan. Pastikan kamu login sebagai owner.");
    }
    setSubmitting(false);
  }

  function handleDelete(e: Expense) {
    if (!window.confirm(`Hapus pengeluaran kas "${e.note}"? Data tidak bisa dikembalikan.`)) return;
    removeExpense(e.id).catch((err) => {
      console.error(err);
      window.alert("Gagal menghapus.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card label="Iuran kas masuk" value={formatRupiah(kas.kasIn)} />
        <Card label="Biaya pinjaman masuk" value={formatRupiah(kas.feeIn)} hint="Dari pinjaman yang sudah lunas" />
        <Card label="Pengeluaran kas" value={formatRupiah(kas.kasOut)} tone="text-red-500" />
        <Card label="Saldo kas" value={formatRupiah(kas.balance)} tone={kas.balance < 0 ? "text-red-500" : "text-green-500"} />
      </div>

      <div className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-xs text-neutral-400">Bagian sisa kas per anggota ({OH_PAYOUT_LABEL})</p>
        <p className="break-words text-lg font-semibold text-green-500">{formatRupiah(kas.share)}</p>
        <p className="mt-1 text-xs text-neutral-600">Saldo kas dibagi rata {members.length} anggota, dibulatkan ke bawah</p>
      </div>

      <div className="min-w-0 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Pengeluaran kas</h2>
          {isOwner && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-md bg-neutral-800 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
            >
              + Tambah
            </button>
          )}
        </div>

        {isOwner && showForm && (
          <form onSubmit={handleSave} className="space-y-2 rounded-md border border-neutral-800 p-3">
            <p className="text-xs text-neutral-400">{editing ? "Mengedit pengeluaran" : "Pengeluaran baru"}</p>
            <input
              type="number"
              min="0"
              placeholder="Jumlah (Rp)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Keterangan (mis. biaya admin rekening)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
              required
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder={`Nama file bukti (taruh di ${ohProofDir("kas")}) - wajib`}
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-md bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
              <button type="button" onClick={resetForm} className="flex-1 rounded-md bg-neutral-700 py-2 text-sm font-medium text-white">
                Batal
              </button>
            </div>
          </form>
        )}

        {expenses.length === 0 ? (
          <p className="text-sm text-neutral-500">Belum ada pengeluaran kas.</p>
        ) : (
          expenses.map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-3 border-t border-neutral-800 pt-2">
              <div className="min-w-0">
                <p className="break-words text-sm text-white">{e.note}</p>
                <p className="text-xs text-neutral-500">{e.date}</p>
                <div className="flex items-center gap-3">
                  <OhProofLink proof={e.proof} kind="kas" />
                  {!e.proof && <span className="text-xs text-amber-500">Belum ada bukti</span>}
                  {isOwner && (
                    <>
                      <button onClick={() => startEdit(e)} className="text-xs text-neutral-500 hover:text-blue-400">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(e)} className="text-xs text-neutral-500 hover:text-red-500">
                        Hapus
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-red-500">{formatRupiah(e.amount)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Card({ label, value, hint, tone = "text-white" }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`break-words text-lg font-semibold ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}