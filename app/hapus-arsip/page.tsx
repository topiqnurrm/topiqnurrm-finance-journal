"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import BackButton from "@/components/ui/BackButton";
import ArchiveCleanupPanel from "@/components/archive/ArchiveCleanupPanel";
import { planPersonalCleanup } from "@/lib/archive/cleanup";

export default function HapusArsipPage() {
  const { isOwner } = useAuth();
  return (
    <div className="mx-auto max-w-2xl space-y-4 overflow-x-hidden p-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-semibold text-white">Hapus Data Arsip (Jurnal Pribadi)</h1>
      </div>
      <ArchiveCleanupPanel
        title="Bersihkan Firebase dari data yang sudah diarsipkan"
        intro="Transaksi, jurnal, aset, pengingat, dan budget bulan arsip sudah tersimpan di kode. Salinannya di Firebase tidak dipakai lagi dan bisa dihapus untuk merapikan database."
        isOwner={isOwner}
        plan={async () => ({ groups: await planPersonalCleanup() })}
      />
    </div>
  );
}