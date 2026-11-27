"use client";

import { useState } from "react";
import { PlanGroup, deleteDocs } from "@/lib/archive/cleanup-core";

interface Props {
  title: string;
  intro: string;
  isOwner: boolean;
  plan: () => Promise<{ groups: PlanGroup[]; message?: string }>;
}

// Dua langkah: (1) Periksa = hanya membaca, (2) Hapus = menghapus dokumen yang SUDAH ada di arsip.
export default function ArchiveCleanupPanel({ title, intro, isOwner, plan }: Props) {
  const [groups, setGroups] = useState<PlanGroup[] | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [done, setDone] = useState("");

  const total = (groups ?? []).reduce((s, g) => s + g.deletable.length, 0);

  async function check() {
    setBusy(true);
    setDone("");
    setProgress("");
    setConfirmText("");
    try {
      const r = await plan();
      setGroups(r.groups);
      setMessage(r.message ?? "");
    } catch (err) {
      console.error(err);
      window.alert("Gagal membaca data. Pastikan kamu login sebagai owner dan koneksi stabil.");
    }
    setBusy(false);
  }

  async function run() {
    if (!groups || total === 0) return;
    if (confirmText.trim() !== "HAPUS") {
      window.alert('Ketik HAPUS (huruf besar) pada kolom konfirmasi dulu.');
      return;
    }
    if (!window.confirm(`Hapus ${total} dokumen dari Firebase? Ini tidak bisa dibatalkan (datanya tetap ada di arsip kode).`)) return;

    setBusy(true);
    setDone("");
    try {
      let deleted = 0;
      for (const g of groups) {
        if (g.deletable.length === 0) continue;
        setProgress(`Menghapus ${g.label}...`);
        await deleteDocs(g.collection, g.deletable);
        deleted += g.deletable.length;
      }
      setDone(`Selesai: ${deleted} dokumen dihapus dari Firebase.`);
      setProgress("");
      setConfirmText("");
      const r = await plan(); // periksa ulang
      setGroups(r.groups);
    } catch (err) {
      console.error(err);
      window.alert("Penghapusan berhenti karena error. Sebagian mungkin sudah terhapus; tekan Periksa lagi untuk melihat sisanya.");
    }
    setBusy(false);
    setProgress("");
  }

  return (
    <div className="space-y-4">
      <div className="min-w-0 rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-xs text-amber-400">
        <p className="mb-1 text-sm font-semibold">{title}</p>
        <p>{intro}</p>
        <p className="mt-2">
          Hapus hanya setelah arsip dicek benar di aplikasi dan kamu sudah menyimpan Export Excel sebagai cadangan.
          Data yang tidak ditemukan di arsip tidak pernah dihapus.
        </p>
      </div>

      <button
        onClick={check}
        disabled={busy}
        className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy && !progress ? "Memeriksa..." : "1. Periksa data yang bisa dihapus"}
      </button>

      {message && <p className="text-sm text-neutral-400">{message}</p>}

      {groups && (
        <div className="min-w-0 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          {groups.map((g) => (
            <div key={g.key} className="space-y-1 border-b border-neutral-800 pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-white">{g.label}</p>
                <p className="shrink-0 text-xs text-neutral-500">{g.inRange} di Firebase (rentang arsip)</p>
              </div>
              <p className="text-xs text-green-500">Aman dihapus (sudah ada di arsip): {g.deletable.length}</p>
              {g.kept.length > 0 && (
                <div className="text-xs text-amber-400">
                  <p>Tidak ada di arsip, TIDAK dihapus: {g.kept.length}</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-neutral-500">
                    {g.kept.slice(0, 8).map((k) => (
                      <li key={k.id} className="break-words">
                        {k.desc}
                      </li>
                    ))}
                    {g.kept.length > 8 && <li>...dan {g.kept.length - 8} lainnya</li>}
                  </ul>
                </div>
              )}
              {g.note && <p className="text-xs text-neutral-600">{g.note}</p>}
            </div>
          ))}

          {isOwner ? (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-neutral-400">Total yang akan dihapus: {total} dokumen</p>
              <input
                type="text"
                placeholder='Ketik HAPUS untuk konfirmasi'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
              />
              <button
                onClick={run}
                disabled={busy || total === 0}
                className="w-full rounded-md bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {busy && progress ? progress : "2. Hapus dari Firebase"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-neutral-500">Hanya owner yang bisa menghapus.</p>
          )}
          {done && <p className="text-sm text-green-500">{done}</p>}
        </div>
      )}
    </div>
  );
}