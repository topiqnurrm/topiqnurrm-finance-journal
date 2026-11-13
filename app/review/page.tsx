"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import ReviewPanel from "@/components/review/ReviewPanel";
import BackButton from "@/components/ui/BackButton";

export default function ReviewPage() {
  const { isOwner, loading } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6 overflow-x-hidden p-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-semibold">Review Detail</h1>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Memuat...</p>
      ) : (
        <ReviewPanel isOwner={isOwner} />
      )}
    </div>
  );
}