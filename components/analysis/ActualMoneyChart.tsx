import { formatRupiah } from "@/lib/utils/currency";

interface Props {
  sisaUang: number; // sisa uang bulan ini
  danaDarurat: number; // total dana darurat (kumulatif sampai bulan ini)
  monthLabel: string;
}

// Uang aktual yang dipegang = sisa uang bulan ini + total dana darurat
export default function ActualMoneyChart({ sisaUang, danaDarurat, monthLabel }: Props) {
  const actual = sisaUang + danaDarurat;
  const max = Math.max(Math.abs(sisaUang), Math.abs(danaDarurat), Math.abs(actual), 1);
  const width = (n: number) => `${Math.min(100, (Math.abs(n) / max) * 100)}%`;

  // Bar gabungan hanya bermakna kalau kedua bagian positif
  const canStack = sisaUang >= 0 && danaDarurat >= 0 && actual > 0;
  const sisaPct = canStack ? (sisaUang / actual) * 100 : 0;

  const rows = [
    { label: "Sisa uang bulan ini", sign: "", value: sisaUang, bar: "bg-green-500", text: "text-green-400" },
    { label: "Total dana darurat", sign: "+", value: danaDarurat, bar: "bg-blue-500", text: "text-blue-400" },
    { label: "Uang aktual yang dipegang", sign: "=", value: actual, bar: actual < 0 ? "bg-red-500" : "bg-amber-500", text: actual < 0 ? "text-red-400" : "text-amber-400" },
  ];

  return (
    <div className="space-y-3 min-w-0">
      <p className={`text-2xl font-semibold break-words ${actual < 0 ? "text-red-400" : "text-amber-400"}`}>
        {formatRupiah(actual)}
      </p>

      {canStack && (
        <div>
          <div className="flex h-3 overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full bg-green-500" style={{ width: `${sisaPct}%` }} />
            <div className="h-full bg-blue-500" style={{ width: `${100 - sisaPct}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-xs text-neutral-500">
            <span>Sisa uang {Math.round(sisaPct)}%</span>
            <span>Dana darurat {Math.round(100 - sisaPct)}%</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0 space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="min-w-0 break-words text-xs text-neutral-400">{r.label}</p>
              <p className={`shrink-0 text-xs font-medium ${r.value < 0 ? "text-red-400" : r.text}`}>
                {r.sign} {formatRupiah(r.value)}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
              <div className={`h-full rounded-full ${r.value < 0 ? "bg-red-500" : r.bar}`} style={{ width: width(r.value) }} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-600">
        Sisa uang {monthLabel} + total dana darurat sampai akhir bulan itu.
      </p>
    </div>
  );
}