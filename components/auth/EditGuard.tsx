"use client";

import { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

export default function EditGuard({ children }: { children: ReactNode }) {
  const { isOwner } = useAuth();
  if (!isOwner) return null;
  return <>{children}</>;
}