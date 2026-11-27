// Inti fitur "hapus data Firebase yang sudah diarsipkan" (dipakai jurnal pribadi dan Tabungan Bersama).
//
// Aturan keselamatan: dokumen Firebase HANYA dihapus kalau ada padanannya di arsip (kode).
// Dokumen yang tidak ditemukan di arsip tidak pernah dihapus, hanya dilaporkan.
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface PlanItem {
  id: string;
  desc: string;
}

export interface PlanGroup {
  key: string;
  label: string; // nama yang tampil, mis. "Transaksi"
  collection: string; // nama koleksi Firebase
  inRange: number; // jumlah dokumen di Firebase pada rentang arsip
  deletable: string[]; // id dokumen yang aman dihapus (ada di arsip)
  kept: PlanItem[]; // dokumen di rentang arsip yang TIDAK ada di arsip -> tidak dihapus
  note?: string; // keterangan tambahan
}

// Cocokkan dokumen Firebase dengan baris arsip memakai tanda (signature) dan hitungan,
// supaya 2 catatan yang sama persis hanya dihapus kalau arsip juga punya 2.
export function matchAgainstArchive<T>(
  docs: { id: string; data: T }[],
  archiveSigs: string[],
  sig: (d: T) => string,
  describe: (d: T) => string
): { deletable: string[]; kept: PlanItem[] } {
  const left = new Map<string, number>();
  for (const s of archiveSigs) left.set(s, (left.get(s) ?? 0) + 1);

  const deletable: string[] = [];
  const kept: PlanItem[] = [];
  for (const d of docs) {
    const s = sig(d.data);
    const n = left.get(s) ?? 0;
    if (n > 0) {
      left.set(s, n - 1);
      deletable.push(d.id);
    } else {
      kept.push({ id: d.id, desc: describe(d.data) });
    }
  }
  return { deletable, kept };
}

// Hapus dalam batch (batas Firestore 500 operasi per batch)
export async function deleteDocs(
  collectionName: string,
  ids: string[],
  onProgress?: (done: number) => void
): Promise<void> {
  const SIZE = 400;
  let done = 0;
  for (let i = 0; i < ids.length; i += SIZE) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + SIZE)) batch.delete(doc(collection(db, collectionName), id));
    await batch.commit();
    done += Math.min(SIZE, ids.length - i);
    onProgress?.(done);
  }
}

export const norm = (v: unknown) => {
  const s = v == null ? "" : String(v).trim();
  return s === "-" ? "" : s;
};