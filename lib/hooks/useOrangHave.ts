"use client";

import { useEffect, useMemo, useState } from "react";
import { OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { subscribeToCollection, addItem, updateItem, deleteItem } from "@/lib/firebase/firestore";

type WithId<T> = T & { id: string };

// Data kelompok kecil (puluhan dokumen), jadi semua koleksi langsung dilangganan.
// Baca terbuka untuk umum (tanpa login); tulis hanya owner (dijaga firestore.rules).
export function useOrangHave() {
  const [members, setMembers] = useState<WithId<OhMember>[]>([]);
  const [payments, setPayments] = useState<WithId<OhPayment>[]>([]);
  const [expenses, setExpenses] = useState<WithId<OhKasExpense>[]>([]);
  const [loans, setLoans] = useState<WithId<OhLoan>[]>([]);
  const [ready, setReady] = useState({ members: false, payments: false, expenses: false, loans: false });

  useEffect(() => {
    const mark = (k: keyof typeof ready) => setReady((r) => ({ ...r, [k]: true }));
    const u1 = subscribeToCollection<OhMember>("ohMembers", (i) => { setMembers(i); mark("members"); });
    const u2 = subscribeToCollection<OhPayment>("ohPayments", (i) => { setPayments(i); mark("payments"); });
    const u3 = subscribeToCollection<OhKasExpense>("ohKasExpenses", (i) => { setExpenses(i); mark("expenses"); });
    const u4 = subscribeToCollection<OhLoan>("ohLoans", (i) => { setLoans(i); mark("loans"); });
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, []);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)),
    [members]
  );
  const loading = !(ready.members && ready.payments && ready.expenses && ready.loans);

  return {
    loading,
    members: sortedMembers,
    payments,
    expenses: [...expenses].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    loans: [...loans].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? 0) - (a.createdAt ?? 0)),

    addMember: (d: Omit<OhMember, "id">) => addItem("ohMembers", d),
    editMember: (id: string, d: Partial<OhMember>) => updateItem("ohMembers", id, d),
    removeMember: (id: string) => deleteItem("ohMembers", id),

    addPayment: (d: Omit<OhPayment, "id">) => addItem("ohPayments", d),
    editPayment: (id: string, d: Partial<OhPayment>) => updateItem("ohPayments", id, d),
    removePayment: (id: string) => deleteItem("ohPayments", id),

    addExpense: (d: Omit<OhKasExpense, "id">) => addItem("ohKasExpenses", d),
    editExpense: (id: string, d: Partial<OhKasExpense>) => updateItem("ohKasExpenses", id, d),
    removeExpense: (id: string) => deleteItem("ohKasExpenses", id),

    addLoan: (d: Omit<OhLoan, "id">) => addItem("ohLoans", d),
    editLoan: (id: string, d: Partial<OhLoan>) => updateItem("ohLoans", id, d),
    removeLoan: (id: string) => deleteItem("ohLoans", id),
  };
}