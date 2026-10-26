"use client";

export type SortMode = "date" | "category";

interface Props {
  mode: SortMode;
  onChange: (mode: SortMode) => void;
}

export default function SortModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange("date")}
        className={`flex-1 rounded-md py-2 text-sm ${
          mode === "date" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400"
        }`}
      >
        Per Tanggal
      </button>
      <button
        type="button"
        onClick={() => onChange("category")}
        className={`flex-1 rounded-md py-2 text-sm ${
          mode === "category" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400"
        }`}
      >
        Per Kategori
      </button>
    </div>
  );
}