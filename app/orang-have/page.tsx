"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useOrangHave } from "@/lib/hooks/useOrangHave";
import BackButton from "@/components/ui/BackButton";
import OhSummary from "@/components/orang-have/OhSummary";
import OhPayments from "@/components/orang-have/OhPayments";
import OhKas from "@/components/orang-have/OhKas";
import OhLoans from "@/components/orang-have/OhLoans";
import OhMembers from "@/components/orang-have/OhMembers";

type Tab = "ringkasan" | "setoran" | "kas" | "pinjaman" | "anggota";

const TABS: { id: Tab; label: string }[] = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "setoran", label: "Setoran" },
  { id: "kas", label: "Kas" },
  { id: "pinjaman", label: "Pinjaman" },
  { id: "anggota", label: "Anggota" },
];

// Halaman publik: siapa pun bisa melihat tanpa login. Tambah/ubah/hapus hanya untuk owner.
export default function OrangHavePage() {
  const { isOwner } = useAuth();
  const oh = useOrangHave();
  const [tab, setTab] = useState<Tab>("ringkasan");

  return (
    <div className="mx-auto max-w-2xl space-y-4 overflow-x-hidden p-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="min-w-0 break-words text-xl font-semibold">Tabungan Bersama Orang Have</h1>
      </div>

      <p className="text-xs text-neutral-500">
        {isOwner ? "Mode owner (bisa edit)" : "Mode lihat saja"}
      </p>

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-neutral-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 flex-1 rounded-md px-3 py-1.5 text-xs ${
              tab === t.id ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {oh.loading ? (
        <p className="text-sm text-neutral-500">Memuat...</p>
      ) : (
        <>
          {tab === "ringkasan" && (
            <OhSummary members={oh.members} payments={oh.payments} expenses={oh.expenses} loans={oh.loans} />
          )}
          {tab === "setoran" && (
            <OhPayments
              isOwner={isOwner}
              members={oh.members}
              payments={oh.payments}
              addPayment={oh.addPayment}
              editPayment={oh.editPayment}
              removePayment={oh.removePayment}
            />
          )}
          {tab === "kas" && (
            <OhKas
              isOwner={isOwner}
              members={oh.members}
              payments={oh.payments}
              expenses={oh.expenses}
              loans={oh.loans}
              addExpense={oh.addExpense}
              editExpense={oh.editExpense}
              removeExpense={oh.removeExpense}
            />
          )}
          {tab === "pinjaman" && (
            <OhLoans
              isOwner={isOwner}
              members={oh.members}
              loans={oh.loans}
              addLoan={oh.addLoan}
              editLoan={oh.editLoan}
              removeLoan={oh.removeLoan}
            />
          )}
          {tab === "anggota" && (
            <OhMembers
              isOwner={isOwner}
              members={oh.members}
              payments={oh.payments}
              addMember={oh.addMember}
              editMember={oh.editMember}
              removeMember={oh.removeMember}
            />
          )}
        </>
      )}
    </div>
  );
}