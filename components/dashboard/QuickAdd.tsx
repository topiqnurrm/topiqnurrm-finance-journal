"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";

export default function QuickAdd() {
  const { isOwner } = useAuth();

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Review Detail: khusus admin, tombol disembunyikan untuk user lain */}
      {isOwner && (
        <Link
          href="/review"
          className="col-span-2 rounded-lg bg-teal-600 py-3 text-center text-sm font-medium text-white"
        >
          Review Detail <span className="text-xs font-normal text-teal-100">(admin only)</span>
        </Link>
      )}
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