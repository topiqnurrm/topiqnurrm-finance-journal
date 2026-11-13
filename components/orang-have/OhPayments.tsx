"use client";

import { useState } from "react";
import { OhMember, OhPayment } from "@/lib/types/orang-have";
import { formatRupiah } from "@/lib/utils/currency";
import { getLocalDateStr } from "@/lib/utils/date";
import { OH_KAS_PER_PERSON } from "@/lib/orang-have/config";
import {
  MonthStatus,
  isValidProofName,
  memberTotals,
  monthLabel,
  monthLabelLong,
  monthStatus,
  periodMonths,
} from "@/lib/orang-have/calc";
import OhProofLink from "./OhProofLink";

type Member = OhMember & { id: string };
type Payment = OhPayment & { id: string };

interface Props {
  isOwner: boolean;
  members: Member[];
  payments: Payment[];
  addPayment: (d: Omit<OhPayment, "id">) => Promise<unknown>;
  editPayment: (id: string, d: Partial<OhPayment>) => Promise<unknown>;
  removePayment: (id: string) => Promise<unknown>;
}

const CHIP: Record<MonthStatus, { box: string; text: string }> = {
  paid: { box: "border-green-800 bg-green-950/40", text: "text-green-400" },
  due: { box: "border-amber-700 bg-amber-950/30", text: "text-amber-400" },
  late: { box: "border-red-800 bg-red-950/40", text: "text-red-400" },
  upcoming: { box: "border-neutral-800 bg-neutral-900", text: "text-neutral-500" },
};
const STATUS_TEXT: Record<MonthStatus, string> = {
  paid: "Lunas",
  due: "Jatuh tempo",
  late: "Telat",
  upcoming: "Belum",
};

export default function OhPayments({ isOwner, members, payments, addPayment, editPayment, removePayment }: Props) {
  const months = periodMonths();
  const today = getLocalDateStr();

  // Chip yang sedang dibuka: "memberId|YYYY-MM"
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [savings, setSavings] = useState("");
  const [kas, setKas] = useState(String(OH_KAS_PER_PERSON));
  const [paidDate, setPaidDate] = useState(today);
  const [proof, setProof] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setEditing(null);
    setShowForm(false);
    setSavings("");
    setKas(String(OH_KAS_PER_PERSON));
    setPaidDate(getLocalDateStr());
    setProof("");
    setNote("");
  }

  function toggleChip(key: string) {
    resetForm();
    setOpen((cur) => (cur === key ? null : key));
  }

  function startEdit(p: Payment) {
    if (!window.confirm("Edit setoran ini? Form akan terisi otomatis.")) return;
    setEditing(p);
    setShowForm(true);
    setSavings(String(p.savings));
    setKas(String(p.kas));
    setPaidDate(p.paidDate);
    setProof(p.proof || "");
    setNote(p.note || "");
  }

  async function handleSave(e: React.FormEvent, memberId: string, month: string) {
    e.preventDefault();
    const s = parseInt(savings || "0", 10);
    const k = parseInt(kas || "0", 10);
    if (!(s > 0) && !(k > 0)) {
      window.alert("Isi jumlah tabungan atau iuran kas.");
      return;
    }
    if (!isValidProofName(proof.trim())) {
      window.alert("Nama file bukti hanya boleh huruf, angka, titik, spasi, minus, dan underscore (tanpa folder).");
      return;
    }
    if (!window.confirm(editing ? "Simpan perubahan setoran ini?" : "Simpan setoran ini?")) return;

    setSubmitting(true);
    try {
      const payload = {
        savings: s || 0,
        kas: k || 0,
        paidDate,
        proof: proof.trim(),
        note: note.trim(),
      };
      if (editing) await editPayment(editing.id, payload);
      else await addPayment({ memberId, month, ...payload, createdAt: Date.now() });
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert("Gagal menyimpan. Pastikan kamu login sebagai owner.");
    }
    setSubmitting(false);
  }

  function handleDelete(p: Payment) {
    if (!window.confirm("Hapus catatan setoran ini? Data tidak bisa dikembalikan.")) return;
    removePayment(p.id).catch((err) => {
      console.error(err);
      window.alert("Gagal menghapus.");
    });
  }

  if (members.length === 0) {
    return <p className="text-sm text-neutral-500">Belum ada anggota. Tambahkan dulu di tab Anggota.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-600">
        Ketuk bulan untuk melihat rincian{isOwner ? " atau mencatat setoran" : ""}.
      </p>

      {members.map((m) => {
        const t = memberTotals(m, payments);
        const openMonth = open?.startsWith(m.id + "|") ? open.split("|")[1] : null;
        const records = openMonth ? payments.filter((p) => p.memberId === m.id && p.month === openMonth) : [];

        return (
          <div key={m.id} className="min-w-0 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="break-words text-sm font-semibold text-white">{m.name}</p>
              <p className="shrink-0 text-xs text-neutral-400">{formatRupiah(t.savings)}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {months.map((month) => {
                const recs = payments.filter((p) => p.memberId === m.id && p.month === month);
                const status = monthStatus(month, today, recs.length > 0);
                const style = CHIP[status];
                const sum = recs.reduce((s, p) => s + p.savings + p.kas, 0);
                const key = `${m.id}|${month}`;
                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => toggleChip(key)}
                    className={`min-w-0 rounded-md border p-2 text-left ${style.box} ${
                      open === key ? "ring-1 ring-blue-500" : ""
                    }`}
                  >
                    <p className="text-[11px] text-neutral-400">{monthLabel(month)}</p>
                    <p className={`break-words text-[11px] font-medium ${style.text}`}>
                      {status === "paid" ? formatRupiah(sum) : STATUS_TEXT[status]}
                    </p>
                  </button>
                );
              })}
            </div>

            {openMonth && (
              <div className="space-y-2 rounded-md border border-neutral-800 p-3">
                <p className="text-xs font-medium text-neutral-300">
                  {m.name} · {monthLabelLong(openMonth)}
                </p>

                {records.length === 0 ? (
                  <p className="text-xs text-neutral-500">Belum ada catatan setoran.</p>
                ) : (
                  records.map((p) => (
                    <div key={p.id} className="space-y-0.5 border-t border-neutral-800 pt-2">
                      <p className="break-words text-sm text-white">
                        Tabungan {formatRupiah(p.savings)} · Kas {formatRupiah(p.kas)}
                      </p>
                      <p className="break-words text-xs text-neutral-500">
                        Transfer {p.paidDate}
                        {p.note && ` · ${p.note}`}
                      </p>
                      <div className="flex items-center gap-3">
                        <OhProofLink proof={p.proof} />
                        {isOwner && (
                          <>
                            <button onClick={() => startEdit(p)} className="text-xs text-neutral-500 hover:text-blue-400">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(p)} className="text-xs text-neutral-500 hover:text-red-500">
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isOwner && !showForm && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="rounded-md bg-neutral-800 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
                  >
                    + Catat setoran
                  </button>
                )}

                {isOwner && showForm && (
                  <form onSubmit={(e) => handleSave(e, m.id, openMonth)} className="space-y-2 border-t border-neutral-800 pt-2">
                    <p className="text-xs text-neutral-400">{editing ? "Mengedit setoran" : "Setoran baru"}</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Tabungan (Rp)"
                        value={savings}
                        onChange={(e) => setSavings(e.target.value)}
                        className="min-w-0 flex-1 rounded-md bg-neutral-800 p-2 text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Kas (Rp)"
                        value={kas}
                        onChange={(e) => setKas(e.target.value)}
                        className="min-w-0 flex-1 rounded-md bg-neutral-800 p-2 text-sm"
                      />
                    </div>
                    <input
                      type="date"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                      className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Nama file bukti di public/bukti (mis. nov-hani.jpg)"
                      value={proof}
                      onChange={(e) => setProof(e.target.value)}
                      className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Catatan (opsional)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
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
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 rounded-md bg-neutral-700 py-2 text-sm font-medium text-white"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500">
        <span>Hijau: lunas</span>
        <span>Kuning: jatuh tempo (tgl 25 – 5 bulan berikutnya)</span>
        <span>Merah: telat</span>
      </div>
    </div>
  );
}
