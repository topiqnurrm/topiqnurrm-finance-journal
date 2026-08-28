"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import JournalForm from "@/components/journal/JournalForm";
import JournalList from "@/components/journal/JournalList";
import BackButton from "@/components/ui/BackButton";

export default function JournalPage() {
  const { isOwner } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-semibold">Jurnal</h1>
      </div>
      {isOwner && <JournalForm />}
      <JournalList isOwner={isOwner} />
    </div>
  );
}