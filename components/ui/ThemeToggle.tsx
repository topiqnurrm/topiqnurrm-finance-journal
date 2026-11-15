"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "theme";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(t);
}

// Tombol melayang di pojok kanan bawah untuk ganti mode gelap / terang.
// Pilihan disimpan di browser (localStorage); skrip di layout.tsx menerapkannya sebelum halaman tampil.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // penyimpanan diblokir: mode tetap berlaku untuk sesi ini saja
    }
  }

  if (!theme) return null;
  const isLight = theme === "light";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Ganti ke mode gelap" : "Ganti ke mode terang"}
      title={isLight ? "Mode gelap" : "Mode terang"}
      className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-lg text-white shadow-lg hover:bg-neutral-700"
    >
      <span aria-hidden>{isLight ? "🌙" : "☀️"}</span>
    </button>
  );
}