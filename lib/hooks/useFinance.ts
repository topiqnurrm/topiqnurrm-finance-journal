"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Transaction } from "@/lib/types/finance";
import { addItem, updateItem, deleteItem } from "@/lib/firebase/firestore";
import {
  LIVE_START,
  archiveLockedMessage,
  isArchivedDate,
  isArchivedId,
  loadArchive,
} from "@/lib/archive";

// Bulan sebelum LIVE_FROM (lib/archive/config.ts) diambil dari file arsip; Firebase hanya dibaca mulai LIVE_START.
export function useFinance() {
  const [live, setLive] = useState<(Transaction & { id: string })[]>([]);
  const [archived, setArchived] = useState<(Transaction & { id: string })[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    // 1 field (date) saja, tidak perlu composite index
    const unsub = onSnapshot(
      query(collection(db, "finances"), where("date", ">=", LIVE_START)),
      (snap) => {
        setLive(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Transaction & { id: string })[]);
        setLiveLoading(false);
      },
      (err) => {
        console.error(err);
        setLiveLoading(false);
      }
    );
    let cancelled = false;
    loadArchive()
      .then((a) => {
        if (!cancelled) setArchived(a.transactions);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setArchived([]);
      });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  // Terbaru di atas (createdAt desc), sama seperti sebelumnya; arsip selalu lebih lama
  const transactions = useMemo(
    () => [...[...live].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)), ...(archived ?? [])],
    [live, archived]
  );

  const loading = liveLoading || archived === null;

  const addTransaction = async (data: Omit<Transaction, "id">) => {
    if (isArchivedDate(data.date)) {
      window.alert(archiveLockedMessage());
      return null;
    }
    return addItem("finances", data);
  };

  const editTransaction = async (id: string, data: Partial<Transaction>) => {
    if (isArchivedId(id) || (data.date && isArchivedDate(data.date))) {
      window.alert(archiveLockedMessage());
      return;
    }
    return updateItem("finances", id, data);
  };

  const removeTransaction = async (id: string) => {
    if (isArchivedId(id)) {
      window.alert(archiveLockedMessage());
      return;
    }
    return deleteItem("finances", id);
  };

  return { transactions, loading, addTransaction, editTransaction, removeTransaction };
}