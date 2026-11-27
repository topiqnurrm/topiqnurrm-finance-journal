"use client";

import { useState } from "react";
import { OhKasDirection, OhKasEntryType, OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { formatRupiah } from "@/lib/utils/currency";
import { getLocalDateStr } from "@/lib/utils/date";
import { OH_PAYOUT_LABEL } from "@/lib/orang-have/config";
import { isAudit, isValidProofName, kasEntryDelta, kasSummary, poolSummary } from "@/lib/orang-have/calc";
import OhProofLink from "./OhProofLink";
import OhPager, { usePaged } from "./OhPager";
import { isOhArchivedId } from "@/lib/orang-have/archive";
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
  const pool = poolSummary(payments, kas.balance, loans);
  const auditNet = kas.auditIn - kas.auditOut;
  const pg = usePaged(expenses);

  const [editing, setEditing] = useState<Expense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(getLocalDateStr());
  const [entryType, setEntryType] = useState<OhKasEntryType>("expense");
  const [direction, setDirection] = useState<OhKasDirection>("in");
  const [bankBalance, setBankBalance] = useState(""); // bantu audit: saldo bank sebenarnya
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setEditing(null);
    setShowForm(false);
    setDate(getLocalDateStr());
    setEntryType("expense");
    setDirection("in");
    setBankBalance("");
    setAmount("");
    setNote("");
    setProof("");
  }

  function startEdit(e: Expense) {
    if (!window.confirm("Edit catatan kas ini? Form akan terisi otomatis.")) return;
    setEditing(e);
    setShowForm(true);
    setEntryType(isAudit(e) ? "audit" : "expense");
    setDirection(e.direction === "out" ? "out" : "in");
    setBankBalance("");
    setDate(e.date);
    setAmount(String(e.amount));
    setNote(e.note || "");
    setProof(e.proof || "");
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    const a = parseInt(amount, 10);
    // Audit boleh selisih 0 (saldo cocok); pengeluaran tetap harus lebih dari 0
    const amountOk = entryType === "audit" ? Number.isFinite(a) && a >= 0 : a > 0;
    if (!amountOk || !note.trim()) {
      window.alert(entryType === "audit" ? "Isi jumlah selisih (boleh 0) dan keterangan audit." : "Isi jumlah dan keterangan pengeluaran.");
      return;
    }
    if (!isValidProofName(proof.trim())) {
      window.alert("Nama file bukti hanya boleh huruf, angka, titik, spasi, minus, dan underscore (tanpa folder).");
      return;
    }
    if (!window.confirm(
        entryType === "audit"
          ? a === 0
            ? "Simpan audit dengan selisih Rp0 (saldo cocok, kas tidak berubah)?"
            : `Simpan audit: uang ${direction === "in" ? "LEBIH (menambah kas)" : "KURANG (mengurangi kas)"} ${formatRupiah(a)}?`
          : editing
          ? "Simpan perubahan pengeluaran kas ini?"
          : "Simpan pengeluaran kas ini?"
      )) return;

    setSubmitting(true);
    try {
      const payload = {
        date,
        amount: a,
        note: note.trim(),
        proof: proof.trim(),
        type: entryType,
        direction: (entryType === "audit" ? direction : "out") as OhKasDirection,
      };
      if (editing) await editExpense(editing.id, payload);
      else await addExpense({ ...payload, createdAt: Date.now() });
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert("Gagal menyimpan. Pastikan kamu login sebagai owner.");
    }
    setSubmitting(false);
  }

  // Bantu audit: bandingkan saldo bank sebenarnya dengan uang aktual di aplikasi
  const bankNum = parseInt(bankBalance, 10);
  const bankDiff = Number.isFinite(bankNum) ? bankNum - pool.available : null;
  function useBankDiff() {
    if (bankDiff === null) return;
    if (bankDiff !== 0) setDirection(bankDiff > 0 ? "in" : "out");
    setAmount(String(Math.abs(bankDiff)));
  }

  function handleDelete(e: Expense) {
    if (!window.confirm(`Hapus catatan kas "${e.note}"? Data tidak bisa dikembalikan.`)) return;
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
        <Card
          label="Hasil audit (selisih)"
          value={`${auditNet > 0 ? "+" : auditNet < 0 ? "−" : ""}${formatRupiah(Math.abs(auditNet))}`}
          tone={auditNet > 0 ? "text-green-500" : auditNet < 0 ? "text-red-500" : "text-white"}
          hint={`Lebih ${formatRupiah(kas.auditIn)} · kurang ${formatRupiah(kas.auditOut)}`}
        />
        <Card
          className="col-span-2"
          label="Saldo kas"
          value={formatRupiah(kas.balance)}
          tone={kas.balance < 0 ? "text-red-500" : "text-green-500"}
          hint="Iuran + biaya pinjaman + audit lebih − pengeluaran − audit kurang"
        />
      </div>

      <div className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-xs text-neutral-400">Bagian sisa kas per anggota ({OH_PAYOUT_LABEL})</p>
        <p className="break-words text-lg font-semibold text-green-500">{formatRupiah(kas.share)}</p>
        <p className="mt-1 text-xs text-neutral-600">Saldo kas dibagi rata {members.length} anggota, dibulatkan ke bawah</p>
      </div>

      <div ref={pg.topRef} className="min-w-0 scroll-mt-4 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Pengeluaran & audit kas</h2>
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
            <p className="text-xs text-neutral-400">{editing ? "Mengedit catatan kas" : "Catatan kas baru"}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEntryType("expense")}
                className={`flex-1 rounded-md py-2 text-sm ${
                  entryType === "expense" ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-400"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setEntryType("audit")}
                className={`flex-1 rounded-md py-2 text-sm ${
                  entryType === "audit" ? "bg-purple-600 text-white" : "bg-neutral-800 text-neutral-400"
                }`}
              >
                Audit
              </button>
            </div>

            {entryType === "audit" && (
              <div className="space-y-2 rounded-md border border-purple-600 bg-purple-950 p-3">
                <p className="text-xs text-purple-300">
                  Audit = mencocokkan saldo bank dengan catatan. Selisihnya dicatat sebagai penyesuaian kas, bisa lebih
                  (mis. bonus bunga bank) atau kurang.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection("in")}
                    className={`flex-1 rounded-md py-2 text-sm ${
                      direction === "in" ? "bg-green-600 text-white" : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    Uang lebih (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("out")}
                    className={`flex-1 rounded-md py-2 text-sm ${
                      direction === "out" ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    Uang kurang (−)
                  </button>
                </div>
                {!editing && (
                  <div className="space-y-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="Opsional: saldo bank sebenarnya (Rp)"
                      value={bankBalance}
                      onChange={(e) => setBankBalance(e.target.value)}
                      className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
                    />
                    <p className="break-words text-xs text-neutral-500">
                      Uang aktual di aplikasi: {formatRupiah(pool.available)}
                      {bankDiff !== null &&
                        ` · selisih ${bankDiff > 0 ? "+" : bankDiff < 0 ? "−" : ""}${formatRupiah(Math.abs(bankDiff))}`}
                    </p>
                    {bankDiff !== null && (
                      <button
                        type="button"
                        onClick={useBankDiff}
                        className="rounded-md bg-neutral-700 px-3 py-1 text-xs text-white"
                      >
                        {bankDiff === 0 ? "Pakai selisih 0 (saldo cocok)" : "Pakai selisih ini"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <input
              type="number"
              min="0"
              placeholder={entryType === "audit" ? "Jumlah selisih (Rp)" : "Jumlah (Rp)"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder={entryType === "audit" ? "Keterangan (mis. bonus simpanan dari bank)" : "Keterangan (mis. biaya admin rekening)"}
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
              placeholder={`Nama file bukti (taruh di ${ohProofDir(entryType === "audit" ? "audit" : "kas")}) - ${entryType === "audit" ? "mis. screenshot mutasi" : "wajib"}`}
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
          <p className="text-sm text-neutral-500">Belum ada catatan kas.</p>
        ) : (
          pg.pageItems.map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-3 border-t border-neutral-800 pt-2">
              <div className="min-w-0">
                <p className="break-words text-sm text-white">
                  {isOhArchivedId(e.id) && (
                    <span className="mr-2 rounded border border-neutral-600 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
                      Arsip
                    </span>
                  )}
                  {isAudit(e) && (
                    <span className="mr-2 rounded border border-purple-600 bg-purple-950 px-1.5 py-0.5 text-[10px] text-purple-300">
                      Audit
                    </span>
                  )}
                  {e.note}
                </p>
                <p className="text-xs text-neutral-500">{e.date}</p>
                <div className="flex items-center gap-3">
                  <OhProofLink proof={e.proof} kind={isAudit(e) ? "audit" : "kas"} />
                  {!e.proof && <span className="text-xs text-amber-500">Belum ada bukti</span>}
                  {isOwner && !isOhArchivedId(e.id) && (
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
              <p
                className={`shrink-0 text-sm font-semibold ${
                  e.amount === 0 ? "text-neutral-400" : kasEntryDelta(e) >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {e.amount === 0 ? "" : kasEntryDelta(e) >= 0 ? "+" : "−"}
                {formatRupiah(e.amount)}
              </p>
            </div>
          ))
        )}
        <OhPager {...pg} />
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  hint,
  tone = "text-white",
  className = "",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-xl border border-neutral-800 bg-neutral-900 p-4 ${className}`}>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`break-words text-lg font-semibold ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}