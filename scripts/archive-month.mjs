// Membuat file arsip per bulan (lib/archive/months/YYYY-MM.ts) dari file Excel hasil Export aplikasi.
//
// Pemakaian (dari folder utama proyek):
//   npm run archive -- <file.xlsx> <bulan> [<bulan> ...]
// Contoh:
//   npm run archive -- ~/Downloads/keuangan-jurnal_semua-data.xlsx 2026-11
//   npm run archive -- ~/Downloads/keuangan-jurnal_semua-data.xlsx 2026-08 2026-09 2026-10
//
// Skrip hanya menulis file bulan yang disebut. Setelah itu ubah LIVE_FROM di lib/archive/config.ts.
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith("--"));
const args = argv.filter((a) => !a.startsWith("--"));
const force = flags.includes("--force");
const outFlag = flags.find((a) => a.startsWith("--out="));
const OUT_DIR = outFlag ? outFlag.slice(6) : path.join(process.cwd(), "lib", "archive", "months");

function fail(msg) {
  console.error("\n❌ " + msg + "\n");
  process.exit(1);
}

const [file, ...months] = args;
if (!file || months.length === 0) {
  fail("Pemakaian: npm run archive -- <file.xlsx> <bulan YYYY-MM> [<bulan> ...]\nContoh:    npm run archive -- ~/Downloads/keuangan.xlsx 2026-11");
}
for (const m of months) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m)) fail(`Bulan "${m}" harus berformat YYYY-MM, mis. 2026-11.`);
}
if (!fs.existsSync(file)) fail(`File tidak ditemukan: ${file}`);

const now = new Date();
const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
for (const m of months) {
  if (m >= thisMonth && !force) {
    fail(`Bulan ${m} belum selesai (sekarang ${thisMonth}). Arsipkan setelah bulannya lewat supaya datanya tidak berubah lagi. (--force untuk memaksa)`);
  }
}

const wb = XLSX.read(fs.readFileSync(file));
for (const s of ["Transaksi", "Jurnal"]) {
  if (!wb.Sheets[s]) fail(`Sheet "${s}" tidak ada di file. Pastikan ini hasil Export dari aplikasi.`);
}
const readRows = (sheet) =>
  XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, raw: true }).slice(1).filter((r) => r.length && r[0]);
const txRows = readRows("Transaksi");
const jrRows = readRows("Jurnal");

const CAT = {
  Kehidupan: "kehidupan", Mendadak: "mendadak", Tabungan: "tabungan", "Foya-foya": "foya_foya",
  Grooming: "grooming", "Dana Darurat": "dana_darurat", Audit: "audit", "Hutang / Piutang": "hutang",
};
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function convertTx(r, i) {
  const [date, tipe, kat, amount, note] = r;
  const where = `sheet Transaksi, tanggal ${date} (${tipe} / ${kat})`;
  if (typeof date !== "string" || !DATE_RE.test(date)) fail(`Tanggal tidak valid: ${where}`);
  if (typeof amount !== "number" || !isFinite(amount)) fail(`Jumlah tidak valid: ${where}: ${amount}`);
  const text = note === "-" || note == null ? "" : String(note);
  let type, category;
  if (tipe === "Pengeluaran") { type = "expense"; category = CAT[kat]; }
  else if (tipe === "Pemasukan") { type = "income"; category = kat === "-" ? null : CAT[kat]; }
  else if (tipe === "Sisa Bulan") { type = "carryover"; category = null; }
  else if (tipe === "Ambil Tabungan") { type = "withdrawal"; category = CAT[kat]; }
  else fail(`Tipe tidak dikenal: ${where}`);
  if (category === undefined) fail(`Kategori tidak dikenal: ${where}`);
  return [date, type, category, amount, text];
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const rp = (n) => "Rp " + n.toLocaleString("id-ID");

for (const month of months) {
  const tx = txRows.filter((r) => String(r[0]).startsWith(month + "-")).map(convertTx);
  const jr = jrRows
    .filter((r) => String(r[0]).startsWith(month + "-"))
    .map((r) => {
      if (typeof r[0] !== "string" || !DATE_RE.test(r[0])) fail(`Tanggal jurnal tidak valid: ${r[0]}`);
      return [r[0], String(r[1] ?? ""), String(r[2] ?? "")];
    });

  if (tx.length === 0 && jr.length === 0 && !force) {
    fail(`Tidak ada data untuk bulan ${month} di file ini. Pastikan Excel berisi semua data (Export semua data). (--force untuk membuat file kosong)`);
  }

  const line = (r) => "  " + JSON.stringify(r) + ",\n";
  const content =
    `// Arsip ${month} (read-only). Transaksi ${tx.length}, jurnal ${jr.length}.\n` +
    `// Dibuat otomatis oleh scripts/archive-month.mjs dari export Excel. JANGAN diedit manual.\n` +
    `// [tanggal, jenis, kategori, jumlah, catatan] / [tanggal, nama kategori, isi]\n` +
    `// Urutan: tanggal naik, dalam 1 hari terbaru dulu (sama seperti export).\n` +
    `import type { ArchiveMonth } from "../types";\n\n` +
    `const data: ArchiveMonth = {\n  tx: [\n` +
    tx.map((r) => "  " + line(r)).join("") +
    `  ],\n  jr: [\n` +
    jr.map((r) => "  " + line(r)).join("") +
    `  ],\n};\n\nexport default data;\n`;

  fs.writeFileSync(path.join(OUT_DIR, `${month}.ts`), content);

  let income = 0, expense = 0;
  for (const [, type, category, amount] of tx) {
    if (category === "hutang") continue;
    if (type === "income") income += amount;
    if (type === "expense") expense += amount;
  }
  console.log(`✅ ${month}: ${tx.length} transaksi (pemasukan ${rp(income)}, pengeluaran ${rp(expense)}), ${jr.length} jurnal`);
}

const last = [...months].sort().pop();
const [ly, lm] = last.split("-").map(Number);
const next = `${lm === 12 ? ly + 1 : ly}-${String(lm === 12 ? 1 : lm + 1).padStart(2, "0")}`;
console.log(`\nLangkah berikutnya: di lib/archive/config.ts ubah  LIVE_FROM = "${next}"  lalu jalankan aplikasi dan cek angkanya.\n`);
