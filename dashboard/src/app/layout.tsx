"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/stablecoins", label: "Stablecoins" },
  { href: "/accounts", label: "Accounts" },
  { href: "/activity", label: "Activity" },
  { href: "/ledger", label: "Ledger" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        <title>StableMint Dashboard</title>
        <meta name="description" content="Stablecoin orchestration platform" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex min-h-screen">
          <nav className="w-56 border-r border-gray-200 dark:border-gray-800 p-4 flex-shrink-0 flex flex-col justify-between">
            <div>
              <h1 className="text-lg font-bold mb-6">StableMint</h1>
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        pathname === link.href
                          ? "bg-gray-100 dark:bg-gray-800 font-medium"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-6 border-t dark:border-gray-800">
              <p className="text-xs text-gray-400 mb-2">Built by Oreoluwa for Brale</p>
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
