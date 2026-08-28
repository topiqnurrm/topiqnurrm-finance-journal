"use client";

import { useState } from "react";
import { useJournal } from "@/lib/hooks/useJournal";

const PAGE_SIZE = 50;

export default function JournalList({ isOwner }: { isOwner: boolean }) {
  const { entries, loading, removeEntry } = useJournal();
  const [page, setPage] = useState(0);

  if (loading) return <p className="text-sm text-neutral-500">Memuat...</p>;
  if (entries.length === 0)
    return <p className="text-sm text-neutral-500">Belum ada jurnal.</p>;

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = entries.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {paginated.map((entry) => (
          <div key={entry.id} className="rounded-md border border-neutral-800 p-3">
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
            Halaman {currentPage + 1} dari {totalPages} · {entries.length} jurnal
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