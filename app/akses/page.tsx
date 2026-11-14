"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAccessConfig, AccessConfig } from "@/lib/hooks/useAccessConfig";
import BackButton from "@/components/ui/BackButton";

type ListKey = keyof AccessConfig;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SECTIONS: { key: ListKey; title: string; desc: string }[] = [
  {
    key: "personalViewers",
    title: "Keuangan & Jurnal Pribadi",
    desc: "Boleh melihat transaksi, jurnal, analisis, review, dan export. Akun lain melihat halaman 404.",
  },
  {
    key: "ohViewers",
    title: "Tabungan Bersama Orang Have",
    desc: "Boleh melihat halaman Orang Have (wajib login). Akun lain melihat halaman 404.",
  },
];

// Khusus owner. Owner selalu punya akses penuh ke semuanya dan tidak perlu didaftarkan di sini.
export default function AksesPage() {
  const { isOwner } = useAuth();
  const { config, loading, error, save } = useAccessConfig();
  const [inputs, setInputs] = useState<Record<ListKey, string>>({ personalViewers: "", ohViewers: "" });
  const [busy, setBusy] = useState(false);

  if (!isOwner) return null;

  async function add(key: ListKey) {
    const email = inputs[key].trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      window.alert("Format email tidak valid.");
      return;
    }
    if (config[key].includes(email)) {
      window.alert("Email ini sudah ada di daftar.");
      return;
    }
    if (!window.confirm(`Beri akses ke ${email}?`)) return;
    setBusy(true);
    try {
      await save({ [key]: [...config[key], email] });
      setInputs((i) => ({ ...i, [key]: "" }));
    } catch (err) {
      console.error(err);
      window.alert("Gagal menyimpan.");
    }
    setBusy(false);
  }

  async function remove(key: ListKey, email: string) {
    if (!window.confirm(`Cabut akses ${email}?`)) return;
    setBusy(true);
    try {
      await save({ [key]: config[key].filter((e) => e !== email) });
    } catch (err) {
      console.error(err);
      window.alert("Gagal menyimpan.");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 overflow-x-hidden p-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-semibold">Kelola Akses</h1>
      </div>

      {error && <p className="rounded-md bg-red-950/40 p-3 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Memuat...</p>
      ) : (
        SECTIONS.map((s) => (
          <div key={s.key} className="min-w-0 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div>
              <h2 className="text-sm font-semibold text-white">{s.title}</h2>
              <p className="text-xs text-neutral-500">{s.desc}</p>
            </div>

            {config[s.key].length === 0 ? (
              <p className="text-sm text-neutral-600">Belum ada akun (hanya owner).</p>
            ) : (
              config[s.key].map((email) => (
                <div key={email} className="flex items-center justify-between gap-3 border-t border-neutral-800 pt-2">
                  <p className="min-w-0 break-all text-sm text-neutral-200">{email}</p>
                  <button
                    onClick={() => remove(s.key, email)}
                    disabled={busy}
                    className="shrink-0 text-xs text-neutral-500 hover:text-red-500 disabled:opacity-50"
                  >
                    Cabut
                  </button>
                </div>
              ))
            )}

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@gmail.com"
                value={inputs[s.key]}
                onChange={(e) => setInputs((i) => ({ ...i, [s.key]: e.target.value }))}
                className="min-w-0 flex-1 rounded-md bg-neutral-800 p-2 text-sm"
              />
              <button
                onClick={() => add(s.key)}
                disabled={busy}
                className="shrink-0 rounded-md bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                Tambah
              </button>
            </div>
          </div>
        ))
      )}

      <p className="text-xs text-neutral-600">
        Perubahan berlaku saat akun itu memuat ulang halaman. Daftar ini disimpan di database (access/config).
      </p>
    </div>
  );
}