import type { AmountTone } from "@/lib/utils/finance";

// Ditaruh di folder components supaya class Tailwind-nya ikut terbaca
export const AMOUNT_TONE_CLASS: Record<AmountTone, string> = {
  positive: "text-green-500",
  negative: "text-red-500",
  neutral: "text-sky-400",
};