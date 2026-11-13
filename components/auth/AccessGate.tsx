"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/hooks/useAuth";
import LogoutButton from "@/components/auth/LogoutButton";

// Halaman yang terbuka untuk umum (tanpa login)
const PUBLIC_PREFIXES = ["/orang-have"];

type Access = "checking" | "allowed" | "denied";

// Pembungkus untuk semua halaman. Data pribadi hanya bisa dibaca akun yang ada di daftar email di firestore.rules.
// Pengecekan di sini hanya untuk tampilan yang ramah; yang benar-benar menjaga data adalah rules Firestore.
export default function AccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { user, loading } = useAuth();
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const [access, setAccess] = useState<Access>("checking");

  useEffect(() => {
    if (isPublic || loading || !user) return;
    let cancelled = false;
    setAccess("checking");
    // Baca dokumen "access/probe" (tidak perlu ada). Rules mengizinkan baca hanya untuk email terdaftar,
    // jadi hasil permission-denied = akun ini tidak diizinkan melihat data pribadi.
    getDoc(doc(db, "access", "probe"))
      .then(() => {
        if (!cancelled) setAccess("allowed");
      })
      .catch((err) => {
        if (cancelled) return;
        // Error lain (mis. offline) tidak mengunci akun; rules tetap menjaga datanya
        setAccess(err?.code === "permission-denied" ? "denied" : "allowed");
      });
    return () => {
      cancelled = true;
    };
  }, [isPublic, loading, user]);

  if (isPublic) return <>{children}</>;

  if (loading) return <div className="p-4 text-sm text-neutral-500">Memuat...</div>;

  if (!user) {
    // Dashboard menampilkan tombol login sendiri
    if (pathname === "/") return <>{children}</>;
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-neutral-400">Silakan login dulu di halaman utama.</p>
        <Link href="/" className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
          Ke halaman utama
        </Link>
      </div>
    );
  }

  if (access === "checking") return <div className="p-4 text-sm text-neutral-500">Memuat...</div>;

  if (access === "denied") {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <h1 className="text-xl font-semibold">Akses dibatasi</h1>
        <p className="text-sm text-neutral-400">
          Akun {user.email} belum diizinkan melihat data keuangan dan jurnal pribadi.
        </p>
        <Link
          href="/orang-have"
          className="block rounded-lg bg-indigo-600 py-3 text-center text-sm font-medium text-white"
        >
          Lihat Tabungan Bersama Orang Have
        </Link>
        <LogoutButton />
      </div>
    );
  }

  return <>{children}</>;
}