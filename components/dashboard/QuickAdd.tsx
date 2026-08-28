"use client";
 
import Link from "next/link";
 
export default function QuickAdd() {
  return (
    <div className="flex gap-3">
      <Link
        href="/finance"
        className="flex-1 rounded-lg bg-blue-600 py-3 text-center text-sm font-medium text-white"
      >
        + Transaksi
      </Link>
      <Link
        href="/journal"
        className="flex-1 rounded-lg bg-purple-600 py-3 text-center text-sm font-medium text-white"
      >
        + Jurnal
      </Link>
    </div>
  );
}
