"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { OH_PROOF_FOLDERS, OH_PROOF_ROOT, OhProofKind } from "@/lib/orang-have/config";
import { isValidProofName } from "@/lib/orang-have/calc";

// Bukti = file gambar di public/tabungan-bersama/<versi>/<jenis>/<nama>. Dibuka sebagai popup besar di halaman yang sama.
// Klik area gelap di luar gambar (atau tombol ✕ / tekan Esc) untuk menutup.
export default function OhProofLink({ proof, kind, label = "Lihat bukti" }: { proof?: string; kind: OhProofKind; label?: string }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!proof || !isValidProofName(proof)) return null;
  const src = `${OH_PROOF_ROOT}${OH_PROOF_FOLDERS[kind]}/${encodeURIComponent(proof)}`;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFailed(false);
          setOpen(true);
        }}
        className="text-xs text-blue-400 underline"
      >
        {label}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Bukti"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup"
              className="absolute right-4 top-4 rounded-full bg-neutral-800 px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
            >
              ✕
            </button>
            {failed ? (
              <p
                className="rounded-xl bg-neutral-900 p-6 text-sm text-neutral-300"
                onClick={(e) => e.stopPropagation()}
              >
                Gambar &quot;{proof}&quot; tidak ditemukan di folder {OH_PROOF_FOLDERS[kind]}.
              </p>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={`Bukti ${proof}`}
                onClick={(e) => e.stopPropagation()}
                onError={() => setFailed(true)}
                className="max-h-[90vh] max-w-[95vw] rounded-lg bg-neutral-900 object-contain shadow-2xl sm:max-w-[90vw]"
              />
            )}
          </div>,
          document.body
        )}
    </>
  );
}