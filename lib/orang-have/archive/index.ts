import { OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { OH_LIVE_FROM, OH_ARCHIVE_FIRST } from "./config";
import type { OhArchiveMonth } from "./types";

// Semua pengaturan ada di lib/orang-have/archive/config.ts. File ini tidak perlu diubah.

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
if (!MONTH_RE.test(OH_LIVE_FROM) || !MONTH_RE.test(OH_ARCHIVE_FIRST)) {
  throw new Error('lib/orang-have/archive/config.ts: OH_LIVE_FROM dan OH_ARCHIVE_FIRST harus berformat "YYYY-MM".');
}

const pad = (n: number) => String(n).padStart(2, "0");

// Daftar bulan arsip: dari OH_ARCHIVE_FIRST sampai satu bulan sebelum OH_LIVE_FROM (bisa kosong)
export function getOhArchiveMonths(): string[] {
  const out: string[] = [];
  let [y, m] = OH_ARCHIVE_FIRST.split("-").map(Number);
  let cur = `${y}-${pad(m)}`;
  while (cur < OH_LIVE_FROM) {
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

const HAS_ARCHIVE = getOhArchiveMonths().length > 0;

// Tanggal pertama yang dibaca dari Firebase. "" = belum ada arsip, baca semuanya.
export const OH_LIVE_START = HAS_ARCHIVE ? `${OH_LIVE_FROM}-01` : "";

// Tanggal terakhir yang diambil dari arsip. "" = belum ada arsip.
export const OH_ARCHIVE_END = (() => {
  if (!HAS_ARCHIVE) return "";
  const [y, m] = OH_LIVE_FROM.split("-").map(Number);
  const d = new Date(y, m - 1, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
})();

export const OH_ARCHIVE_ID_PREFIX = "archive:";

export function isOhArchivedId(id?: string | null) {
  return !!id && id.startsWith(OH_ARCHIVE_ID_PREFIX);
}

export function isOhArchivedDate(date: string) {
  return OH_ARCHIVE_END !== "" && date <= OH_ARCHIVE_END;
}

export function ohArchiveLockedMessage() {
  return `Data Tabungan Bersama sampai ${OH_ARCHIVE_END} diambil dari arsip di kode dan tidak bisa ditambah, diubah, atau dihapus dari aplikasi. Pilih tanggal ${OH_LIVE_START} atau setelahnya.`;
}

// ===== MEMUAT ARSIP =====
export type ArchivedOhPayment = Omit<OhPayment, "memberId"> & { id: string; memberName: string };
export type ArchivedOhExpense = OhKasExpense & { id: string };
export type ArchivedOhLoan = OhLoan & { id: string };

export interface LoadedOhArchive {
  payments: ArchivedOhPayment[];
  expenses: ArchivedOhExpense[];
  loans: ArchivedOhLoan[];
}

export const EMPTY_OH_ARCHIVE: LoadedOhArchive = { payments: [], expenses: [], loans: [] };

let archivePromise: Promise<LoadedOhArchive> | null = null;

export function loadOhArchive(): Promise<LoadedOhArchive> {
  if (archivePromise) return archivePromise;

  archivePromise = (async () => {
    const months = getOhArchiveMonths();
    if (months.length === 0) return EMPTY_OH_ARCHIVE;
    const missing: string[] = [];

    const loaded = await Promise.all(
      months.map(async (m): Promise<OhArchiveMonth> => {
        try {
          const mod = await import(`./months/${m}`);
          return mod.default as OhArchiveMonth;
        } catch (err) {
          console.error(`File arsip Orang Have bulan ${m} tidak ditemukan / gagal dimuat`, err);
          missing.push(m);
          return { pay: [], kas: [], loan: [] };
        }
      })
    );

    if (missing.length > 0 && typeof window !== "undefined") {
      window.alert(
        `File arsip Tabungan Bersama belum ada untuk bulan: ${missing.join(", ")}.\n` +
          `Buat dengan "npm run archive:oh", atau turunkan OH_LIVE_FROM di lib/orang-have/archive/config.ts.`
      );
    }

    // createdAt dibuat dari urutan baris (1 tanggal: baris pertama = terbaru), seperti arsip jurnal
    const synth = (dates: string[]) => {
      const perDate = new Map<string, number>();
      for (const d of dates) perDate.set(d, (perDate.get(d) ?? 0) + 1);
      const seen = new Map<string, number>();
      return dates.map((date) => {
        const j = seen.get(date) ?? 0;
        seen.set(date, j + 1);
        const [y, mo, d] = date.split("-").map(Number);
        return Date.UTC(y, mo - 1, d) + ((perDate.get(date) ?? 1) - j) * 1000;
      });
    };

    const payRows = loaded.flatMap((x) => x.pay);
    const payTimes = synth(payRows.map((r) => r[0]));
    const payments: ArchivedOhPayment[] = payRows.map(
      ([paidDate, memberName, month, savings, kas, proof, note], i) => ({
        id: `${OH_ARCHIVE_ID_PREFIX}pay-${i}`,
        memberName,
        month,
        savings,
        kas,
        paidDate,
        proof,
        note,
        createdAt: payTimes[i],
      })
    );

    const kasRows = loaded.flatMap((x) => x.kas);
    const kasTimes = synth(kasRows.map((r) => r[0]));
    const expenses: ArchivedOhExpense[] = kasRows.map(([date, type, direction, amount, note, proof], i) => ({
      id: `${OH_ARCHIVE_ID_PREFIX}kas-${i}`,
      type,
      direction,
      date,
      amount,
      note,
      proof,
      createdAt: kasTimes[i],
    }));

    const loanRows = loaded.flatMap((x) => x.loan);
    const loanTimes = synth(loanRows.map((r) => r[0]));
    const loans: ArchivedOhLoan[] = loanRows.map(
      ([date, borrower, amount, fee, dueDate, repaidDate, note, proof, repaidProof], i) => ({
        id: `${OH_ARCHIVE_ID_PREFIX}loan-${i}`,
        borrower,
        amount,
        fee,
        date,
        dueDate,
        repaidDate: repaidDate || null,
        note,
        proof,
        repaidProof,
        createdAt: loanTimes[i],
      })
    );

    return { payments, expenses, loans };
  })();

  return archivePromise;
}

// Arsip menyimpan nama anggota (bukan id). id dicocokkan dari daftar anggota di Firebase berdasarkan nama,
// jadi jangan mengganti nama anggota yang setorannya sudah diarsipkan.
export function attachMemberIds(
  archived: ArchivedOhPayment[],
  members: (OhMember & { id: string })[]
): (OhPayment & { id: string })[] {
  const byName = new Map(members.map((m) => [m.name.trim().toLowerCase(), m.id]));
  return archived.map(({ memberName, ...rest }) => ({
    ...rest,
    memberId: byName.get(memberName.trim().toLowerCase()) ?? `${OH_ARCHIVE_ID_PREFIX}member:${memberName}`,
  }));
}