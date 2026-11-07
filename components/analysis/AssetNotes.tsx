"use client";

import { useMemo, useState } from "react";
import { useAssets } from "@/lib/hooks/useAssets";
import { Asset } from "@/lib/types/asset";
import { formatRupiah } from "@/lib/utils/currency";
import { getLocalDateStr } from "@/lib/utils/date";

type AssetWithId = Asset & { id: string };

const UNIT_OPTIONS = ["gram", "pcs", "lembar", "unit", "lot"];

interface Props {
  isOwner: boolean;
}

export default function AssetNotes({ isOwner }: Props) {
  const { assets, loading, addAsset, editAsset, removeAsset } = useAssets();

  const [editing, setEditing] = useState<AssetWithId | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("gram");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getLocalDateStr());
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setEditing(null);
    setName("");
    setQuantity("");
    setUnit("gram");
    setValue("");
    setNote("");
    setDate(getLocalDateStr());
  }

  function startEdit(a: AssetWithId) {
    if (!window.confirm("Edit aset ini? Form akan terisi otomatis.")) return;
    setEditing(a);
    setName(a.name);
    setQuantity(String(a.quantity));
    setUnit(a.unit);
    setValue(a.value != null ? String(a.value) : "");
    setNote(a.note || "");
    setDate(a.date);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity.replace(",", "."));
    if (!name.trim() || !isFinite(qty) || qty <= 0) return;
    if (!window.confirm(editing ? "Simpan perubahan aset ini?" : "Simpan aset baru ini?")) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        quantity: qty,
        unit: unit.trim() || "unit",
        value: value ? parseInt(value, 10) : null, // Firestore tidak menerima undefined
        note: note.trim(),
        date,
      };
      if (editing) await editAsset(editing.id, payload);
      else await addAsset({ ...payload, createdAt: Date.now() });
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert("Gagal menyimpan, coba lagi.");
    }
    setSubmitting(false);
  }

  function handleDelete(a: AssetWithId) {
    if (!window.confirm(`Hapus aset "${a.name}"? Data tidak bisa dikembalikan.`)) return;
    removeAsset(a.id);
    if (editing?.id === a.id) resetForm();
  }

  // Terbaru di atas
  const sorted = useMemo(
    () =>
      [...assets].sort((a, b) =>
        a.date !== b.date ? b.date.localeCompare(a.date) : (b.createdAt ?? 0) - (a.createdAt ?? 0)
      ),
    [assets]
  );

  // Total jumlah per satuan (mis. 3 gram) dan total nilai
  const totals = useMemo(() => {
    const byUnit = new Map<string, number>();
    let totalValue = 0;
    for (const a of assets) {
      byUnit.set(a.unit, (byUnit.get(a.unit) ?? 0) + a.quantity);
      totalValue += a.value ?? 0;
    }
    return { byUnit: Array.from(byUnit.entries()), totalValue };
  }, [assets]);

  return (
    <div className="min-w-0 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-sm font-semibold text-white">Catatan Aset</h2>

      {loading ? (
        <p className="text-sm text-neutral-500">Memuat...</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-neutral-500">Belum ada aset yang dicatat.</p>
      ) : (
        <>
          <div className="min-w-0 rounded-md bg-neutral-800 p-3">
            <p className="text-xs text-neutral-400">Total tercatat</p>
            <p className="break-words text-sm font-semibold text-amber-400">
              {totals.byUnit.map(([u, q]) => `${+q.toFixed(4)} ${u}`).join(" · ")}
            </p>
            {totals.totalValue > 0 && (
              <p className="mt-1 break-words text-xs text-neutral-400">
                Total nilai dicatat: {formatRupiah(totals.totalValue)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            {sorted.map((a) => (
              <div
                key={a.id}
                className={`flex items-center justify-between gap-3 rounded-md border p-3 ${
                  editing?.id === a.id ? "border-blue-500" : "border-neutral-800"
                }`}
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-white">{a.name}</p>
                  <p className="break-words text-xs text-neutral-500">
                    {a.date}
                    {a.value != null && ` · ${formatRupiah(a.value)}`}
                    {a.note && ` · ${a.note}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-amber-400">
                    {+a.quantity.toFixed(4)} {a.unit}
                  </span>
                  {isOwner && (
                    <>
                      <button
                        onClick={() => startEdit(a)}
                        className="text-xs text-neutral-500 hover:text-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        className="text-xs text-neutral-500 hover:text-red-500"
                      >
                        Hapus
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Form hanya untuk owner */}
      {isOwner && (
        <form onSubmit={handleSubmit} className="space-y-2 border-t border-neutral-800 pt-3">
          <p className="text-xs text-neutral-400">
            {editing ? `Mengedit: ${editing.name}` : "Tambah aset"}
          </p>
          <input
            type="text"
            placeholder="Nama aset (mis. Emas Semar)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
            required
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Jumlah"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="min-w-0 flex-1 rounded-md bg-neutral-800 p-2 text-sm"
              required
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-28 shrink-0 rounded-md bg-neutral-800 p-2 text-sm"
            >
              {!UNIT_OPTIONS.includes(unit) && <option value={unit}>{unit}</option>}
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <input
            type="number"
            placeholder="Nilai / harga beli (Rp, opsional)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
          />
          <input
            type="text"
            placeholder="Catatan (opsional, mis. toko / lokasi simpan)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Aset"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-md bg-neutral-700 py-2 text-sm font-medium text-white"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}