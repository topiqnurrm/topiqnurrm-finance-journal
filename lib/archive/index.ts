import { Transaction } from "@/lib/types/finance";
import { JournalEntry, JournalCategory } from "@/lib/types/journal";
import { LIVE_FROM, ARCHIVE_FIRST } from "./config";
import type { ArchiveMonth } from "./types";

// Semua pengaturan ada di lib/archive/config.ts (LIVE_FROM). File ini tidak perlu diubah.

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
if (!MONTH_RE.test(LIVE_FROM) || !MONTH_RE.test(ARCHIVE_FIRST)) {
  throw new Error('lib/archive/config.ts: LIVE_FROM dan ARCHIVE_FIRST harus berformat "YYYY-MM", mis. "2026-11".');
}

const pad = (n: number) => String(n).padStart(2, "0");

// Tanggal pertama yang dibaca dari Firebase, mis. "2026-11-01"
export const LIVE_START = `${LIVE_FROM}-01`;

// Tanggal terakhir yang diambil dari arsip (hari terakhir bulan sebelum LIVE_FROM), mis. "2026-10-31"
export const ARCHIVE_END = (() => {
  const [y, m] = LIVE_FROM.split("-").map(Number);
  const d = new Date(y, m - 1, 0); // hari ke-0 bulan ini = hari terakhir bulan lalu
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
})();

// Daftar bulan arsip: dari ARCHIVE_FIRST sampai satu bulan sebelum LIVE_FROM
export function getArchiveMonths(): string[] {
  const out: string[] = [];
  let [y, m] = ARCHIVE_FIRST.split("-").map(Number);
  let cur = `${y}-${pad(m)}`;
  while (cur < LIVE_FROM) {
    out.push(cur);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    cur = `${y}-${pad(m)}`;
  }
  return out;
}

export const ARCHIVE_ID_PREFIX = "archive:";

export function isArchivedId(id?: string | null) {
  return !!id && id.startsWith(ARCHIVE_ID_PREFIX);
}

export function isArchivedDate(date: string) {
  return date <= ARCHIVE_END;
}

export function archiveLockedMessage() {
  return `Data sampai ${ARCHIVE_END} diambil dari arsip di kode dan tidak bisa ditambah, diubah, atau dihapus dari aplikasi. Pilih tanggal ${LIVE_START} atau setelahnya.`;
}

// Rentang tanggal (format YYYY-MM-DD bisa dibandingkan sebagai string)
export interface DateWindow {
  gte?: string;
  lt?: string;
  lte?: string;
}

export function inWindow(date: string, win: DateWindow | null) {
  if (!win) return false;
  if (win.gte && date < win.gte) return false;
  if (win.lt && date >= win.lt) return false;
  if (win.lte && date > win.lte) return false;
  return true;
}

// Potong rentang agar hanya menjangkau bagian yang masih di Firebase. null = tidak ada yang perlu dibaca.
export function clampToLive(win: DateWindow | null): DateWindow | null {
  if (!win) return null;
  if (win.lte && win.lte < LIVE_START) return null;
  if (win.lt && win.lt <= LIVE_START) return null;
  const gte = win.gte && win.gte > LIVE_START ? win.gte : LIVE_START;
  return { ...win, gte };
}

// ===== MEMUAT ARSIP =====
export type ArchivedJournal = Omit<JournalEntry, "categoryId"> & { id: string; categoryName: string };

export interface LoadedArchive {
  transactions: (Transaction & { id: string })[];
  journals: ArchivedJournal[];
  auditDate: string | null; // transaksi berkategori "audit" terbaru di arsip
}

let archivePromise: Promise<LoadedArchive> | null = null;

// File tiap bulan dimuat sesuai kebutuhan (code-splitting per bulan) dan di-cache.
export function loadArchive(): Promise<LoadedArchive> {
  if (archivePromise) return archivePromise;

  archivePromise = (async () => {
    const months = getArchiveMonths();
    const missing: string[] = [];

    const loaded = await Promise.all(
      months.map(async (m): Promise<ArchiveMonth> => {
        try {
          const mod = await import(`./months/${m}`);
          return mod.default as ArchiveMonth;
        } catch (err) {
          console.error(`File arsip bulan ${m} tidak ditemukan / gagal dimuat`, err);
          missing.push(m);
          return { tx: [], jr: [] };
        }
      })
    );

    // Jangan diam-diam menampilkan angka yang salah
    if (missing.length > 0 && typeof window !== "undefined") {
      window.alert(
        `File arsip belum ada untuk bulan: ${missing.join(", ")}.\n` +
          `Buat dengan "npm run archive", atau turunkan LIVE_FROM di lib/archive/config.ts. ` +
          `Angka di aplikasi belum lengkap sebelum itu diperbaiki.`
      );
    }

    // Hanya baris yang benar-benar masuk rentang arsip (jaga-jaga kalau file bulan terlalu "maju")
    const txRows = loaded.flatMap((x) => x.tx).filter((r) => r[0] <= ARCHIVE_END);
    const jrRows = loaded.flatMap((x) => x.jr).filter((r) => r[0] <= ARCHIVE_END);

    // createdAt tidak ada di export, jadi dibuat dari urutan: dalam 1 hari, baris pertama = terbaru
    const synth = (rows: { 0: string }[]) => {
      const perDate = new Map<string, number>();
      for (const r of rows) perDate.set(r[0], (perDate.get(r[0]) ?? 0) + 1);
      const seen = new Map<string, number>();
      return rows.map((r) => {
        const date = r[0];
        const j = seen.get(date) ?? 0;
        seen.set(date, j + 1);
        const [y, mo, d] = date.split("-").map(Number);
        return Date.UTC(y, mo - 1, d) + ((perDate.get(date) ?? 1) - j) * 1000;
      });
    };

    const txTimes = synth(txRows);
    const transactions = txRows
      .map(
        ([date, type, category, amount, note], i) =>
          ({
            id: `${ARCHIVE_ID_PREFIX}tx-${i}`,
            type,
            category,
            amount,
            note,
            date,
            createdAt: txTimes[i],
          }) as Transaction & { id: string }
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    const jrTimes = synth(jrRows);
    const journals: ArchivedJournal[] = jrRows
      .map(([date, categoryName, content], i) => ({
        id: `${ARCHIVE_ID_PREFIX}jr-${i}`,
        categoryName,
        content,
        date,
        createdAt: jrTimes[i],
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    let auditDate: string | null = null;
    for (const r of txRows) {
      if (r[2] === "audit" && (!auditDate || r[0] > auditDate)) auditDate = r[0];
    }

    return { transactions, journals, auditDate };
  })();

  return archivePromise;
}

// Arsip hanya menyimpan nama kategori. id kategori dicocokkan dari daftar kategori di Firebase (berdasarkan nama),
// supaya filter / pengelompokan per kategori tetap menyatu dengan jurnal baru.
export function attachJournalCategoryIds(
  archived: ArchivedJournal[],
  categories: (JournalCategory & { id: string })[]
): (JournalEntry & { id: string })[] {
  const byName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c.id]));
  return archived.map((e) => ({
    ...e,
    categoryId: byName.get(e.categoryName.trim().toLowerCase()) ?? `${ARCHIVE_ID_PREFIX}cat:${e.categoryName}`,
  }));
}