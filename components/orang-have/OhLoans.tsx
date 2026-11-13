"use client";

import { useState } from "react";
import { OhLoan, OhMember } from "@/lib/types/orang-have";
import { formatRupiah } from "@/lib/utils/currency";
import { getLocalDateStr } from "@/lib/utils/date";
import { isValidProofName } from "@/lib/orang-have/calc";
import OhProofLink from "./OhProofLink";

type Loan = OhLoan & { id: string };

interface Props {
  isOwner: boolean;
  members: (OhMember & { id: string })[];
  loans: Loan[];
  addLoan: (d: Omit<OhLoan, "id">) => Promise<unknown>;
  editLoan: (id: string, d: Partial<OhLoan>) => Promise<unknown>;
  removeLoan: (id: string) => Promise<unknown>;
}

export default function OhLoans({ isOwner, members, loans, addLoan, editLoan, removeLoan }: Props) {
  const [editing, setEditing] = useState<Loan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [borrower, setBorrower] = useState("");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [date, setDate] = useState(getLocalDateStr());
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const outstanding = loans.filter((l) => !l.repaidDate);
  const repaid = loans.filter((l) => l.repaidDate);
  const outstandingTotal = outstanding.reduce((s, l) => s + l.amount, 0);

  function resetForm() {
    setEditing(null);
    setShowForm(false);
    setBorrower("");
    setAmount("");
    setFee("");
    setDate(getLocalDateStr());
    setDueDate("");
    setNote("");
    setProof("");
  }

  function startEdit(l: Loan) {
    if (!window.confirm("Edit pinjaman ini? Form akan terisi otomatis.")) return;
    setEditing(l);
    setShowForm(true);
    setBorrower(l.borrower);
    setAmount(String(l.amount));
    setFee(String(l.fee));
    setDate(l.date);
    setDueDate(l.dueDate || "");
    setNote(l.note || "");
    setProof(l.proof || "");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const a = parseInt(amount, 10);
    if (!borrower.trim() || !(a > 0)) {
      window.alert("Isi nama peminjam dan jumlah pinjaman.");
      return;
    }
    if (!isValidProofName(proof.trim())) {
      window.alert("Nama file bukti hanya boleh huruf, angka, titik, spasi, minus, dan underscore (tanpa folder).");
      return;
    }
    if (!window.confirm(editing ? "Simpan perubahan pinjaman ini?" : "Simpan pinjaman ini?")) return;

    setSubmitting(true);
    try {
      const payload = {
        borrower: borrower.trim(),
        amount: a,
        fee: parseInt(fee || "0", 10) || 0,
        date,
        dueDate,
        note: note.trim(),
        proof: proof.trim(),
      };
      if (editing) await editLoan(editing.id, payload);
      else await addLoan({ ...payload, repaidDate: null, createdAt: Date.now() });
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert("Gagal menyimpan. Pastikan kamu login sebagai owner.");
    }
    setSubmitting(false);
  }

  function toggleRepaid(l: Loan) {
    const msg = l.repaidDate
      ? `Batalkan status lunas pinjaman ${l.borrower}? Biaya pinjaman akan keluar dari kas.`
      : `Tandai pinjaman ${l.borrower} sudah dikembalikan? Biaya pinjaman ${formatRupiah(l.fee)} akan masuk kas.`;
    if (!window.confirm(msg)) return;
    editLoan(l.id, { repaidDate: l.repaidDate ? null : getLocalDateStr() }).catch((err) => {
      console.error(err);
      window.alert("Gagal menyimpan.");
    });
  }

  function handleDelete(l: Loan) {
    if (!window.confirm(`Hapus pinjaman ${l.borrower}? Data tidak bisa dikembalikan.`)) return;
    removeLoan(l.id).catch((err) => {
      console.error(err);
      window.alert("Gagal menghapus.");
    });
  }

  function renderLoan(l: Loan) {
    const isRepaid = !!l.repaidDate;
    return (
      <div key={l.id} className="space-y-1 border-t border-neutral-800 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-sm text-white">{l.borrower}</p>
            <p className="break-words text-xs text-neutral-500">
              Pinjam {l.date}
              {l.dueDate && ` · jatuh tempo ${l.dueDate}`}
              {l.note && ` · ${l.note}`}
            </p>
            <p className="text-xs text-neutral-500">Biaya pinjaman {formatRupiah(l.fee)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-sm font-semibold ${isRepaid ? "text-neutral-400" : "text-amber-400"}`}>
              {formatRupiah(l.amount)}
            </p>
            <p className={`text-xs ${isRepaid ? "text-green-500" : "text-amber-500"}`}>
              {isRepaid ? `Lunas ${l.repaidDate}` : "Belum kembali"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OhProofLink proof={l.proof} />
          {isOwner && (
            <>
              <button onClick={() => toggleRepaid(l)} className="text-xs text-neutral-500 hover:text-green-400">
                {isRepaid ? "Batalkan lunas" : "Tandai lunas"}
              </button>
              <button onClick={() => startEdit(l)} className="text-xs text-neutral-500 hover:text-blue-400">
                Edit
              </button>
              <button onClick={() => handleDelete(l)} className="text-xs text-neutral-500 hover:text-red-500">
                Hapus
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-xs text-neutral-400">Belum dikembalikan</p>
        <p className="break-words text-lg font-semibold text-amber-400">{formatRupiah(outstandingTotal)}</p>
        <p className="mt-1 text-xs text-neutral-600">
          {outstanding.length} pinjaman. Biaya pinjaman masuk kas setelah pinjaman ditandai lunas.
        </p>
      </div>

      <div className="min-w-0 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Pinjaman</h2>
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
            <p className="text-xs text-neutral-400">{editing ? "Mengedit pinjaman" : "Pinjaman baru"}</p>
            <input
              type="text"
              list="oh-borrowers"
              placeholder="Peminjam (pilih anggota atau ketik nama)"
              value={borrower}
              onChange={(e) => setBorrower(e.target.value)}
              className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
              required
            />
            <datalist id="oh-borrowers">
              {members.map((m) => (
                <option key={m.id} value={m.name} />
              ))}
            </datalist>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                placeholder="Jumlah pinjaman (Rp)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="min-w-0 flex-1 rounded-md bg-neutral-800 p-2 text-sm"
                required
              />
              <input
                type="number"
                min="0"
                placeholder="Biaya (Rp)"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="min-w-0 flex-1 rounded-md bg-neutral-800 p-2 text-sm"
              />
            </div>
            <label className="block text-xs text-neutral-500">
              Tanggal pinjam
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
                required
              />
            </label>
            <label className="block text-xs text-neutral-500">
              Jatuh tempo (opsional)
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
              />
            </label>
            <input
              type="text"
              placeholder="Catatan (opsional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
            />
            <input
              type="text"
              placeholder="Nama file bukti di public/bukti (opsional)"
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

        {loans.length === 0 ? <p className="text-sm text-neutral-500">Belum ada pinjaman.</p> : null}
        {outstanding.map(renderLoan)}
        {repaid.map(renderLoan)}
      </div>
    </div>
  );
}
