import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./theme.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import AccessGate from "@/components/auth/AccessGate";
import ThemeToggle from "@/components/ui/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keuangan & Jurnal",
  description: "Manajemen keuangan dan jurnal harian",
};

// Dijalankan sebelum halaman tampil supaya tidak berkedip. Bawaan = gelap.
// Ingin bawaan terang? Ubah t="dark" di dalam skrip menjadi t="light" (dan "dark" di bagian catch).
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t="dark";document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {/* AccessGate harus di dalam AuthProvider: menahan halaman sampai login pulih,
              dan menampilkan 404 untuk akun yang tidak terdaftar */}
          <AccessGate>{children}</AccessGate>
        </AuthProvider>
        <ThemeToggle />
      </body>
    </html>
  );
}