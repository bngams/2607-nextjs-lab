import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vélib' Explorer",
  description: "Les stations Vélib' en temps réel, avec Next.js",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="bg-emerald-700 text-white px-6 py-3 shadow">
          <h1 className="text-xl font-semibold">🚲 Vélib&apos; Explorer</h1>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </body>
    </html>
  );
}
