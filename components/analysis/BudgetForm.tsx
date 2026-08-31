"use client";
import { useState, useEffect } from "react";
import { Budget } from "@/lib/types/finance";

interface Props {
  monthId: string;
  initialBudget: Budget | null;
  onSave: (data: Omit<Budget, "id">) => Promise<void>;
}

const CATEGORIES = [
  { key: "kehidupan", label: "Kehidupan" },
  { key: "mendadak", label: "Mendadak" },
  { key: "tabungan", label: "Tabungan" },
  { key: "foya_foya", label: "Foya-foya" },
] as const;

export default function BudgetForm({ monthId, initialBudget, onSave }: Props) {
  const [values, setValues] = useState({ kehidupan: 0, mendadak: 0, tabungan: 0, foya_foya: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialBudget) {
      const { id, ...rest } = initialBudget;
      setValues(rest);
    }
  }, [initialBudget]);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave(values);
    setSaving(false);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
      <p className="text-sm text-neutral-400">Set Budget Bulan Ini ({monthId})</p>
      {CATEGORIES.map((cat) => (
        <div key={cat.key} className="flex items-center gap-3">
          <label className="w-24 shrink-0 text-sm text-neutral-300">{cat.label}</label>
          <input
            type="number"
            className="flex-1 min-w-0 bg-neutral-800 rounded-lg px-3 py-2 text-white"
            value={values[cat.key]}
            onChange={(e) => setValues((v) => ({ ...v, [cat.key]: Number(e.target.value) }))}
          />
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-500 rounded-lg py-2 text-white font-medium disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "Simpan Budget"}
      </button>
    </div>
  );
}