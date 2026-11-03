export type TransactionType = "income" | "expense";

export type ExpenseCategory =
  | "kehidupan"
  | "mendadak"
  | "tabungan"
  | "foya_foya"
  | "grooming"
  | "dana_darurat"
  | "audit"
  | "sisa_dibawa" // sisa uang akhir bulan -> otomatis dihitung sebagai pemasukan bulan berikutnya
  | "hutang"; // hutang / piutang -> tidak dihitung sebagai pemasukan maupun pengeluaran

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

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "kehidupan", label: "Kehidupan" },
  { value: "mendadak", label: "Mendadak" },
  { value: "tabungan", label: "Tabungan" },
  { value: "foya_foya", label: "Foya-foya" },
  { value: "grooming", label: "Grooming" },
  { value: "dana_darurat", label: "Dana Darurat" },
  { value: "audit", label: "Audit" },
  { value: "sisa_dibawa", label: "Sisa Dibawa ke Bulan Depan" },
  { value: "hutang", label: "Hutang / Piutang" },
];

// value "" = pemasukan biasa (category null)
export const INCOME_CATEGORIES: { value: IncomeCategory | ""; label: string }[] = [
  { value: "", label: "Pemasukan" },
  { value: "audit", label: "Audit" },
  { value: "hutang", label: "Hutang / Piutang" },
];

export function getCategoryLabel(
  type: TransactionType,
  category: TransactionCategory | null
): string {
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