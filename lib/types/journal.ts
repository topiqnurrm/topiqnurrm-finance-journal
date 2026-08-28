export interface JournalCategory {
  id?: string;
  name: string;
  createdAt: number;
}
 
export interface JournalEntry {
  id?: string;
  categoryId: string;
  categoryName: string; // denormalized biar query cepat
  content: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}
