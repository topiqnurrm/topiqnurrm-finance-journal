// Membuat file arsip Tabungan Bersama Orang Have per bulan (lib/orang-have/archive/months/YYYY-MM.ts)
// dari file Excel hasil Export di tab "Export" halaman Tabungan Bersama.
//
// Pemakaian (dari folder utama proyek):
//   npm run archive:oh -- <file.xlsx> <bulan> [<bulan> ...]
// Contoh:
//   npm run archive:oh -- ~/Downloads/tabungan-orang-have_semua-data.xlsx 2026-11
//
// Aturan pengelompokan:
//   - Setoran  -> bulan TANGGAL TRANSFER
//   - Kas      -> bulan tanggal catatan (pengeluaran / audit)
//   - Pinjaman -> bulan TANGGAL LUNAS. Pinjaman yang belum lunas tidak diarsipkan (tetap di Firebase).
//   - Untuk bulan pertama arsip (OH_ARCHIVE_FIRST), data bertanggal sebelum bulan itu ikut dimasukkan.
// Setelah itu ubah OH_LIVE_FROM di lib/orang-have/archive/config.ts.
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith("--"));
const args = argv.filter((a) => !a.startsWith("--"));
const force = flags.includes("--force");
const outFlag = flags.find((a) => a.startsWith("--out="));
const OUT_DIR = outFlag ? outFlag.slice(6) : path.join(process.cwd(), "lib", "orang-have", "archive", "months");

function fail(msg) {
  console.error("\n❌ " + msg + "\n");
  process.exit(1);
}

const [file, ...months] = args;
if (!file || months.length === 0) {
  fail("Pemakaian: npm run archive:oh -- <file.xlsx> <bulan YYYY-MM> [<bulan> ...]\nContoh:    npm run archive:oh -- ~/Downloads/tabungan-orang-have.xlsx 2026-11");
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

// Bulan pertama arsip, dari lib/orang-have/archive/config.ts
let ARCHIVE_FIRST = null;
try {
  const cfg = fs.readFileSync(path.join(process.cwd(), "lib", "orang-have", "archive", "config.ts"), "utf8");
  ARCHIVE_FIRST = (cfg.match(/OH_ARCHIVE_FIRST\s*=\s*"(\d{4}-\d{2})"/) || [])[1] ?? null;
} catch {
  /* config tidak ditemukan */
}

const wb = XLSX.read(fs.readFileSync(file));
for (const s of ["Setoran", "Kas", "Pinjaman"]) {
  if (!wb.Sheets[s]) fail(`Sheet "${s}" tidak ada di file. Pastikan ini hasil Export dari halaman Tabungan Bersama.`);
}
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const readObjs = (sheet) =>
  XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: "" }).filter((o) => DATE_RE.test(String(Object.values(o)[0] ?? "")));

// Kolom file bukti punya nama yang menyebut folder: cari berdasarkan awalan
const pick = (o, prefix) => {
  const k = Object.keys(o).find((x) => x.startsWith(prefix));
  return k ? String(o[k] ?? "") : "";
};
const num = (v, where) => {
  if (typeof v !== "number" || !isFinite(v)) fail(`Angka tidak valid (${where}): ${v}`);
  return v;
};

const inMonth = (date, month) =>
  month === ARCHIVE_FIRST ? String(date).slice(0, 7) <= month : String(date).startsWith(month + "-");

const payObjs = readObjs("Setoran");
const kasObjs = readObjs("Kas");
const loanObjs = readObjs("Pinjaman");

const unpaidLoans = loanObjs.filter((o) => String(o["Status"]) !== "Lunas");
if (unpaidLoans.length > 0) {
  console.warn(
    `\n⚠️  ${unpaidLoans.length} pinjaman belum lunas tidak diarsipkan (tetap di Firebase): ` +
      unpaidLoans.map((o) => `${o["Peminjam"]} (${o["Tanggal Pinjam"]})`).join(", ") +
      "\n"
  );
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const rp = (n) => "Rp " + n.toLocaleString("id-ID");
const line = (r) => "    " + JSON.stringify(r) + ",\n";

for (const month of months) {
  const pay = payObjs
    .filter((o) => inMonth(o["Tanggal Transfer"], month))
    .sort((a, b) => String(a["Tanggal Transfer"]).localeCompare(String(b["Tanggal Transfer"])))
    .map((o) => [
      String(o["Tanggal Transfer"]),
      String(o["Anggota"] ?? ""),
      String(o["Periode Setoran"] ?? ""),
      num(o["Tabungan"], `setoran ${o["Tanggal Transfer"]}`),
      num(o["Kas"], `setoran ${o["Tanggal Transfer"]}`),
      pick(o, "File Bukti"),
      String(o["Catatan"] ?? ""),
    ]);

  const kas = kasObjs
    .filter((o) => inMonth(o["Tanggal"], month))
    .sort((a, b) => String(a["Tanggal"]).localeCompare(String(b["Tanggal"])))
    .map((o) => {
      const audit = String(o["Jenis"]) === "Audit";
      const dir = audit && String(o["Arah"]).startsWith("Masuk") ? "in" : "out";
      return [
        String(o["Tanggal"]),
        audit ? "audit" : "expense",
        dir,
        num(o["Jumlah"], `kas ${o["Tanggal"]}`),
        String(o["Keterangan"] ?? ""),
        pick(o, "File Bukti"),
      ];
    });

  const loan = loanObjs
    .filter((o) => String(o["Status"]) === "Lunas" && DATE_RE.test(String(o["Tanggal Lunas"])) && inMonth(o["Tanggal Lunas"], month))
    .sort((a, b) => String(a["Tanggal Lunas"]).localeCompare(String(b["Tanggal Lunas"])))
    .map((o) => [
      String(o["Tanggal Pinjam"]),
      String(o["Peminjam"] ?? ""),
      num(o["Pokok"], `pinjaman ${o["Tanggal Pinjam"]}`),
      num(o["Biaya Pinjaman"], `pinjaman ${o["Tanggal Pinjam"]}`),
      String(o["Jatuh Tempo"] ?? ""),
      String(o["Tanggal Lunas"]),
      String(o["Catatan"] ?? ""),
      pick(o, "File Bukti Pinjaman"),
      pick(o, "File Bukti Lunas"),
    ]);

  if (pay.length === 0 && kas.length === 0 && loan.length === 0 && !force) {
    fail(`Tidak ada data untuk bulan ${month} di file ini. Pastikan Excel berisi semua data (kosongkan tanggal saat Export). (--force untuk membuat file kosong)`);
  }

  const content =
    `// Arsip Tabungan Bersama Orang Have ${month} (read-only). Setoran ${pay.length}, kas ${kas.length}, pinjaman lunas ${loan.length}.\n` +
    `// Dibuat otomatis oleh scripts/archive-oh.mjs dari export Excel. JANGAN diedit manual.\n` +
    `// pay: [tanggal transfer, anggota, periode, tabungan, kas, bukti, catatan]\n` +
    `// kas: [tanggal, jenis, arah, jumlah, keterangan, bukti] / loan: [tgl pinjam, peminjam, pokok, biaya, jatuh tempo, tgl lunas, catatan, bukti pinjaman, bukti lunas]\n` +
    `import type { OhArchiveMonth } from "../types";\n\n` +
    `const data: OhArchiveMonth = {\n  pay: [\n` +
    pay.map(line).join("") +
    `  ],\n  kas: [\n` +
    kas.map(line).join("") +
    `  ],\n  loan: [\n` +
    loan.map(line).join("") +
    `  ],\n};\n\nexport default data;\n`;

  fs.writeFileSync(path.join(OUT_DIR, `${month}.ts`), content);

  const savings = pay.reduce((s, r) => s + r[3], 0);
  const kasIn = pay.reduce((s, r) => s + r[4], 0);
  console.log(`✅ ${month}: ${pay.length} setoran (tabungan ${rp(savings)}, kas ${rp(kasIn)}), ${kas.length} catatan kas, ${loan.length} pinjaman lunas`);
}

const last = [...months].sort().pop();
const [ly, lm] = last.split("-").map(Number);
const next = `${lm === 12 ? ly + 1 : ly}-${String(lm === 12 ? 1 : lm + 1).padStart(2, "0")}`;
console.log(`\nLangkah berikutnya: di lib/orang-have/archive/config.ts ubah  OH_LIVE_FROM = "${next}"  lalu jalankan aplikasi dan cek angkanya.\n`);