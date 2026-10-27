"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { subscribeToCollection } from "@/lib/firebase/firestore";
import { Transaction } from "@/lib/types/finance";
import { JournalEntry, JournalCategory } from "@/lib/types/journal";

// Rentang tanggal untuk query Firestore (field "date" berformat YYYY-MM-DD)
interface DateWindow {
  gte?: string;
  lt?: string;
  lte?: string;
}

// Subscribe ke 1 koleksi dengan batas tanggal. win = null berarti tidak membaca apa pun.
function useWindowedCollection<T>(name: string, win: DateWindow | null) {
  const [items, setItems] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const key = win ? JSON.stringify(win) : "";

  useEffect(() => {
    if (!win) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const constraints: QueryConstraint[] = [];
    if (win.gte) constraints.push(where("date", ">=", win.gte));
    if (win.lt) constraints.push(where("date", "<", win.lt));
    if (win.lte) constraints.push(where("date", "<=", win.lte));

    const unsub = onSnapshot(
      query(collection(db, name), ...constraints),
      (snap) => {
        setItems(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (T & { id: string })[]
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
    // win sudah terwakili oleh key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key]);

  return { items, loading };
}

// Tanggal audit terakhir: hanya membaca dokumen berkategori "audit" (sedikit)
function useAuditDate() {
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "finances"), where("category", "==", "audit")),
      (snap) => {
        let latest: string | null = null;
        for (const d of snap.docs) {
          const date = d.data().date as string | undefined;
          if (date && (!latest || date > latest)) latest = date;
        }
        setAuditDate(latest);
        setLoaded(true);
      },
      (err) => {
        console.error(err);
        setLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  return { auditDate, loaded };
}

function buildWindows(
  auditDate: string | null,
  includeOld: boolean,
  from: string,
  to: string
): { recent: DateWindow | null; old: DateWindow | null } {
  // Belum ada audit: tidak ada yang bisa dilewati, baca sesuai rentang saja
  if (!auditDate) {
    return { recent: { gte: from || undefined, lte: to || undefined }, old: null };
  }

  // Kuning + biru: mulai tanggal audit (dipersempit kalau rentang dipilih)
  const gte = from && from > auditDate ? from : auditDate;
  const lte = to || undefined;
  const recent: DateWindow | null = lte && lte < gte ? null : { gte, lte };

  // Hijau: sebelum tanggal audit, hanya kalau diminta
  let old: DateWindow | null = null;
  if (includeOld && (!from || from < auditDate)) {
    old = {
      gte: from || undefined,
      ...(to && to < auditDate ? { lte: to } : { lt: auditDate }),
    };
  }
  return { recent, old };
}

export function useReviewData(opts: { showChecked: boolean; from: string; to: string }) {
  const { showChecked, from, to } = opts;
  const { auditDate, loaded } = useAuditDate();

  // Rentang tanggal yang menjangkau sebelum audit otomatis ikut memuat data hijau
  const rangeActive = !!(from || to);
  const rangeReachesBefore =
    !!auditDate && rangeActive && (!from || from < auditDate);
  const includeOld = showChecked || rangeReachesBefore;

  const windows = buildWindows(auditDate, includeOld, from, to);

  // Jangan baca apa pun sebelum tanggal audit diketahui
  const txRecent = useWindowedCollection<Transaction>("finances", loaded ? windows.recent : null);
  const txOld = useWindowedCollection<Transaction>("finances", loaded ? windows.old : null);
  const jrRecent = useWindowedCollection<JournalEntry>("journals", loaded ? windows.recent : null);
  const jrOld = useWindowedCollection<JournalEntry>("journals", loaded ? windows.old : null);

  const [categories, setCategories] = useState<(JournalCategory & { id: string })[]>([]);
  useEffect(() => {
    const unsub = subscribeToCollection<JournalCategory>(
      "journalCategories",
      (items) => setCategories(items),
      { orderByField: "createdAt" }
    );
    return () => unsub();
  }, []);

  const transactions = useMemo(
    () => [...txRecent.items, ...txOld.items],
    [txRecent.items, txOld.items]
  );
  const journals = useMemo(
    () => [...jrRecent.items, ...jrOld.items],
    [jrRecent.items, jrOld.items]
  );

  const loading =
    !loaded || txRecent.loading || txOld.loading || jrRecent.loading || jrOld.loading;

  return { auditDate, transactions, journals, categories, loading, includeOld, rangeReachesBefore };
}