"use client";

import { getAuditStatus } from "@/lib/utils/audit";

// Warna dibuat halus: hanya aksen di sisi kiri item.
// Sebelum audit = hijau (sudah dicek), tanggal audit = kuning, setelah audit = biru (belum dicek).
const COLOR = {
  before: "border-l-emerald-700/70",
  on: "border-l-amber-500/80",
  after: "border-l-sky-700/70",
} as const;

// Untuk kartu dengan border penuh (daftar transaksi/jurnal): aksen kiri tebal
export function auditBorder(date: string, auditDate: string | null): string {
  const s = getAuditStatus(date, auditDate);
  return s === "none" ? "" : `border-l-4 ${COLOR[s]}`;
}

// Untuk item dashboard yang sudah memakai garis kiri tipis: hanya warnanya
export function auditAccent(date: string, auditDate: string | null): string {
  const s = getAuditStatus(date, auditDate);
  return s === "none" ? "border-l-neutral-700" : COLOR[s];
}

function formatLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AuditLegend({ auditDate }: { auditDate: string | null }) {
  if (!auditDate) return null;

  return (
    <div className="space-y-1.5 rounded-md border border-neutral-800 p-3">
      <p className="text-xs text-neutral-400">Audit terakhir: {formatLabel(auditDate)}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-1 rounded bg-emerald-700/70" />
          Sebelum audit (sudah dicek)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-1 rounded bg-amber-500/80" />
          Tanggal audit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-1 rounded bg-sky-700/70" />
          Setelah audit (belum dicek)
        </span>
      </div>
    </div>
  );
}