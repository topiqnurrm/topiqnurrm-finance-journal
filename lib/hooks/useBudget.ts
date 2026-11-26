"use client";
import { useEffect, useState } from "react";
import { getBudget, setBudget } from "@/lib/firebase/firestore";
import { Budget } from "@/lib/types/finance";
import { LIVE_FROM } from "@/lib/archive/config";
import { EMPTY_ARCHIVE, LoadedArchive, loadArchive } from "@/lib/archive";

// Budget bulan sebelum LIVE_FROM dibaca dari file arsip kalau file bulannya memuat budget ("bg");
// selain itu (bulan berjalan, atau bulan arsip yang belum dimigrasi) dari Firebase.
export function useBudget(monthId: string) {
  const [budget, setBudgetState] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [archive, setArchive] = useState<LoadedArchive | null>(null);

  const needArchive = monthId < LIVE_FROM;

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

  useEffect(() => {
    if (needArchive && archive === null) {
      setLoading(true); // tunggu arsip untuk bulan lama
      return;
    }
    if (needArchive && archive && archive.budgets[monthId] !== undefined) {
      const b = archive.budgets[monthId];
      setBudgetState(b ? { id: monthId, ...b } : null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getBudget(monthId)
      .then((data) => {
        if (cancelled) return;
        setBudgetState(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [monthId, archive, needArchive]);

  const saveBudget = async (data: Omit<Budget, "id">) => {
    if (needArchive) {
      const a = archive ?? (await loadArchive().catch(() => EMPTY_ARCHIVE));
      if (a.budgets[monthId] !== undefined) {
        window.alert(`Budget bulan ${monthId} diambil dari arsip di kode dan tidak bisa diubah dari aplikasi.`);
        return;
      }
    }
    await setBudget(monthId, data);
    setBudgetState({ id: monthId, ...data });
  };

  return { budget, loading, saveBudget };
}