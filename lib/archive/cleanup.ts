// Rencana penghapusan data Firebase jurnal pribadi yang SUDAH ada di arsip (lib/archive/months).
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ARCHIVE_END, loadArchive } from "@/lib/archive";
import { LIVE_FROM } from "@/lib/archive/config";
import { isCarryover, Transaction } from "@/lib/types/finance";
import { JournalEntry } from "@/lib/types/journal";
import { Asset } from "@/lib/types/asset";
import { Reminder } from "@/lib/types/reminder";
import { PlanGroup, matchAgainstArchive, norm } from "./cleanup-core";

const BUDGET_KEYS = ["kehidupan", "mendadak", "tabungan", "foya_foya", "grooming", "dana_darurat", "tabungan_oh", "audit"];

const txSig = (t: Pick<Transaction, "type" | "category" | "amount" | "note" | "date">) => {
  // data lama "sisa_dibawa" di Firebase = "carryover" di arsip
  const carry = isCarryover(t as Transaction);
  return [t.date, carry ? "carryover" : t.type, carry ? "" : t.category ?? "", t.amount, norm(t.note)].join("|");
};

async function readDocs<T>(name: string, field: string, op: "<=" | "<", value: string) {
  const snap = await getDocs(query(collection(db, name), where(field, op, value)));
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as T }));
}

export async function planPersonalCleanup(): Promise<PlanGroup[]> {
  const archive = await loadArchive();
  const groups: PlanGroup[] = [];

  // 1. Transaksi
  const tx = await readDocs<Transaction>("finances", "date", "<=", ARCHIVE_END);
  const txMatch = matchAgainstArchive(
    tx,
    archive.transactions.map(txSig),
    txSig,
    (t) => `${t.date} · ${t.type}${t.category ? ` · ${t.category}` : ""} · ${t.amount} · ${norm(t.note).slice(0, 40)}`
  );
  groups.push({ key: "finances", label: "Transaksi keuangan", collection: "finances", inRange: tx.length, ...txMatch });

  // 2. Jurnal
  const jr = await readDocs<JournalEntry>("journals", "date", "<=", ARCHIVE_END);
  const jrMatch = matchAgainstArchive(
    jr,
    archive.journals.map((j) => `${j.date}|${norm(j.content)}`),
    (j) => `${j.date}|${norm(j.content)}`,
    (j) => `${j.date} · ${norm(j.content).slice(0, 50)}`
  );
  groups.push({ key: "journals", label: "Jurnal", collection: "journals", inRange: jr.length, ...jrMatch });

  // 3. Aset & pengingat: hanya yang bulannya sudah dimigrasi (sebelum extrasLiveStart)
  const start = archive.extrasLiveStart;
  if (start) {
    const assets = await readDocs<Asset>("assets", "date", "<", start);
    const aSig = (a: Asset) => [a.date, norm(a.name), a.quantity, norm(a.unit), a.value ?? "", norm(a.note)].join("|");
    const aMatch = matchAgainstArchive(assets, archive.assets.map(aSig), aSig, (a) => `${a.date} · ${a.name}`);
    groups.push({ key: "assets", label: "Catatan aset", collection: "assets", inRange: assets.length, ...aMatch });

    const rems = await readDocs<Reminder>("reminders", "dueDate", "<", start);
    const rSig = (r: Reminder) => [r.dueDate, norm(r.title), norm(r.note), !!r.important, !!r.done].join("|");
    const rMatch = matchAgainstArchive(rems, archive.reminders.map(rSig), rSig, (r) => `${r.dueDate} · ${r.title}`);
    groups.push({ key: "reminders", label: "Pengingat", collection: "reminders", inRange: rems.length, ...rMatch });
  } else {
    groups.push({
      key: "extras",
      label: "Aset & pengingat",
      collection: "assets",
      inRange: 0,
      deletable: [],
      kept: [],
      note: "Belum ada bulan yang dimigrasi untuk aset / pengingat, jadi tidak ada yang dihapus.",
    });
  }

  // 4. Budget: dokumen id = bulan (YYYY-MM); hanya dihapus kalau nilainya sama dengan arsip
  const bSnap = await getDocs(collection(db, "budgets"));
  const buds = bSnap.docs.filter((d) => d.id < LIVE_FROM).map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
  const bDeletable: string[] = [];
  const bKept: { id: string; desc: string }[] = [];
  for (const b of buds) {
    const a = archive.budgets[b.id] as Record<string, number | undefined> | null | undefined;
    const same = !!a && BUDGET_KEYS.every((k) => (Number(b.data[k]) || 0) === (a[k] || 0));
    if (same) bDeletable.push(b.id);
    else bKept.push({ id: b.id, desc: `Budget ${b.id} (${a === undefined ? "tidak ada di arsip" : a === null ? "arsip kosong" : "nilai berbeda dari arsip"})` });
  }
  groups.push({ key: "budgets", label: "Budget bulanan", collection: "budgets", inRange: buds.length, deletable: bDeletable, kept: bKept });

  return groups;
}