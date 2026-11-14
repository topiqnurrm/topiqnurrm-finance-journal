"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/hooks/useAuth";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import LogoutButton from "@/components/auth/LogoutButton";

type Access = "checking" | "allowed" | "denied";

interface AccessState {
  personal: Access; // boleh melihat keuangan & jurnal pribadi
  oh: Access; // boleh melihat Tabungan Bersama Orang Have
}

const AccessContext = createContext<AccessState>({ personal: "checking", oh: "checking" });

// Dipakai komponen lain (mis. tombol di dashboard) untuk tahu hak akses akun yang sedang login
export function useAccess() {
  return useContext(AccessContext);
}

type Section = "oh" | "owner" | "personal";

function getSection(pathname: string): Section {
  if (pathname === "/orang-have" || pathname.startsWith("/orang-have/")) return "oh";
  if (pathname === "/akses" || pathname.startsWith("/akses/")) return "owner";
  return "personal";
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-4 text-center">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-sm text-neutral-400">Halaman tidak ditemukan.</p>
      <LogoutButton />
    </div>
  );
}

// Pembungkus semua halaman. Daftar akun diambil dari database (dokumen access/config) lewat rules Firestore.
// Akun yang tidak terdaftar melihat halaman 404. Yang benar-benar menjaga data adalah rules; ini hanya tampilan.
export default function AccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { user, loading, isOwner } = useAuth();
  const section = getSection(pathname);

  const [state, setState] = useState<AccessState>({ personal: "checking", oh: "checking" });

  useEffect(() => {
    if (loading || !user) {
      setState({ personal: "checking", oh: "checking" });
      return;
    }
    // Owner selalu punya akses penuh (rules juga begitu), jadi tidak perlu baca apa pun
    if (isOwner) {
      setState({ personal: "allowed", oh: "allowed" });
      return;
    }

    let cancelled = false;
    setState({ personal: "checking", oh: "checking" });

    // Baca dokumen "pancingan" (tidak perlu ada). permission-denied = akun tidak terdaftar di daftar itu.
    const probe = (name: string, key: keyof AccessState) =>
      getDoc(doc(db, "access", name))
        .then(() => "allowed" as Access)
        .catch((err) => (err?.code === "permission-denied" ? "denied" : "allowed") as Access)
        .then((v) => {
          if (!cancelled) setState((s) => ({ ...s, [key]: v }));
        });

    probe("personalProbe", "personal");
    probe("ohProbe", "oh");

    return () => {
      cancelled = true;
    };
  }, [loading, user, isOwner]);

  // Akun yang hanya punya akses Orang Have, lalu membuka "/": arahkan ke Orang Have
  useEffect(() => {
    if (pathname === "/" && user && state.personal === "denied" && state.oh === "allowed") {
      router.replace("/orang-have");
    }
  }, [pathname, user, state, router]);

  const wrap = (node: React.ReactNode) => <AccessContext.Provider value={state}>{node}</AccessContext.Provider>;

  if (loading) return <div className="p-4 text-sm text-neutral-500">Memuat...</div>;

  // Belum login: dashboard menampilkan tombol login sendiri; halaman lain meminta login
  if (!user) {
    if (pathname === "/") return wrap(children);
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-neutral-400">Silakan login untuk melanjutkan.</p>
        <GoogleLoginButton />
      </div>
    );
  }

  if (section === "owner") return isOwner ? wrap(children) : <NotFound />;

  const mine = section === "oh" ? state.oh : state.personal;
  if (mine === "checking") return <div className="p-4 text-sm text-neutral-500">Memuat...</div>;

  if (mine === "denied") {
    // "/" untuk akun yang tidak punya akses pribadi: tunggu hasil cek Orang Have (mungkin dialihkan)
    if (pathname === "/" && state.oh === "checking") {
      return <div className="p-4 text-sm text-neutral-500">Memuat...</div>;
    }
    if (pathname === "/" && state.oh === "allowed") {
      return <div className="p-4 text-sm text-neutral-500">Memuat...</div>;
    }
    return <NotFound />;
  }

  return wrap(children);
}