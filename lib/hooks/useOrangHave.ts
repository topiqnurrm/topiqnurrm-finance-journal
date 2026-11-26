"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where, QueryConstraint } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { subscribeToCollection, addItem, updateItem, deleteItem } from "@/lib/firebase/firestore";
import {
  EMPTY_OH_ARCHIVE,
  LoadedOhArchive,
  OH_ARCHIVE_END,
  OH_LIVE_START,
  attachMemberIds,
  isOhArchivedDate,
  isOhArchivedId,
  loadOhArchive,
  ohArchiveLockedMessage,
} from "@/lib/orang-have/archive";

type WithId<T> = T & { id: string };

// Subscribe 1 koleksi, dibatasi tanggal >= OH_LIVE_START pada field tertentu (1 field saja, tanpa composite index).
// OH_LIVE_START "" = belum ada arsip, baca semuanya.
function useWindowed<T>(name: string, field: string) {
  const [items, setItems] = useState<WithId<T>[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const constraints: QueryConstraint[] = OH_LIVE_START ? [where(field, ">=", OH_LIVE_START)] : [];
    const unsub = onSnapshot(
      query(collection(db, name), ...constraints),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as WithId<T>[]);
        setReady(true);
      },
      (err) => {
        console.error(err);
        setReady(true);
      }
    );
    return () => unsub();
  }, [name, field]);
  return { items, ready };
}

// Bulan sebelum OH_LIVE_FROM (lib/orang-have/archive/config.ts) diambil dari file arsip.
// Baca terbuka untuk akun yang diizinkan; tulis hanya owner (dijaga firestore.rules).
export function useOrangHave() {
  const [members, setMembers] = useState<WithId<OhMember>[]>([]);
  const [membersReady, setMembersReady] = useState(false);
  const [archive, setArchive] = useState<LoadedOhArchive | null>(null);

  const pay = useWindowed<OhPayment>("ohPayments", "paidDate");
  const kas = useWindowed<OhKasExpense>("ohKasExpenses", "date");

  // Pinjaman: koleksinya kecil dan pinjaman yang belum lunas harus selalu tampil, jadi dibaca semua lalu
  // yang sudah lunas dan masuk rentang arsip dibuang (diganti salinan dari arsip).
  const [rawLoans, setRawLoans] = useState<WithId<OhLoan>[]>([]);
  const [loansReady, setLoansReady] = useState(false);

  useEffect(() => {
    const u1 = subscribeToCollection<OhMember>("ohMembers", (i) => {
      setMembers(i);
      setMembersReady(true);
    });
    const u2 = subscribeToCollection<OhLoan>("ohLoans", (i) => {
      setRawLoans(i);
      setLoansReady(true);
    });
    let cancelled = false;
    loadOhArchive()
      .then((a) => {
        if (!cancelled) setArchive(a);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setArchive(EMPTY_OH_ARCHIVE);
      });
    return () => {
      cancelled = true;
      u1();
      u2();
    };
  }, []);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)),
    [members]
  );

  const payments = useMemo(
    () => [...pay.items, ...(archive ? attachMemberIds(archive.payments, members) : [])],
    [pay.items, archive, members]
  );

  const expenses = useMemo(
    () =>
      [...kas.items, ...(archive?.expenses ?? [])].sort(
        (a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? 0) - (a.createdAt ?? 0)
      ),
    [kas.items, archive]
  );

  const loans = useMemo(() => {
    const live = rawLoans.filter((l) => !(l.repaidDate && OH_ARCHIVE_END && l.repaidDate <= OH_ARCHIVE_END));
    return [...live, ...(archive?.loans ?? [])].sort(
      (a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? 0) - (a.createdAt ?? 0)
    );
  }, [rawLoans, archive]);

  const loading = !(membersReady && pay.ready && kas.ready && loansReady && archive !== null);

  const blocked = () => {
    window.alert(ohArchiveLockedMessage());
    return null;
  };

  return {
    loading,
    members: sortedMembers,
    payments,
    expenses,
    loans,

    addMember: (d: Omit<OhMember, "id">) => addItem("ohMembers", d),
    editMember: (id: string, d: Partial<OhMember>) => updateItem("ohMembers", id, d),
    removeMember: (id: string) => deleteItem("ohMembers", id),

    addPayment: async (d: Omit<OhPayment, "id">) => (isOhArchivedDate(d.paidDate) ? blocked() : addItem("ohPayments", d)),
    editPayment: async (id: string, d: Partial<OhPayment>) =>
      isOhArchivedId(id) || (d.paidDate && isOhArchivedDate(d.paidDate)) ? void blocked() : updateItem("ohPayments", id, d),
    removePayment: async (id: string) => (isOhArchivedId(id) ? void blocked() : deleteItem("ohPayments", id)),

    addExpense: async (d: Omit<OhKasExpense, "id">) => (isOhArchivedDate(d.date) ? blocked() : addItem("ohKasExpenses", d)),
    editExpense: async (id: string, d: Partial<OhKasExpense>) =>
      isOhArchivedId(id) || (d.date && isOhArchivedDate(d.date)) ? void blocked() : updateItem("ohKasExpenses", id, d),
    removeExpense: async (id: string) => (isOhArchivedId(id) ? void blocked() : deleteItem("ohKasExpenses", id)),

    // Pinjaman baru boleh bertanggal berapa pun selama belum lunas; tanggal LUNAS tidak boleh masuk rentang arsip
    addLoan: async (d: Omit<OhLoan, "id">) =>
      d.repaidDate && isOhArchivedDate(d.repaidDate) ? blocked() : addItem("ohLoans", d),
    editLoan: async (id: string, d: Partial<OhLoan>) =>
      isOhArchivedId(id) || (d.repaidDate && isOhArchivedDate(d.repaidDate)) ? void blocked() : updateItem("ohLoans", id, d),
    removeLoan: async (id: string) => (isOhArchivedId(id) ? void blocked() : deleteItem("ohLoans", id)),
  };
}