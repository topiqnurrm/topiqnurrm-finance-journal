"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { JournalEntry, JournalCategory } from "@/lib/types/journal";
import { subscribeToCollection, addItem, updateItem, deleteItem } from "@/lib/firebase/firestore";
import {
  LIVE_START,
  archiveLockedMessage,
  attachJournalCategoryIds,
  isArchivedDate,
  isArchivedId,
  loadArchive,
  ArchivedJournal,
} from "@/lib/archive";

// Bulan sebelum LIVE_FROM (lib/archive/config.ts) diambil dari file arsip; Firebase hanya dibaca mulai LIVE_START.
// Kategori jurnal tetap dari Firebase.
export function useJournal() {
  const [live, setLive] = useState<(JournalEntry & { id: string })[]>([]);
  const [archived, setArchived] = useState<ArchivedJournal[] | null>(null);
  const [categories, setCategories] = useState<(JournalCategory & { id: string })[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    const unsubEntries = onSnapshot(
      query(collection(db, "journals"), where("date", ">=", LIVE_START)),
      (snap) => {
        setLive(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (JournalEntry & { id: string })[]);
        setLiveLoading(false);
      },
      (err) => {
        console.error(err);
        setLiveLoading(false);
      }
    );
    const unsubCategories = subscribeToCollection<JournalCategory>(
      "journalCategories",
      (items) => setCategories(items),
      { orderByField: "createdAt" }
    );

    let cancelled = false;
    loadArchive()
      .then((a) => {
        if (!cancelled) setArchived(a.journals);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setArchived([]);
      });

    return () => {
      cancelled = true;
      unsubEntries();
      unsubCategories();
    };
  }, []);

  const entries = useMemo(
    () => [
      ...[...live].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
      ...(archived ? attachJournalCategoryIds(archived, categories) : []),
    ],
    [live, archived, categories]
  );

  const loading = liveLoading || archived === null;

  const addEntry = async (data: Omit<JournalEntry, "id">) => {
    if (isArchivedDate(data.date)) {
      window.alert(archiveLockedMessage());
      return null;
    }
    return addItem("journals", data);
  };

  const editEntry = async (id: string, data: Partial<JournalEntry>) => {
    if (isArchivedId(id) || (data.date && isArchivedDate(data.date))) {
      window.alert(archiveLockedMessage());
      return;
    }
    return updateItem("journals", id, data);
  };

  const removeEntry = async (id: string) => {
    if (isArchivedId(id)) {
      window.alert(archiveLockedMessage());
      return;
    }
    return deleteItem("journals", id);
  };

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