"use client";
 
import { useAuth } from "@/lib/hooks/useAuth";
import FinanceForm from "@/components/finance/FinanceForm";
import FinanceList from "@/components/finance/FinanceList";
import FinanceSummaryCard from "@/components/finance/FinanceSummaryCard";
 
export default function FinancePage() {
  const { isOwner } = useAuth();
 
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="text-xl font-semibold">Keuangan</h1>
      <FinanceSummaryCard />
      {isOwner && <FinanceForm />}
      <FinanceList isOwner={isOwner} />
    </div>
  );
}
