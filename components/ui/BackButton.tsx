"use client";

import Link from "next/link";

export default function BackButton({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Kembali"
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-white hover:bg-neutral-700"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
    </Link>
  );
}