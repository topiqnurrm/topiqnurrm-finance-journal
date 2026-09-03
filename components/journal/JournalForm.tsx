"use client";

import { useEffect, useState } from "react";
import { useJournal } from "@/lib/hooks/useJournal";
import CategoryPicker from "./CategoryPicker";
import { getLocalDateStr } from "@/lib/utils/date";
import { JournalEntry } from "@/lib/types/journal";

type EditableEntry = JournalEntry & { id: string };

interface Props {
  editingEntry?: EditableEntry | null;
  onCancelEdit?: () => void;
  onSavedEdit?: () => void;
}

export default function JournalForm({ editingEntry, onCancelEdit, onSavedEdit }: Props) {
  const { categories, addEntry, editEntry, addCategory } = useJournal();
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(getLocalDateStr());
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!editingEntry;

  useEffect(() => {
    if (editingEntry) {
      setCategoryId(editingEntry.categoryId);
      setCategoryName(editingEntry.categoryName);
      setContent(editingEntry.content);
      setDate(editingEntry.date);
    } else {
      setCategoryId("");
      setCategoryName("");
      setContent("");
      setDate(getLocalDateStr());
    }
  }, [editingEntry]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !content.trim()) return;

    const confirmMessage = isEditing ? "Simpan perubahan jurnal ini?" : "Simpan jurnal baru ini?";
    if (!window.confirm(confirmMessage)) return;

    setSubmitting(true);

    if (isEditing && editingEntry) {
      await editEntry(editingEntry.id, {
        categoryId,
        categoryName,
        content: content.trim(),
        date,
      });
      onSavedEdit?.();
    } else {
      await addEntry({
        categoryId,
        categoryName,
        content: content.trim(),
        date,
        createdAt: Date.now(),
      });
      setContent("");
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-neutral-800 p-4">
      {isEditing && (
        <p className="text-xs text-blue-400">Mengedit jurnal tanggal {editingEntry?.date}</p>
      )}

      <CategoryPicker
        categories={categories}
        selectedId={categoryId}
        onSelect={(id, name) => {
          setCategoryId(id);
          setCategoryName(name);
        }}
        onAddCategory={addCategory}
      />

      <textarea
        placeholder="Tulis jurnal..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full rounded-md bg-neutral-800 p-2 text-sm"
        required
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full rounded-md bg-neutral-800 p-2 text-sm"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !categoryId}
          className="flex-1 rounded-md bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan Jurnal"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => onCancelEdit?.()}
            className="flex-1 rounded-md bg-neutral-700 py-2 text-sm font-medium text-white"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}