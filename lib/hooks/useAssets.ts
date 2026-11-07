"use client";

import { useEffect, useState } from "react";
import { Asset } from "@/lib/types/asset";
import { subscribeToCollection, addItem, updateItem, deleteItem } from "@/lib/firebase/firestore";

export function useAssets() {
  const [assets, setAssets] = useState<(Asset & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCollection<Asset>(
      "assets",
      (items) => {
        setAssets(items);
        setLoading(false);
      },
      { orderByField: "createdAt" }
    );
    return () => unsub();
  }, []);

  const addAsset = (data: Omit<Asset, "id">) => addItem("assets", data);
  const editAsset = (id: string, data: Partial<Asset>) => updateItem("assets", id, data);
  const removeAsset = (id: string) => deleteItem("assets", id);

  return { assets, loading, addAsset, editAsset, removeAsset };
}