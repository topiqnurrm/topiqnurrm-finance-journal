"use client";
 
import { useState } from "react";
import { JournalCategory } from "@/lib/types/journal";
 
interface Props {
  categories: (JournalCategory & { id: string })[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  onAddCategory: (name: string) => Promise<any>;
}
 
export default function CategoryPicker({
  categories,
  selectedId,
  onSelect,
  onAddCategory,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
 
  async function handleAddNew() {
    if (!newName.trim()) return;
    setSubmitting(true);
    const ref = await onAddCategory(newName.trim());
    onSelect(ref.id, newName.trim());
    setNewName("");
    setAdding(false);
    setSubmitting(false);
  }
 
  if (adding) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          autoFocus
          placeholder="Nama kategori baru"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 rounded-md bg-neutral-800 p-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAddNew}
          disabled={submitting}
          className="rounded-md bg-blue-600 px-3 text-sm text-white disabled:opacity-50"
        >
          Tambah
        </button>
        <button
          type="button"
          onClick={() => setAdding(false)}
          className="rounded-md bg-neutral-800 px-3 text-sm text-neutral-400"
        >
          Batal
        </button>
      </div>
    );
  }
 
  return (
    <div className="flex gap-2">
      <select
        value={selectedId}
        onChange={(e) => {
          const cat = categories.find((c) => c.id === e.target.value);
          if (cat) onSelect(cat.id, cat.name);
        }}
        className="flex-1 rounded-md bg-neutral-800 p-2 text-sm"
      >
        <option value="">-- Pilih kategori --</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="rounded-md bg-neutral-800 px-3 text-sm text-neutral-300"
      >
        + Baru
      </button>
    </div>
  );
}
