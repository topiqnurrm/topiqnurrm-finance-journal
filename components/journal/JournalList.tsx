"use client";
 
import { useJournal } from "@/lib/hooks/useJournal";
 
export default function JournalList({ isOwner }: { isOwner: boolean }) {
  const { entries, loading, removeEntry } = useJournal();
 
  if (loading) return <p className="text-sm text-neutral-500">Memuat...</p>;
  if (entries.length === 0)
    return <p className="text-sm text-neutral-500">Belum ada jurnal.</p>;
 
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-md border border-neutral-800 p-3"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
              {entry.categoryName}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">{entry.date}</span>
              {isOwner && (
                <button
                  onClick={() => entry.id && removeEntry(entry.id)}
                  className="text-xs text-neutral-500 hover:text-red-500"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm text-neutral-200">{entry.content}</p>
        </div>
      ))}
    </div>
  );
}
