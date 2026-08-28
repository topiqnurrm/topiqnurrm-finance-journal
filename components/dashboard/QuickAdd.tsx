"use client";

import Link from "next/link";

export default function QuickAdd() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href="/finance"
        className="rounded-lg bg-blue-600 py-3 text-center text-sm font-medium text-white"
      >
        + Transaksi
      </Link>
      <Link
        href="/journal"
        className="rounded-lg bg-purple-600 py-3 text-center text-sm font-medium text-white"
      >
        + Jurnal
      </Link>
      <Link
        href="/analysis"
        className="rounded-lg bg-neutral-700 py-3 text-center text-sm font-medium text-white"
      >
        Analisis
      </Link>
      <Link
        href="/export"
        className="rounded-lg bg-neutral-700 py-3 text-center text-sm font-medium text-white"
      >
        Export
      </Link>
    </div>
  );
}