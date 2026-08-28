"use client";
 
import { useEffect, useState } from "react";
import { JournalEntry, JournalCategory } from "@/lib/types/journal";
import { subscribeToCollection, addItem, updateItem, deleteItem } from "@/lib/firebase/firestore";
 
export function useJournal() {
  const [entries, setEntries] = useState<(JournalEntry & { id: string })[]>([]);
  const [categories, setCategories] = useState<(JournalCategory & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const unsubEntries = subscribeToCollection<JournalEntry>(
      "journals",
      (items) => {
        setEntries(items);
        setLoading(false);
      },
      { orderByField: "createdAt" }
    );
    const unsubCategories = subscribeToCollection<JournalCategory>(
      "journalCategories",
      (items) => setCategories(items),
      { orderByField: "createdAt" }
    );
    return () => {
      unsubEntries();
      unsubCategories();
    };
  }, []);
 
  const addEntry = (data: Omit<JournalEntry, "id">) => addItem("journals", data);
  const editEntry = (id: string, data: Partial<JournalEntry>) =>
    updateItem("journals", id, data);
  const removeEntry = (id: string) => deleteItem("journals", id);
 
  const addCategory = (name: string) =>
    addItem("journalCategories", { name, createdAt: Date.now() });
 
  return {
    entries,
    categories,
    loading,
    addEntry,
    editEntry,
    removeEntry,
    addCategory,
  };
}
