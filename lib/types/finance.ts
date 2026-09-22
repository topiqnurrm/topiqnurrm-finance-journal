export type TransactionType = "income" | "expense";
export type ExpenseCategory =
  | "kehidupan"
  | "mendadak"
  | "tabungan"
  | "foya_foya"
  | "grooming"
  | "dana_darurat"
  | "audit";

export interface Transaction {
  id?: string;
  type: TransactionType;
  category: ExpenseCategory | null;
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
];

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