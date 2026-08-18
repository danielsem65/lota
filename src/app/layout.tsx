import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lota — Accessibility Audit Platform",
  description: "Accessibility clarity in one scan. Audit any website against WCAG 2.2.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f172a] text-slate-200">
        <nav className="border-b border-slate-800 px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="text-xl font-bold text-emerald-400">
              lota
            </Link>
            <span className="text-sm text-slate-500">
              Accessibility clarity in one scan
            </span>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
