"use client";

interface Props {
  selectedDate: string;
  onChange: (date: string) => void;
  max?: string;
}

// PENTING: jangan pakai toISOString() untuk tanggal lokal — itu convert ke UTC
// dan bikin geser 1 hari salah untuk timezone WIB (+7).
function toDateStr(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function shiftDate(dateStr: string, delta: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toDateStr(date);
}

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function getToday() {
  return toDateStr(new Date());
}

export default function DayNav({ selectedDate, onChange, max }: Props) {
  const today = getToday();
  const maxDate = max ?? today;
  const isAtMax = selectedDate >= maxDate;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border border-neutral-800 p-3">
        <button
          onClick={() => onChange(shiftDate(selectedDate, -1))}
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white"
          aria-label="Hari sebelumnya"
        >
          ‹
        </button>
        <span className="text-sm text-neutral-200 capitalize text-center flex-1 px-2">
          {formatDateLabel(selectedDate)}
        </span>
        <button
          onClick={() => onChange(shiftDate(selectedDate, 1))}
          disabled={isAtMax}
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Hari berikutnya"
        >
          ›
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          max={maxDate}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 text-sm text-white"
        />
        {selectedDate !== today && (
          <button
            onClick={() => onChange(today)}
            className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
          >
            ← Hari ini
          </button>
        )}
      </div>
    </div>
  );
}