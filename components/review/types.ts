import { TransactionCategory } from "@/lib/types/finance";

export type ReviewItem =
  | {
      kind: "transaction";
      id: string;
      key: string;
      date: string;
      createdAt: number;
      categoryValue: string; // "tx:expense:<kategori>" | "tx:income:<kategori|general>"
      categoryLabel: string;
      txType: "income" | "expense";
      category: TransactionCategory | null;
      amount: number;
      note: string;
    }
  | {
      kind: "journal";
      id: string;
      key: string;
      date: string;
      createdAt: number;
      categoryValue: string; // "jr:<categoryId>"
      categoryLabel: string;
      content: string;
    };

export type TransactionReviewItem = Extract<ReviewItem, { kind: "transaction" }>;
export type JournalReviewItem = Extract<ReviewItem, { kind: "journal" }>;