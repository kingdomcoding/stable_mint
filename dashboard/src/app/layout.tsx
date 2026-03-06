import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "StableMint Dashboard",
  description: "Stablecoin orchestration platform",
};

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/stablecoins", label: "Stablecoins" },
  { href: "/transfers", label: "Transfers" },
  { href: "/ledger", label: "Ledger" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen">
          <nav className="w-56 border-r border-gray-200 dark:border-gray-800 p-4 flex-shrink-0 flex flex-col justify-between">
            <div>
              <h1 className="text-lg font-bold mb-6">StableMint</h1>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-6 border-t dark:border-gray-800">
              <p className="text-xs text-gray-400 mb-2">Portfolio project by Jos</p>
              <a
                href="https://github.com/kingdomcoding/stable_mint"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                GitHub →
              </a>
            </div>
          </nav>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
