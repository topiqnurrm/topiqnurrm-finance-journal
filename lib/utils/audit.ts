import { Transaction } from "@/lib/types/finance";

export type AuditStatus = "none" | "before" | "on" | "after";

// Tanggal audit terakhir = tanggal transaksi terbaru berkategori "audit"
export function getLatestAuditDate(transactions: Transaction[]): string | null {
  let latest: string | null = null;
  for (const t of transactions) {
    if (t.type === "expense" && t.category === "audit") {
      if (!latest || t.date > latest) latest = t.date;
    }
  }
  return latest;
}

// Format tanggal YYYY-MM-DD bisa dibandingkan langsung sebagai string
export function getAuditStatus(date: string, auditDate: string | null): AuditStatus {
  if (!auditDate) return "none";
  if (date < auditDate) return "before";
  if (date === auditDate) return "on";
  return "after";
}