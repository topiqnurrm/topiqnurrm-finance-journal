export type ReviewItem =
  | {
      kind: "transaction";
      id: string;
      key: string;
      date: string;
      createdAt: number;
      categoryValue: string; // "tx:income" | "tx:<kategori>"
      categoryLabel: string;
      txType: "income" | "expense";
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