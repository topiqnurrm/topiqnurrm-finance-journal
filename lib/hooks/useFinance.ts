"use client";
 
import { useEffect, useState } from "react";
import { Transaction } from "@/lib/types/finance";
import { subscribeToCollection, addItem, updateItem, deleteItem } from "@/lib/firebase/firestore";
 
export function useFinance() {
  const [transactions, setTransactions] = useState<(Transaction & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const unsub = subscribeToCollection<Transaction>(
      "finances",
      (items) => {
        setTransactions(items);
        setLoading(false);
      },
      { orderByField: "createdAt" }
    );
    return () => unsub();
  }, []);
 
  const addTransaction = (data: Omit<Transaction, "id">) => addItem("finances", data);
  const editTransaction = (id: string, data: Partial<Transaction>) =>
    updateItem("finances", id, data);
  const removeTransaction = (id: string) => deleteItem("finances", id);
 
  return { transactions, loading, addTransaction, editTransaction, removeTransaction };
}
