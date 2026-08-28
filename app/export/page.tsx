"use client";
import ExportPanel from "@/components/export/ExportPanel";
import BackButton from "@/components/ui/BackButton";

export default function ExportPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-semibold text-white">Export Excel</h1>
      </div>
      <ExportPanel />
    </div>
  );
}