import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gummynology Quote System",
  description:
    "Verified B2B supplement manufacturing quote portal for Gummynology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f7f6f1] text-zinc-950">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Gummynology home"
            >
              <Image
                src="/logo.png"
                alt="Gummynology logo"
                width={144}
                height={148}
                priority
                className="h-7 w-auto sm:h-8"
              />
              <span className="text-base font-semibold tracking-wide text-zinc-950">
                Gummynology
              </span>
            </Link>
            <Link
              href="/request-access"
              className="hidden rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800 sm:inline-flex"
            >
              Request Access
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

