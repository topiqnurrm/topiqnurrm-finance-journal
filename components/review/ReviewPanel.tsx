"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinance } from "@/lib/hooks/useFinance";
import { useJournal } from "@/lib/hooks/useJournal";
import { formatRupiah } from "@/lib/utils/currency";
import { EXPENSE_CATEGORIES } from "@/lib/types/finance";

const PAGE_SIZE = 20;

type KindFilter = "all" | "transaction" | "journal";

type ReviewItem =
  | {
      kind: "transaction";
      key: string;
      date: string;
      createdAt: number;
      categoryValue: string; // "tx:income" | "tx:<kategori>"
      categoryLabel: string;
      txType: "income" | "expense";
      amount: number;
      note: string;
    }
  | {
      kind: "journal";
      key: string;
      date: string;
      createdAt: number;
      categoryValue: string; // "jr:<categoryId>"
      categoryLabel: string;
      content: string;
    };

// Terbaru di atas: tanggal desc, lalu waktu input desc
function sortNewest(a: ReviewItem, b: ReviewItem) {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  return b.createdAt - a.createdAt;
}

export default function ReviewPanel() {
  const { transactions, loading: loadingFinance } = useFinance();
  const { entries, categories, loading: loadingJournal } = useJournal();

  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [category, setCategory] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);

  const rangeActive = !!(from || to);
  const invalidRange = !!(from && to && from > to);
  const anyFilter = !!(search.trim() || kind !== "all" || category !== "all" || rangeActive);

  // Setiap filter berubah, kembali ke halaman pertama
  useEffect(() => {
    setPage(0);
  }, [search, kind, category, from, to]);

  // Gabungkan transaksi + jurnal jadi satu daftar
  const items = useMemo<ReviewItem[]>(() => {
    const tx = transactions.map((t): ReviewItem => {
      const isIncome = t.type === "income";
      return {
        kind: "transaction",
        key: `tx-${t.id}`,
        date: t.date,
        createdAt: t.createdAt ?? 0,
        categoryValue: isIncome ? "tx:income" : `tx:${t.category ?? "lainnya"}`,
        categoryLabel: isIncome
          ? "Pemasukan"
          : EXPENSE_CATEGORIES.find((c) => c.value === t.category)?.label ?? "Lainnya",
        txType: t.type,
        amount: t.amount,
        note: t.note ?? "",
      };
    });
    const jr = entries.map((e): ReviewItem => ({
      kind: "journal",
      key: `jr-${e.id}`,
      date: e.date,
      createdAt: e.createdAt ?? 0,
      categoryValue: `jr:${e.categoryId}`,
      categoryLabel: e.categoryName,
      content: e.content,
    }));
    return [...tx, ...jr];
  }, [transactions, entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Kalau pencarian berupa angka (mis. "500000" atau "500.000"), cocokkan ke nominal
    const amountQuery = /^(rp)?[\s\d.,]+$/i.test(q) ? q.replace(/\D/g, "") : "";

    return items
      .filter((it) => {
        if (kind !== "all" && it.kind !== kind) return false;
        if (category !== "all" && it.categoryValue !== category) return false;
        if (from && it.date < from) return false;
        if (to && it.date > to) return false;

        if (q) {
          const haystack =
            it.kind === "transaction"
              ? `${it.note} ${it.categoryLabel} ${it.date} ${it.amount} ${formatRupiah(it.amount)}`
              : `${it.content} ${it.categoryLabel} ${it.date}`;
          const textMatch = haystack.toLowerCase().includes(q);
          const amountMatch =
            it.kind === "transaction" && amountQuery !== "" && String(it.amount).includes(amountQuery);
          if (!textMatch && !amountMatch) return false;
        }
        return true;
      })
      .sort(sortNewest);
  }, [items, search, kind, category, from, to]);

  const txOptions = [
    { value: "tx:income", label: "Pemasukan" },
    ...EXPENSE_CATEGORIES.map((c) => ({ value: `tx:${c.value}`, label: c.label })),
  ];
  const journalOptions = categories.map((c) => ({ value: `jr:${c.id}`, label: c.name }));

  function changeKind(next: KindFilter) {
    setKind(next);
    // Reset kategori kalau tidak cocok lagi dengan jenis yang dipilih
    if (category !== "all") {
      const isTx = category.startsWith("tx:");
      if ((next === "journal" && isTx) || (next === "transaction" && !isTx)) setCategory("all");
    }
  }

  function resetFilters() {
    setSearch("");
    setKind("all");
    setCategory("all");
    setFrom("");
    setTo("");
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  // Kalau rentang tanggal aktif: tampil semua tanpa pagination
  const visible = rangeActive
    ? filtered
    : filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const loading = loadingFinance || loadingJournal;

  function renderRow(it: ReviewItem) {
    if (it.kind === "transaction") {
      return (
        <div
          key={it.key}
          className="flex items-center justify-between gap-3 rounded-md border border-neutral-800 p-3"
        >
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-blue-950 px-1.5 py-0.5 text-[10px] text-blue-300">
                Transaksi
              </span>
              <span className="text-sm font-medium">{it.categoryLabel}</span>
            </div>
            <p className="break-words text-xs text-neutral-500">
              {it.date} {it.note && `· ${it.note}`}
            </p>
          </div>
          <span
            className={`shrink-0 text-sm font-semibold ${
              it.txType === "income" ? "text-green-500" : "text-red-500"
            }`}
          >
            {it.txType === "income" ? "+" : "-"}
            {formatRupiah(it.amount)}
          </span>
        </div>
      );
    }
    return (
      <div key={it.key} className="rounded-md border border-neutral-800 p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded bg-purple-950 px-1.5 py-0.5 text-[10px] text-purple-300">
              Jurnal
            </span>
            <span className="truncate rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
              {it.categoryLabel}
            </span>
          </div>
          <span className="shrink-0 text-xs text-neutral-500">{it.date}</span>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm text-neutral-200">{it.content}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pencarian */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari catatan, isi jurnal, atau nominal (mis. servis, 500000)"
        className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
      />

      {/* Jenis: Semua / Transaksi / Jurnal */}
      <div className="flex gap-2">
        {(
          [
            { value: "all", label: "Semua" },
            { value: "transaction", label: "Transaksi" },
            { value: "journal", label: "Jurnal" },
          ] as { value: KindFilter; label: string }[]
        ).map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => changeKind(k.value)}
            className={`flex-1 rounded-md py-2 text-sm ${
              kind === k.value ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* Kategori */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
      >
        <option value="all">Semua kategori</option>
        {kind !== "journal" && (
          <optgroup label="Transaksi">
            {txOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        )}
        {kind !== "transaction" && journalOptions.length > 0 && (
          <optgroup label="Jurnal">
            {journalOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {/* Rentang tanggal */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-neutral-500">Dari</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
            />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-neutral-500">Sampai</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full min-w-0 rounded-md bg-neutral-800 p-2 text-sm"
            />
          </div>
        </div>
        {invalidRange && (
          <p className="text-xs text-red-400">Tanggal "Dari" lebih besar dari "Sampai".</p>
        )}
      </div>

      {/* Info hasil + reset */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          {loading
            ? "Memuat..."
            : rangeActive
            ? `${filtered.length} hasil (semua ditampilkan)`
            : `${filtered.length} hasil`}
        </p>
        {anyFilter && (
          <button onClick={resetFilters} className="text-xs text-blue-400 hover:text-blue-300">
            Reset filter
          </button>
        )}
      </div>

      {/* Daftar */}
      {loading ? null : filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">Tidak ada data yang cocok.</p>
      ) : (
        <div className="space-y-2">{visible.map(renderRow)}</div>
      )}

      {/* Pagination: hanya kalau tidak memakai rentang tanggal */}
      {!rangeActive && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ‹ Sebelumnya
          </button>
          <span className="text-xs text-neutral-500">
            Halaman {currentPage + 1} dari {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Selanjutnya ›
          </button>
        </div>
      )}
    </div>
  );
}