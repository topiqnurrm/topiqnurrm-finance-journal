"use client";
 
import { useState } from "react";
import { useJournal } from "@/lib/hooks/useJournal";
import CategoryPicker from "./CategoryPicker";
 
export default function JournalForm() {
  const { categories, addEntry, addCategory } = useJournal();
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !content.trim()) return;
    setSubmitting(true);
    await addEntry({
      categoryId,
      categoryName,
      content: content.trim(),
      date,
      createdAt: Date.now(),
    });
    setContent("");
    setSubmitting(false);
  }
 
  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-neutral-800 p-4">
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
 
      <button
        type="submit"
        disabled={submitting || !categoryId}
        className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Menyimpan..." : "Simpan Jurnal"}
      </button>
    </form>
  );
}
