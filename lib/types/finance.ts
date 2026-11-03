// "carryover" = sisa uang akhir bulan yang dibawa ke bulan berikutnya.
// Bukan pemasukan dan bukan pengeluaran.
export type TransactionType = "income" | "expense" | "carryover";

export type ExpenseCategory =
  | "kehidupan"
  | "mendadak"
  | "tabungan"
  | "foya_foya"
  | "grooming"
  | "dana_darurat"
  | "audit"
  | "hutang" // hutang / piutang -> tidak dihitung sebagai pemasukan maupun pengeluaran
  | "sisa_dibawa"; // DATA LAMA: dulu sisa bulan dicatat sebagai pengeluaran, kini otomatis dianggap "carryover"

// Jenis pada pemasukan. Pemasukan biasa = category null.
export type IncomeCategory = "audit" | "hutang";

export type TransactionCategory = ExpenseCategory | IncomeCategory;

export interface Transaction {
  id?: string;
  type: TransactionType;
  category: TransactionCategory | null;
  amount: number;
  note: string;
  date: string;
  createdAt: number;
}

export const CARRYOVER_LABEL = "Sisa Dibawa ke Bulan Depan";

// "sisa_dibawa" sengaja tidak ada di daftar ini (sudah jadi jenis sendiri)
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "kehidupan", label: "Kehidupan" },
  { value: "mendadak", label: "Mendadak" },
  { value: "tabungan", label: "Tabungan" },
  { value: "foya_foya", label: "Foya-foya" },
  { value: "grooming", label: "Grooming" },
  { value: "dana_darurat", label: "Dana Darurat" },
  { value: "audit", label: "Audit" },
  { value: "hutang", label: "Hutang / Piutang" },
];

// value "" = pemasukan biasa (category null)
export const INCOME_CATEGORIES: { value: IncomeCategory | ""; label: string }[] = [
  { value: "", label: "Pemasukan" },
  { value: "audit", label: "Audit" },
  { value: "hutang", label: "Hutang / Piutang" },
];

// Termasuk data lama: pengeluaran berkategori "sisa_dibawa" dianggap carryover
export function isCarryover(t: { type: TransactionType; category: TransactionCategory | null }) {
  return t.type === "carryover" || t.category === "sisa_dibawa";
}

export function getEffectiveType(t: {
  type: TransactionType;
  category: TransactionCategory | null;
}): TransactionType {
  return isCarryover(t) ? "carryover" : t.type;
}

export function getCategoryLabel(
  type: TransactionType,
  category: TransactionCategory | null
): string {
  if (type === "carryover" || category === "sisa_dibawa") return CARRYOVER_LABEL;
  if (type === "income") {
    if (!category) return "Pemasukan";
    const label = INCOME_CATEGORIES.find((c) => c.value === category)?.label ?? category;
    return `Pemasukan · ${label}`;
  }
  return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label ?? "Lainnya";
}

export interface Budget {
  id: string; // format: YYYY-MM
  kehidupan: number;
  mendadak: number;
  tabungan: number;
  foya_foya: number;
  grooming: number;
  dana_darurat: number;
  audit: number;
}