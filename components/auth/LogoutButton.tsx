"use client";

import { signOut } from "@/lib/firebase/auth";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
    >
      Logout
    </button>
  );
}
