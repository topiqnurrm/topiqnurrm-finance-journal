"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Asset } from "@/lib/types/asset";
import { addItem, updateItem, deleteItem } from "@/lib/firebase/firestore";
import { EMPTY_ARCHIVE, LoadedArchive, extrasLockedMessage, isArchivedId, loadArchive } from "@/lib/archive";

// Aset bulan-bulan lama diambil dari file arsip (lib/archive/months/*.ts); Firebase hanya dibaca mulai
// archive.extrasLiveStart (biasanya LIVE_START). Aset dikelompokkan per bulan menurut tanggal beli / dapat.
export function useAssets() {
  const [archive, setArchive] = useState<LoadedArchive | null>(null);
  const [live, setLive] = useState<(Asset & { id: string })[]>([]);
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
    // 1 field (date) saja, tidak perlu composite index
    const unsub = onSnapshot(
      query(collection(db, "assets"), where("date", ">=", start)),
      (snap) => {
        setLive(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Asset & { id: string })[]);
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
  const assets = useMemo(
    () => [...[...live].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)), ...(archive?.assets ?? [])],
    [live, archive]
  );
  const loading = archive === null || liveLoading;

  const locked = start ?? "";

  const addAsset = async (data: Omit<Asset, "id">) => {
    if (data.date < locked) {
      window.alert(extrasLockedMessage(locked));
      return null;
    }
    return addItem("assets", data);
  };

  const editAsset = async (id: string, data: Partial<Asset>) => {
    if (isArchivedId(id) || (data.date && data.date < locked)) {
      window.alert(extrasLockedMessage(locked));
      return;
    }
    return updateItem("assets", id, data);
  };

  const removeAsset = async (id: string) => {
    if (isArchivedId(id)) {
      window.alert(extrasLockedMessage(locked));
      return;
    }
    return deleteItem("assets", id);
  };

  return { assets, loading, addAsset, editAsset, removeAsset };
}