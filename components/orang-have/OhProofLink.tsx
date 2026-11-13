import { OH_PROOF_BASE } from "@/lib/orang-have/config";
import { isValidProofName } from "@/lib/orang-have/calc";

// Bukti transfer = file gambar di public/bukti/<nama>. Hanya nama file aman yang dibuatkan link.
export default function OhProofLink({ proof }: { proof: string }) {
  if (!proof || !isValidProofName(proof)) return null;
  return (
    <a
      href={`${OH_PROOF_BASE}${encodeURIComponent(proof)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-blue-400 underline"
    >
      Lihat bukti
    </a>
  );
}
