"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Reminder } from "@/lib/types/reminder";
import { addItem, updateItem, deleteItem } from "@/lib/firebase/firestore";
import { EMPTY_ARCHIVE, LoadedArchive, extrasLockedMessage, isArchivedId, loadArchive } from "@/lib/archive";

// Pengingat bulan-bulan lama diambil dari file arsip (lib/archive/months/*.ts); Firebase hanya dibaca mulai
// archive.extrasLiveStart (biasanya LIVE_START). Pengingat dikelompokkan per bulan menurut tanggal jatuh tempo.
export function useReminders() {
  const [archive, setArchive] = useState<LoadedArchive | null>(null);
  const [live, setLive] = useState<(Reminder & { id: string })[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadArchive()
      .then((a) => {
        if (!cancelled) setArchive(a);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setArchive(EMPTY_ARCHIVE);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const start = archive?.extrasLiveStart;

  useEffect(() => {
    if (start === undefined) return; // tunggu arsip, supaya tahu batas bacanya
    setLiveLoading(true);
    // 1 field (dueDate) saja, tidak perlu composite index
    const unsub = onSnapshot(
      query(collection(db, "reminders"), where("dueDate", ">=", start)),
      (snap) => {
        setLive(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Reminder & { id: string })[]);
        setLiveLoading(false);
      },
      (err) => {
        console.error(err);
        setLiveLoading(false);
      }
    );
    return () => unsub();
  }, [start]);

  // Terbaru di atas (createdAt desc), sama seperti sebelumnya; arsip selalu lebih lama
  const reminders = useMemo(
    () => [...[...live].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)), ...(archive?.reminders ?? [])],
    [live, archive]
  );
  const loading = archive === null || liveLoading;

  const locked = start ?? "";

  const addReminder = async (data: Omit<Reminder, "id">) => {
    if (data.dueDate < locked) {
      window.alert(extrasLockedMessage(locked));
      return null;
    }
    return addItem("reminders", data);
  };

  const editReminder = async (id: string, data: Partial<Reminder>) => {
    if (isArchivedId(id) || (data.dueDate && data.dueDate < locked)) {
      window.alert(extrasLockedMessage(locked));
      return;
    }
    return updateItem("reminders", id, data);
  };

  const removeReminder = async (id: string) => {
    if (isArchivedId(id)) {
      window.alert(extrasLockedMessage(locked));
      return;
    }
    return deleteItem("reminders", id);
  };

  return { reminders, loading, addReminder, editReminder, removeReminder };
}