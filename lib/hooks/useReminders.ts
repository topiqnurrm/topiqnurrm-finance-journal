"use client";

import { useEffect, useState } from "react";
import { Reminder } from "@/lib/types/reminder";
import { subscribeToCollection, addItem, updateItem, deleteItem } from "@/lib/firebase/firestore";

export function useReminders() {
  const [reminders, setReminders] = useState<(Reminder & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCollection<Reminder>(
      "reminders",
      (items) => {
        setReminders(items);
        setLoading(false);
      },
      { orderByField: "createdAt" }
    );
    return () => unsub();
  }, []);

  const addReminder = (data: Omit<Reminder, "id">) => addItem("reminders", data);
  const editReminder = (id: string, data: Partial<Reminder>) => updateItem("reminders", id, data);
  const removeReminder = (id: string) => deleteItem("reminders", id);

  return { reminders, loading, addReminder, editReminder, removeReminder };
}