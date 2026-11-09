"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useReminders } from "@/lib/hooks/useReminders";
import { Reminder } from "@/lib/types/reminder";
import { getLocalDateStr } from "@/lib/utils/date";

type ReminderWithId = Reminder & { id: string };

// ===== Tingkat urgensi berdasarkan sisa hari =====
// <= 3 hari (termasuk hari ini & terlambat) : merah
// 4-7 hari   : oranye
// 8-14 hari  : kuning
// > 14 hari  : hijau
type Level = "overdue" | "red" | "orange" | "yellow" | "green" | "done";

const LEVEL_STYLE: Record<Level, { card: string; badge: string; dot: string }> = {
  overdue: {
    card: "border-red-700 bg-red-950/40",
    badge: "bg-red-600 text-white",
    dot: "bg-red-500",
  },
  red: {
    card: "border-red-800 bg-red-950/30",
    badge: "bg-red-700 text-white",
    dot: "bg-red-500",
  },
  orange: {
    card: "border-orange-800 bg-orange-950/30",
    badge: "bg-orange-700 text-white",
    dot: "bg-orange-500",
  },
  yellow: {
    card: "border-yellow-800 bg-yellow-950/20",
    badge: "bg-yellow-700 text-white",
    dot: "bg-yellow-500",
  },
  green: {
    card: "border-neutral-800 bg-neutral-900",
    badge: "bg-green-800 text-green-100",
    dot: "bg-green-500",
  },
  done: {
    card: "border-neutral-800 bg-neutral-900 opacity-60",
    badge: "bg-neutral-700 text-neutral-300",
    dot: "bg-neutral-600",
  },
};

// Selisih hari tanggal lokal (tidak memakai toISOString agar tidak geser karena UTC+7)
function daysUntil(dueDate: string, today: string) {
  const [y1, m1, d1] = dueDate.split("-").map(Number);
  const [y2, m2, d2] = today.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((a - b) / 86400000);
}

function getLevel(days: number, done: boolean): Level {
  if (done) return "done";
  if (days < 0) return "overdue";
  if (days <= 3) return "red";
  if (days <= 7) return "orange";
  if (days <= 14) return "yellow";
  return "green";
}

function daysLabel(days: number) {
  if (days < 0) return `Terlambat ${Math.abs(days)} hari`;
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Reminders() {
  const { isOwner } = useAuth();
  const { reminders, loading, addReminder, editReminder, removeReminder } = useReminders();

  const [today, setToday] = useState(getLocalDateStr());
  const [showDone, setShowDone] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [editing, setEditing] = useState<ReminderWithId | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(getLocalDateStr());
  const [note, setNote] = useState("");
  const [important, setImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Perbarui "hari ini" saat tab dibuka kembali (supaya warna tetap akurat setelah lewat tengah malam)
  useEffect(() => {
    function refresh() {
      setToday(getLocalDateStr());
    }
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 60 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(timer);
    };
  }, []);

  function resetForm() {
    setEditing(null);
    setTitle("");
    setDueDate(getLocalDateStr());
    setNote("");
    setImportant(false);
    setShowForm(false);
  }

  function startEdit(r: ReminderWithId) {
    if (!window.confirm("Edit pengingat ini? Form akan terisi otomatis.")) return;
    setEditing(r);
    setTitle(r.title);
    setDueDate(r.dueDate);
    setNote(r.note || "");
    setImportant(!!r.important);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    if (!window.confirm(editing ? "Simpan perubahan pengingat ini?" : "Simpan pengingat baru ini?")) return;

    setSubmitting(true);
    try {
      const payload = { title: title.trim(), dueDate, note: note.trim(), important };
      if (editing) await editReminder(editing.id, payload);
      else await addReminder({ ...payload, done: false, createdAt: Date.now() });
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert("Gagal menyimpan, coba lagi.");
    }
    setSubmitting(false);
  }

  function handleDelete(r: ReminderWithId) {
    if (!window.confirm(`Hapus pengingat "${r.title}"? Data tidak bisa dikembalikan.`)) return;
    removeReminder(r.id);
    if (editing?.id === r.id) resetForm();
  }

  function toggleDone(r: ReminderWithId) {
    editReminder(r.id, { done: !r.done });
  }

  // Aktif: tanggal terdekat dulu (yang terlambat paling atas); tanggal sama -> yang penting dulu
  const { active, finished } = useMemo(() => {
    const a = reminders
      .filter((r) => !r.done)
      .sort((x, y) => {
        if (x.dueDate !== y.dueDate) return x.dueDate.localeCompare(y.dueDate);
        if (!!x.important !== !!y.important) return x.important ? -1 : 1;
        return (x.createdAt ?? 0) - (y.createdAt ?? 0);
      });
    const f = reminders
      .filter((r) => r.done)
      .sort((x, y) => y.dueDate.localeCompare(x.dueDate));
    return { active: a, finished: f };
  }, [reminders]);

  const urgentCount = active.filter((r) => daysUntil(r.dueDate, today) <= 3).length;

  function renderItem(r: ReminderWithId) {
    const days = daysUntil(r.dueDate, today);
    const level = getLevel(days, r.done);
    const style = LEVEL_STYLE[level];

    return (
      <div
        key={r.id}
        className={`flex items-start justify-between gap-3 rounded-md border p-3 ${style.card}`}
      >
        <div className="flex min-w-0 items-start gap-3">
          {isOwner && (
            <input
              type="checkbox"
              checked={r.done}
              onChange={() => toggleDone(r)}
              aria-label={r.done ? "Tandai belum selesai" : "Tandai selesai"}
              className="mt-1 h-4 w-4 shrink-0 accent-green-600"
            />
          )}
          <div className="min-w-0">
            <p
              className={`break-words text-sm font-medium ${
                r.done ? "text-neutral-500 line-through" : "text-white"
              }`}
            >
              {r.important && <span className="mr-1 text-amber-400">★</span>}
              {r.title}
            </p>
            <p className="break-words text-xs text-neutral-500">
              {formatDate(r.dueDate)}
              {r.note && ` · ${r.note}`}
            </p>
            {isOwner && (
              <div className="mt-1 flex gap-3">
                <button
                  onClick={() => startEdit(r)}
                  className="text-xs text-neutral-500 hover:text-blue-400"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(r)}
                  className="text-xs text-neutral-500 hover:text-red-500"
                >
                  Hapus
                </button>
              </div>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium ${style.badge}`}
        >
          {r.done ? "Selesai" : daysLabel(days)}
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-3 rounded-lg border border-neutral-800 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">
          Pengingat
          {urgentCount > 0 && (
            <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white">
              {urgentCount} mendesak
            </span>
          )}
        </h2>
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
        <form
          onSubmit={handleSubmit}
          className="space-y-2 rounded-md border border-neutral-800 bg-neutral-900 p-3"
        >
          <p className="text-xs text-neutral-400">
            {editing ? `Mengedit: ${editing.title}` : "Pengingat baru"}
          </p>
          <input
            type="text"
            placeholder="Judul (mis. Paket data habis)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
            required
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
            required
          />
          <input
            type="text"
            placeholder="Catatan (opsional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={important}
              onChange={(e) => setImportant(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            Tandai penting ★
          </label>
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

      {loading ? (
        <p className="text-sm text-neutral-500">Memuat...</p>
      ) : active.length === 0 ? (
        <p className="text-sm text-neutral-600">Tidak ada pengingat aktif.</p>
      ) : (
        <div className="space-y-2">{active.map(renderItem)}</div>
      )}

      {finished.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            {showDone ? "Sembunyikan" : "Tampilkan"} yang selesai ({finished.length})
          </button>
          {showDone && <div className="space-y-2">{finished.map(renderItem)}</div>}
        </div>
      )}

      {/* Legenda warna */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-neutral-800 pt-2 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${LEVEL_STYLE.red.dot}`} /> ≤ 3 hari / terlambat
        </span>
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${LEVEL_STYLE.orange.dot}`} /> 4–7 hari
        </span>
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${LEVEL_STYLE.yellow.dot}`} /> 8–14 hari
        </span>
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${LEVEL_STYLE.green.dot}`} /> &gt; 14 hari
        </span>
      </div>
    </div>
  );
}