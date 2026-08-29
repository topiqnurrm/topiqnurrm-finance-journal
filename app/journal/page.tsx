"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import JournalForm from "@/components/journal/JournalForm";
import JournalList from "@/components/journal/JournalList";
import BackButton from "@/components/ui/BackButton";
import { JournalEntry } from "@/lib/types/journal";

type EditableEntry = JournalEntry & { id: string };

export default function JournalPage() {
  const { isOwner } = useAuth();
  const [editingEntry, setEditingEntry] = useState<EditableEntry | null>(null);

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
      <JournalList
        isOwner={isOwner}
        onEdit={isOwner ? setEditingEntry : undefined}
        editingId={editingEntry?.id ?? null}
      />
    </div>
  );
}