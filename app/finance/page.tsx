"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import FinanceForm from "@/components/finance/FinanceForm";
import FinanceList from "@/components/finance/FinanceList";
import FinanceSummaryCard from "@/components/finance/FinanceSummaryCard";
import BackButton from "@/components/ui/BackButton";
import DayNav from "@/components/ui/DayNav";
import { Transaction } from "@/lib/types/finance";
import { getLocalDateStr } from "@/lib/utils/date";

type EditableTransaction = Transaction & { id: string };

export default function FinancePage() {
  const { isOwner } = useAuth();
  const [editingTransaction, setEditingTransaction] = useState<EditableTransaction | null>(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-semibold">Keuangan</h1>
      </div>
      <FinanceSummaryCard />
      {isOwner && (
        <FinanceForm
          editingTransaction={editingTransaction}
          onCancelEdit={() => setEditingTransaction(null)}
          onSavedEdit={() => setEditingTransaction(null)}
        />
      )}

      <DayNav selectedDate={selectedDate} onChange={setSelectedDate} />

      <FinanceList
        isOwner={isOwner}
        selectedDate={selectedDate}
        onEdit={isOwner ? setEditingTransaction : undefined}
        editingId={editingTransaction?.id ?? null}
      />
    </div>
  );
}