"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface AccessConfig {
  personalViewers: string[]; // boleh melihat keuangan & jurnal pribadi
  ohViewers: string[]; // boleh melihat Tabungan Bersama Orang Have
}

// Daftar akun di dokumen access/config. Hanya owner yang bisa membaca dan mengubahnya (rules).
export function useAccessConfig() {
  const [config, setConfig] = useState<AccessConfig>({ personalViewers: [], ohViewers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "access", "config"),
      (snap) => {
        const d = snap.data() ?? {};
        setConfig({
          personalViewers: Array.isArray(d.personalViewers) ? d.personalViewers : [],
          ohViewers: Array.isArray(d.ohViewers) ? d.ohViewers : [],
        });
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Gagal membaca daftar akses. Pastikan rules terbaru sudah di-Publish dan kamu login sebagai owner.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // merge: true supaya dokumen otomatis dibuat saat pertama kali disimpan
  const save = (next: Partial<AccessConfig>) => setDoc(doc(db, "access", "config"), next, { merge: true });

  return { config, loading, error, save };
}