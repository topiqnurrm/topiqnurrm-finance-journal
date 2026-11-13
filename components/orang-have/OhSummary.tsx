"use client";

import { OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { formatRupiah } from "@/lib/utils/currency";
import {
  OH_ACCOUNT_INFO,
  OH_DUE_DAY,
  OH_GRACE_DAY,
  OH_PAYOUT_LABEL,
  OH_PERIOD_END,
  OH_PERIOD_START,
} from "@/lib/orang-have/config";
import { kasSummary, memberTotals, monthLabelLong, poolSummary, projection } from "@/lib/orang-have/calc";

interface Props {
  members: (OhMember & { id: string })[];
  payments: OhPayment[];
  expenses: OhKasExpense[];
  loans: OhLoan[];
}

export default function OhSummary({ members, payments, expenses, loans }: Props) {
  const kas = kasSummary(payments, expenses, loans, members.length);
  const pool = poolSummary(payments, kas.balance, loans);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-400">Total dana kelompok</p>
          <p className="break-words text-lg font-semibold text-green-500">{formatRupiah(pool.total)}</p>
          <p className="mt-1 text-xs text-neutral-600">Tabungan + saldo kas</p>
        </div>
        <div className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-400">Sedang dipinjam</p>
          <p className="break-words text-lg font-semibold text-amber-400">{formatRupiah(pool.outstanding)}</p>
          <p className="mt-1 break-words text-xs text-neutral-600">Tersedia {formatRupiah(pool.available)}</p>
        </div>
      </div>

      {/* Progress per anggota */}
      <div className="min-w-0 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-semibold text-white">Progress per anggota</h2>
        {members.length === 0 ? (
          <p className="text-sm text-neutral-500">Belum ada anggota.</p>
        ) : (
          members.map((m) => {
            const t = memberTotals(m, payments);
            return (
              <div key={m.id} className="min-w-0 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="break-words text-sm font-medium text-white">{m.name}</p>
                  <p className="shrink-0 text-xs text-neutral-400">{t.progress}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                  <div className="h-full rounded-full bg-green-600" style={{ width: `${t.progress}%` }} />
                </div>
                <p className="break-words text-xs text-neutral-500">
                  {formatRupiah(t.savings)} dari target {formatRupiah(m.target)} · kurang {formatRupiah(t.remaining)} ·{" "}
                  {t.paidMonths} bulan tercatat
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Proyeksi pembagian */}
      <div className="min-w-0 space-y-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-semibold text-white">Estimasi pembagian {OH_PAYOUT_LABEL}</h2>
        <p className="text-xs text-neutral-600">
          Tabungan yang sudah disetor + bagian sisa kas (dibagi rata, kondisi saat ini). Berubah seiring setoran dan kas.
        </p>
        {members.map((m) => {
          const p = projection(m, payments, kas.share);
          return (
            <div key={m.id} className="flex items-start justify-between gap-3 border-t border-neutral-800 pt-2">
              <div className="min-w-0">
                <p className="break-words text-sm text-white">{m.name}</p>
                <p className="break-words text-xs text-neutral-500">
                  {formatRupiah(p.savings)} + kas {formatRupiah(p.kasShare)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-green-500">{formatRupiah(p.estimate)}</p>
            </div>
          );
        })}
      </div>

      {/* Ketentuan */}
      <div className="min-w-0 space-y-1 rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm">
        <h2 className="mb-1 text-sm font-semibold text-white">Ketentuan</h2>
        <Row k="Periode" v={`${monthLabelLong(OH_PERIOD_START)} – ${monthLabelLong(OH_PERIOD_END)}`} />
        <Row k="Waktu pembayaran" v={`Tanggal ${OH_DUE_DAY} bulan berjalan – ${OH_GRACE_DAY} bulan berikutnya`} />
        <Row k="Cara bayar" v="Transfer, wajib menyertakan bukti TF" />
        <Row k="Rekening" v={OH_ACCOUNT_INFO} />
        <Row k="Penggunaan kas" v="Biaya admin rekening, transfer, dan operasional (wajib ada bukti)" />
        <Row k="Pembagian" v={`${OH_PAYOUT_LABEL}; sisa kas dibagi rata ke semua anggota`} />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-neutral-500">{k}</span>
      <span className="min-w-0 break-words text-right text-neutral-200">{v}</span>
    </div>
  );
}
