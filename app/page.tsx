"use client";
 
import { useAuth } from "@/lib/hooks/useAuth";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import LogoutButton from "@/components/auth/LogoutButton";
import TodayOverview from "@/components/dashboard/TodayOverview";
import QuickAdd from "@/components/dashboard/QuickAdd";
 
export default function DashboardPage() {
  const { user, loading, isOwner } = useAuth();
 
  if (loading) {
    return <div className="p-4 text-sm text-neutral-500">Memuat...</div>;
  }
 
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Keuangan & Jurnal</h1>
        {user ? <LogoutButton /> : null}
      </div>
 
      {!user ? (
        <GoogleLoginButton />
      ) : (
        <>
          <p className="text-sm text-neutral-500">
            Login sebagai: {user.email} · Status: {isOwner ? "Owner (bisa edit)" : "Pengunjung (read-only)"}
          </p>
 
          {isOwner && <QuickAdd />}
 
          <TodayOverview />
        </>
      )}
    </div>
  );
}
