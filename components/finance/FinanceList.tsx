"use client";

import { useEffect, useState } from "react";
import { useFinance } from "@/lib/hooks/useFinance";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Transaction,
  getCategoryLabel,
  isCarryover,
} from "@/lib/types/finance";
import { getAmountDisplay } from "@/lib/utils/finance";
import { AMOUNT_TONE_CLASS } from "@/components/ui/amountTone";
import { SortMode } from "@/components/ui/SortModeToggle";

const PAGE_SIZE = 50;
const CATEGORY_LIMIT = 6;

type EditableTransaction = Transaction & { id: string };

interface Props {
  isOwner: boolean;
  selectedDate: string;
  sortMode: SortMode;
  onEdit?: (t: EditableTransaction) => void;
  editingId?: string | null;
}

// Pilihan dropdown: "expense:<kategori>" dan "income:<kategori|general>"
const EXPENSE_OPTIONS = EXPENSE_CATEGORIES.map((c) => ({
  value: `expense:${c.value}`,
  label: c.label,
}));
const INCOME_OPTIONS = INCOME_CATEGORIES.map((c) => ({
  value: `income:${c.value || "general"}`,
  label: c.value ? c.label : "Pemasukan (biasa)",
}));

// Terbaru di atas: tanggal desc, lalu waktu input desc
function sortNewest(a: Transaction, b: Transaction) {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  return (b.createdAt ?? 0) - (a.createdAt ?? 0);
}

function matchesCategory(t: Transaction, key: string) {
  const [type, cat] = key.split(":");
  if (isCarryover(t)) return type === "carryover";
  if (t.type !== type) return false;
  if (type === "income" && cat === "general") return !t.category;
  return t.category === cat;
}

export default function FinanceList({ isOwner, selectedDate, sortMode, onEdit, editingId }: Props) {
  const { transactions, loading, removeTransaction } = useFinance();
  const [page, setPage] = useState(0);
  const [categoryKey, setCategoryKey] = useState<string>(EXPENSE_OPTIONS[0].value);

  useEffect(() => {
    setPage(0);
  }, [selectedDate]);

  if (loading) return <p className="text-sm text-neutral-500">Memuat...</p>;

  function handleEdit(t: EditableTransaction) {
    if (!onEdit) return;
    if (window.confirm("Edit transaksi ini? Form akan terisi otomatis.")) {
      onEdit(t);
    }
  }

  function handleDelete(id: string) {
    if (window.confirm("Yakin mau hapus transaksi ini? Data tidak bisa dikembalikan.")) {
      removeTransaction(id);
    }
  }

  function renderRow(t: EditableTransaction) {
    const amount = getAmountDisplay(t);
    const isBeingEdited = editingId === t.id;
    return (
      <div
        key={t.id}
        className={`flex items-center justify-between rounded-md border p-3 ${
          isBeingEdited ? "border-blue-500 bg-neutral-900" : "border-neutral-800"
        }`}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium">{getCategoryLabel(t.type, t.category)}</p>
          <p className="text-xs text-neutral-500">
            {t.date} {t.note && `· ${t.note}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-semibold ${AMOUNT_TONE_CLASS[amount.tone]}`}
          >
            {amount.text}
          </span>
          {isOwner && onEdit && (
            <button
              onClick={() => handleEdit(t)}
              className="text-xs text-neutral-500 hover:text-blue-400"
            >
              Edit
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => t.id && handleDelete(t.id)}
              className="text-xs text-neutral-500 hover:text-red-500"
            >
              Hapus
            </button>
          )}
        </div>
      </div>
    );
  }

  // ===== MODE PER KATEGORI: pilih 1 kategori, tanpa pagination, maks 6 terbaru =====
  if (sortMode === "category") {
    const items = transactions
      .filter((t) => matchesCategory(t, categoryKey))
      .sort(sortNewest);

    return (
      <div className="space-y-3">
        <select
          value={categoryKey}
          onChange={(e) => setCategoryKey(e.target.value)}
          className="w-full rounded-md bg-neutral-800 p-2 text-sm"
        >
          <optgroup label="Pengeluaran">
            {EXPENSE_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Pemasukan">
            {INCOME_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Sisa Bulan">
            <option value="carryover:all">Sisa Dibawa ke Bulan Depan</option>
          </optgroup>
        </select>

        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">Belum ada transaksi di kategori ini.</p>
        ) : (
          <>
            <p className="text-xs text-neutral-500">
              {items.length > CATEGORY_LIMIT
                ? `${CATEGORY_LIMIT} terbaru dari ${items.length} transaksi`
                : `${items.length} transaksi`}
            </p>
            <div className="space-y-2">{items.slice(0, CATEGORY_LIMIT).map(renderRow)}</div>
          </>
        )}
      </div>
    );
  }

  // ===== MODE PER TANGGAL (seperti sebelumnya) =====
  const dayTransactions = transactions.filter((t) => t.date === selectedDate);

  if (dayTransactions.length === 0)
    return <p className="text-sm text-neutral-500">Belum ada transaksi di tanggal ini.</p>;

  const totalPages = Math.max(1, Math.ceil(dayTransactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = dayTransactions.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">{paginated.map(renderRow)}</div>

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
            Halaman {currentPage + 1} dari {totalPages} · {dayTransactions.length} transaksi
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