"use client";
 
import { useAuth } from "@/lib/hooks/useAuth";
import JournalForm from "@/components/journal/JournalForm";
import JournalList from "@/components/journal/JournalList";
 
export default function JournalPage() {
  const { isOwner } = useAuth();
 
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="text-xl font-semibold">Jurnal</h1>
      {isOwner && <JournalForm />}
      <JournalList isOwner={isOwner} />
    </div>
  );
}
