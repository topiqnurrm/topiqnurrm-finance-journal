"use client";

import { useEffect, useRef, useState } from "react";

export const OH_PAGE_SIZE = 15;

// Pagination sederhana: maksimal 15 catatan per halaman.
// resetKey: kalau berubah (mis. ganti filter), kembali ke halaman 1.
export function usePaged<T>(items: T[], resetKey: string = "") {
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / OH_PAGE_SIZE));
  const current = Math.min(page, totalPages); // kalau data berkurang, jangan melewati halaman terakhir
  const start = (current - 1) * OH_PAGE_SIZE;
  const pageItems = items.slice(start, start + OH_PAGE_SIZE);

  function goTo(n: number) {
    setPage(Math.min(Math.max(1, n), totalPages));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return { topRef, pageItems, page: current, totalPages, total: items.length, start, goTo };
}

interface PagerProps {
  page: number;
  totalPages: number;
  total: number;
  start: number;
  goTo: (n: number) => void;
}

export default function OhPager({ page, totalPages, total, start, goTo }: PagerProps) {
  if (total <= OH_PAGE_SIZE) return null;
  const from = start + 1;
  const to = Math.min(start + OH_PAGE_SIZE, total);
  const btn = "rounded-md bg-neutral-800 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-700 disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800 pt-3">
      <p className="text-xs text-neutral-500">
        {from}–{to} dari {total}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => goTo(page - 1)} disabled={page <= 1} className={btn}>
          ‹ Sebelumnya
        </button>
        <span className="text-xs text-neutral-400">
          {page} / {totalPages}
        </span>
        <button type="button" onClick={() => goTo(page + 1)} disabled={page >= totalPages} className={btn}>
          Berikutnya ›
        </button>
      </div>
    </div>
  );
}