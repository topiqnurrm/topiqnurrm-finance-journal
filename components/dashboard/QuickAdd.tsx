"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAccess } from "@/components/auth/AccessGate";

export default function QuickAdd() {
  const { isOwner } = useAuth();
  const { oh } = useAccess();

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Review Detail: bisa dilihat semua user; edit/hapus tetap hanya untuk owner */}
      <Link
        href="/review"
        className="col-span-2 rounded-lg bg-teal-600 py-3 text-center text-sm font-medium text-white"
      >
        Review Detail
      </Link>
      {/* Hanya tampil untuk akun yang boleh melihat Orang Have */}
      {oh === "allowed" && (
        <Link
          href="/orang-have"
          className="col-span-2 rounded-lg bg-indigo-600 py-3 text-center text-sm font-medium text-white"
        >
          Tabungan Bersama Orang Have
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
      {isOwner && (
        <Link
          href="/akses"
          className="col-span-2 rounded-lg bg-neutral-800 py-2 text-center text-xs text-neutral-400"
        >
          Kelola Akses
        </Link>
      )}
    </div>
  );
}