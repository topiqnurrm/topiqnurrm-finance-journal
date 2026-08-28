"use client";
import { useEffect, useState } from "react";
import { getBudget, setBudget } from "@/lib/firebase/firestore";
import { Budget } from "@/lib/types/finance";
 
export function useBudget(monthId: string) {
  const [budget, setBudgetState] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    setLoading(true);
    getBudget(monthId).then((data) => {
      setBudgetState(data);
      setLoading(false);
    });
  }, [monthId]);
 
  const saveBudget = async (data: Omit<Budget, "id">) => {
    await setBudget(monthId, data);
    setBudgetState({ id: monthId, ...data });
  };
 
  return { budget, loading, saveBudget };
}
