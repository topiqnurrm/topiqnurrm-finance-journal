"use client";

import { useEffect, useState } from "react";
import { useJournal } from "@/lib/hooks/useJournal";
import { JournalEntry } from "@/lib/types/journal";
import { SortMode } from "@/components/ui/SortModeToggle";

const PAGE_SIZE = 50;
const CATEGORY_LIMIT = 6;

type EditableEntry = JournalEntry & { id: string };

interface Props {
  isOwner: boolean;
  selectedDate: string;
  sortMode: SortMode;
  onEdit?: (entry: EditableEntry) => void;
  editingId?: string | null;
}

// Terbaru di atas: tanggal desc, lalu waktu input desc
function sortNewest(a: JournalEntry, b: JournalEntry) {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  return (b.createdAt ?? 0) - (a.createdAt ?? 0);
}

export default function JournalList({ isOwner, selectedDate, sortMode, onEdit, editingId }: Props) {
  const { entries, categories, loading, removeEntry } = useJournal();
  const [page, setPage] = useState(0);
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    setPage(0);
  }, [selectedDate]);

  if (loading) return <p className="text-sm text-neutral-500">Memuat...</p>;

  function handleEdit(entry: EditableEntry) {
    if (!onEdit) return;
    if (window.confirm("Edit jurnal ini? Form akan terisi otomatis.")) {
      onEdit(entry);
    }
  }

  function handleDelete(id: string) {
    if (window.confirm("Yakin mau hapus jurnal ini? Data tidak bisa dikembalikan.")) {
      removeEntry(id);
    }
  }

  function renderRow(entry: EditableEntry) {
    const isBeingEdited = editingId === entry.id;
    return (
      <div
        key={entry.id}
        className={`rounded-md border p-3 ${
          isBeingEdited ? "border-blue-500 bg-neutral-900" : "border-neutral-800"
        }`}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
            {entry.categoryName}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">{entry.date}</span>
            {isOwner && onEdit && (
              <button
                onClick={() => handleEdit(entry)}
                className="text-xs text-neutral-500 hover:text-blue-400"
              >
                Edit
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => entry.id && handleDelete(entry.id)}
                className="text-xs text-neutral-500 hover:text-red-500"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm text-neutral-200">{entry.content}</p>
      </div>
    );
  }

  // ===== MODE PER KATEGORI: pilih 1 kategori, tanpa pagination, maks 6 terbaru =====
  if (sortMode === "category") {
    if (categories.length === 0)
      return <p className="text-sm text-neutral-500">Belum ada kategori jurnal.</p>;

    // Kalau belum memilih (atau kategori yang dipilih tidak ada), pakai kategori pertama
    const activeId = categories.some((c) => c.id === categoryId) ? categoryId : categories[0].id;
    const items = entries.filter((e) => e.categoryId === activeId).sort(sortNewest);

    return (
      <div className="space-y-3">
        <select
          value={activeId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-md bg-neutral-800 p-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">Belum ada jurnal di kategori ini.</p>
        ) : (
          <>
            <p className="text-xs text-neutral-500">
              {items.length > CATEGORY_LIMIT
                ? `${CATEGORY_LIMIT} terbaru dari ${items.length} jurnal`
                : `${items.length} jurnal`}
            </p>
            <div className="space-y-2">{items.slice(0, CATEGORY_LIMIT).map(renderRow)}</div>
          </>
        )}
      </div>
    );
  }

  // ===== MODE PER TANGGAL (seperti sebelumnya) =====
  const dayEntries = entries.filter((e) => e.date === selectedDate);

  if (dayEntries.length === 0)
    return <p className="text-sm text-neutral-500">Belum ada jurnal di tanggal ini.</p>;

  const totalPages = Math.max(1, Math.ceil(dayEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = dayEntries.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="space-y-2">{paginated.map(renderRow)}</div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ‹ Sebelumnya
          </button>
          <span className="text-xs text-neutral-500">
            Halaman {currentPage + 1} dari {totalPages} · {dayEntries.length} jurnal
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Selanjutnya ›
          </button>
        </div>
      )}
    </div>
  );
}