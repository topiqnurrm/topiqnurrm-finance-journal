"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import BackButton from "@/components/ui/BackButton";
import ArchiveCleanupPanel from "@/components/archive/ArchiveCleanupPanel";
import { planOhCleanup } from "@/lib/orang-have/archive/cleanup";

export default function OhHapusArsipPage() {
  const { isOwner } = useAuth();
  return (
    <div className="mx-auto max-w-2xl space-y-4 overflow-x-hidden p-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-semibold text-white">Hapus Data Arsip (Tabungan Bersama)</h1>
      </div>
      <ArchiveCleanupPanel
        title="Bersihkan Firebase dari data Orang Have yang sudah diarsipkan"
        intro="Setoran, catatan kas / audit, dan pinjaman lunas bulan arsip sudah tersimpan di kode. Salinannya di Firebase bisa dihapus. Anggota dan pinjaman yang belum lunas tidak pernah dihapus."
        isOwner={isOwner}
        plan={async () => {
          const r = await planOhCleanup();
          return {
            groups: r.groups,
            message: r.empty ? "Belum ada bulan yang diarsipkan di Tabungan Bersama, jadi tidak ada yang bisa dihapus." : undefined,
          };
        }}
      />
    </div>
  );
}