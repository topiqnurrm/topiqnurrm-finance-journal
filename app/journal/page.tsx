"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import JournalForm from "@/components/journal/JournalForm";
import JournalList from "@/components/journal/JournalList";
import BackButton from "@/components/ui/BackButton";
import DayNav from "@/components/ui/DayNav";
import SortModeToggle, { SortMode } from "@/components/ui/SortModeToggle";
import { JournalEntry } from "@/lib/types/journal";
import { getLocalDateStr } from "@/lib/utils/date";

type EditableEntry = JournalEntry & { id: string };

export default function JournalPage() {
  const { isOwner } = useAuth();
  const [editingEntry, setEditingEntry] = useState<EditableEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const [sortMode, setSortMode] = useState<SortMode>("date");

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-semibold">Jurnal</h1>
      </div>
      {isOwner && (
        <JournalForm
          editingEntry={editingEntry}
          onCancelEdit={() => setEditingEntry(null)}
          onSavedEdit={() => setEditingEntry(null)}
        />
      )}

      {/* Navigasi tanggal diredupkan saat mode Per Kategori karena tidak dipakai */}
      <div
        className={sortMode === "category" ? "pointer-events-none opacity-40" : ""}
        aria-disabled={sortMode === "category"}
      >
        <DayNav selectedDate={selectedDate} onChange={setSelectedDate} />
      </div>

      <SortModeToggle mode={sortMode} onChange={setSortMode} />

      <JournalList
        isOwner={isOwner}
        selectedDate={selectedDate}
        sortMode={sortMode}
        onEdit={isOwner ? setEditingEntry : undefined}
        editingId={editingEntry?.id ?? null}
      />
    </div>
  );
}