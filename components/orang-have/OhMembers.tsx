"use client";

import { useState } from "react";
import { OhMember, OhPayment } from "@/lib/types/orang-have";
import { formatRupiah } from "@/lib/utils/currency";

type Member = OhMember & { id: string };

interface Props {
  isOwner: boolean;
  members: Member[];
  payments: OhPayment[];
  addMember: (d: Omit<OhMember, "id">) => Promise<unknown>;
  editMember: (id: string, d: Partial<OhMember>) => Promise<unknown>;
  removeMember: (id: string) => Promise<unknown>;
}

export default function OhMembers({ isOwner, members, payments, addMember, editMember, removeMember }: Props) {
  const [editing, setEditing] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setEditing(null);
    setShowForm(false);
    setName("");
    setTarget("");
  }

  function startEdit(m: Member) {
    if (!window.confirm("Edit anggota ini? Form akan terisi otomatis.")) return;
    setEditing(m);
    setShowForm(true);
    setName(m.name);
    setTarget(String(m.target));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const t = parseInt(target, 10);
    if (!name.trim() || !(t > 0)) {
      window.alert("Isi nama dan target tabungan.");
      return;
    }
    if (!window.confirm(editing ? "Simpan perubahan anggota ini?" : "Simpan anggota baru ini?")) return;

    setSubmitting(true);
    try {
      if (editing) await editMember(editing.id, { name: name.trim(), target: t });
      else await addMember({ name: name.trim(), target: t, createdAt: Date.now() });
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert("Gagal menyimpan. Pastikan kamu login sebagai owner.");
    }
    setSubmitting(false);
  }

  function handleDelete(m: Member) {
    // Cegah catatan setoran "yatim" yang tidak terlihat di mana pun
    if (payments.some((p) => p.memberId === m.id)) {
      window.alert(`${m.name} sudah punya catatan setoran. Hapus dulu semua setorannya (tab Setoran), baru anggota bisa dihapus.`);
      return;
    }
    if (!window.confirm(`Hapus anggota ${m.name}? Data tidak bisa dikembalikan.`)) return;
    removeMember(m.id).catch((err) => {
      console.error(err);
      window.alert("Gagal menghapus.");
    });
  }

  return (
    <div className="min-w-0 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Anggota ({members.length})</h2>
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
          <p className="text-xs text-neutral-400">{editing ? `Mengedit: ${editing.name}` : "Anggota baru"}</p>
          <input
            type="text"
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Target tabungan pokok (Rp)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
            required
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

      {members.length === 0 ? (
        <p className="text-sm text-neutral-500">Belum ada anggota.</p>
      ) : (
        members.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 border-t border-neutral-800 pt-2">
            <div className="min-w-0">
              <p className="break-words text-sm text-white">{m.name}</p>
              <p className="text-xs text-neutral-500">Target {formatRupiah(m.target)}</p>
            </div>
            {isOwner && (
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => startEdit(m)} className="text-xs text-neutral-500 hover:text-blue-400">
                  Edit
                </button>
                <button onClick={() => handleDelete(m)} className="text-xs text-neutral-500 hover:text-red-500">
                  Hapus
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
