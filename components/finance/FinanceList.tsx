"use client";

import { useState } from "react";
import { useFinance } from "@/lib/hooks/useFinance";
import { formatRupiah } from "@/lib/utils/currency";
import { EXPENSE_CATEGORIES, Transaction } from "@/lib/types/finance";

const PAGE_SIZE = 50;

type EditableTransaction = Transaction & { id: string };

interface Props {
  isOwner: boolean;
  onEdit?: (t: EditableTransaction) => void;
  editingId?: string | null;
}

export default function FinanceList({ isOwner, onEdit, editingId }: Props) {
  const { transactions, loading, removeTransaction } = useFinance();
  const [page, setPage] = useState(0);

  if (loading) return <p className="text-sm text-neutral-500">Memuat...</p>;
  if (transactions.length === 0)
    return <p className="text-sm text-neutral-500">Belum ada transaksi.</p>;

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = transactions.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {paginated.map((t) => {
          const categoryLabel = EXPENSE_CATEGORIES.find((c) => c.value === t.category)?.label;
          const isBeingEdited = editingId === t.id;
          return (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-md border p-3 ${
                isBeingEdited ? "border-blue-500 bg-neutral-900" : "border-neutral-800"
              }`}
            >
              <div>
                <p className="text-sm font-medium">
                  {t.type === "income" ? "Pemasukan" : categoryLabel}
                </p>
                <p className="text-xs text-neutral-500">
                  {t.date} {t.note && `· ${t.note}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-semibold ${
                    t.type === "income" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatRupiah(t.amount)}
                </span>
                {isOwner && onEdit && (
                  <button
                    onClick={() => onEdit(t)}
                    className="text-xs text-neutral-500 hover:text-blue-400"
                  >
                    Edit
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={() => t.id && removeTransaction(t.id)}
                    className="text-xs text-neutral-500 hover:text-red-500"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          );
        })}
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
            Halaman {currentPage + 1} dari {totalPages} · {transactions.length} transaksi
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