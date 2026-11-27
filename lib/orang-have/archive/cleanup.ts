// Rencana penghapusan data Firebase Tabungan Bersama yang SUDAH ada di arsip (lib/orang-have/archive/months).
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { OH_ARCHIVE_END, loadOhArchive } from "@/lib/orang-have/archive";
import { OhKasExpense, OhLoan, OhMember, OhPayment } from "@/lib/types/orang-have";
import { PlanGroup, matchAgainstArchive, norm } from "@/lib/archive/cleanup-core";

const lower = (s: unknown) => norm(s).toLowerCase();

export async function planOhCleanup(): Promise<{ groups: PlanGroup[]; empty: boolean }> {
  if (!OH_ARCHIVE_END) return { groups: [], empty: true };
  const archive = await loadOhArchive();

  // nama anggota (arsip menyimpan nama, bukan id)
  const memSnap = await getDocs(collection(db, "ohMembers"));
  const nameById = new Map(memSnap.docs.map((d) => [d.id, (d.data() as OhMember).name]));

  const groups: PlanGroup[] = [];

  // 1. Setoran (tanggal transfer <= akhir arsip)
  const paySnap = await getDocs(query(collection(db, "ohPayments"), where("paidDate", "<=", OH_ARCHIVE_END)));
  const pays = paySnap.docs.map((d) => ({ id: d.id, data: d.data() as OhPayment }));
  const pSig = (name: string, p: OhPayment) =>
    [p.paidDate, lower(name), p.month, p.savings, p.kas, norm(p.proof), norm(p.note)].join("|");
  const pMatch = matchAgainstArchive(
    pays,
    archive.payments.map((p) => pSig(p.memberName, p as unknown as OhPayment)),
    (p) => pSig(nameById.get(p.memberId) ?? `?${p.memberId}`, p),
    (p) => `${p.paidDate} · ${nameById.get(p.memberId) ?? "anggota tidak ditemukan"} · ${p.month}`
  );
  groups.push({ key: "pay", label: "Setoran", collection: "ohPayments", inRange: pays.length, ...pMatch });

  // 2. Catatan kas / audit
  const kasSnap = await getDocs(query(collection(db, "ohKasExpenses"), where("date", "<=", OH_ARCHIVE_END)));
  const kass = kasSnap.docs.map((d) => ({ id: d.id, data: d.data() as OhKasExpense }));
  const kSig = (k: OhKasExpense) => {
    const audit = k.type === "audit";
    return [k.date, audit ? "audit" : "expense", audit && k.direction === "in" ? "in" : "out", k.amount, norm(k.note), norm(k.proof)].join("|");
  };
  const kMatch = matchAgainstArchive(kass, archive.expenses.map(kSig), kSig, (k) => `${k.date} · ${norm(k.note).slice(0, 40)}`);
  groups.push({ key: "kas", label: "Pengeluaran & audit kas", collection: "ohKasExpenses", inRange: kass.length, ...kMatch });

  // 3. Pinjaman yang sudah lunas dan tanggal lunasnya masuk rentang arsip
  const loanSnap = await getDocs(collection(db, "ohLoans"));
  const loans = loanSnap.docs
    .map((d) => ({ id: d.id, data: d.data() as OhLoan }))
    .filter((l) => !!l.data.repaidDate && (l.data.repaidDate as string) <= OH_ARCHIVE_END);
  const lSig = (l: OhLoan) =>
    [l.date, lower(l.borrower), l.amount, l.fee, norm(l.dueDate), l.repaidDate ?? "", norm(l.note), norm(l.proof), norm(l.repaidProof)].join("|");
  const lMatch = matchAgainstArchive(loans, archive.loans.map(lSig), lSig, (l) => `${l.date} · ${l.borrower} · ${l.amount}`);
  groups.push({
    key: "loan",
    label: "Pinjaman lunas",
    collection: "ohLoans",
    inRange: loans.length,
    note: "Pinjaman yang belum lunas tidak pernah dihapus.",
    ...lMatch,
  });

  return { groups, empty: false };
}