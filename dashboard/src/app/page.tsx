"use client";

import { useEffect, useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Stablecoin, Transfer, Account, AuditResult } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

const GITHUB_URL = "https://github.com/kingdomcoding/stable_mint";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api";

const techStack = [
  { label: "Elixir/Phoenix", detail: "API + OTP supervision" },
  { label: "Ash Framework", detail: "Resources, domains, JSON:API" },
  { label: "TypeScript/Next.js", detail: "This dashboard" },
  { label: "PostgreSQL", detail: "Double-entry ledger" },
];

const highlights = [
  {
    title: "Multi-Chain Adapters",
    description:
      "ChainAdapter behaviour with mock Ethereum, Solana, and Stellar implementations. Adding a chain = one module + one registry line.",
  },
  {
    title: "Double-Entry Ledger",
    description:
      "Every transfer produces exactly two ledger entries that sum to zero. The audit endpoint verifies this invariant globally.",
  },
  {
    title: "OTP Supervision",
    description:
      "Each chain gets its own GenServer under a one_for_one supervisor. If Ethereum crashes, Solana and Stellar keep running.",
  },
  {
    title: "Ash-Powered JSON:API",
    description:
      "Zero controllers. Resources declare actions, validations, and routes. AshJsonApi generates spec-compliant endpoints automatically.",
  },
];

export default function OverviewPage() {
  const [stablecoins, setStablecoins] = useState<Stablecoin[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      StableMintClient.getStablecoins(),
      StableMintClient.getAccounts(),
      StableMintClient.getAllTransfers(),
      StableMintClient.getAudit(),
    ])
      .then(([coins, accts, xfers, auditResult]) => {
        setStablecoins(coins);
        setAccounts(accts);
        setTransfers(xfers);
        setAudit(auditResult);
      })
      .catch((err) => setError(String(err)));
  }, []);

  const accountName = (id: string | null) => {
    if (!id) return "-";
    return accounts.find((a) => a.id === id)?.name ?? id.slice(0, 8) + "...";
  };

  const recentTransfers = [...transfers]
    .sort((a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime())
    .slice(0, 5);
  const maxSupply = Math.max(
    ...stablecoins.map((c) => parseFloat(c.total_supply || "0")),
    1
  );

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-2">StableMint</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          A toy stablecoin orchestration platform built to mirror{" "}
          <a
            href="https://brale.xyz"
            className="underline hover:text-gray-900 dark:hover:text-gray-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            Brale&apos;s
          </a>{" "}
          architecture. Mints, burns, and transfers flow through a double-entry
          ledger with chain-specific adapters — all declared via Ash Framework
          resources.
        </p>
        <div className="flex gap-3 mb-6">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
          >
            View Source
          </a>
          <a
            href={`${API_URL}/open_api`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            OpenAPI Spec
          </a>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {techStack.map((t) => (
            <span
              key={t.label}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
              title={t.detail}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4 dark:border-gray-700">
          <p className="text-sm text-gray-500">Stablecoins</p>
          <p className="text-3xl font-bold">{stablecoins.length}</p>
        </div>
        <div className="border rounded-lg p-4 dark:border-gray-700">
          <p className="text-sm text-gray-500">Accounts</p>
          <p className="text-3xl font-bold">
            {accounts.filter((a) => a.type === "customer").length}
          </p>
        </div>
        <div className="border rounded-lg p-4 dark:border-gray-700">
          <p className="text-sm text-gray-500">Ledger Status</p>
          <p className="text-3xl font-bold">
            {audit ? (
              <span
                className={audit.balanced ? "text-green-600" : "text-red-600"}
              >
                {audit.balanced ? "Balanced" : "Unbalanced"}
              </span>
            ) : (
              "..."
            )}
          </p>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-3">Supply by Coin</h3>
      <div className="border rounded-lg p-4 dark:border-gray-700 mb-8">
        {stablecoins.map((coin) => {
          const supply = parseFloat(coin.total_supply || "0");
          const pct = maxSupply > 0 ? (supply / maxSupply) * 100 : 0;
          return (
            <div key={coin.id} className="flex items-center gap-3 py-2">
              <span className="w-12 font-mono text-sm font-semibold">
                {coin.symbol}
              </span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gray-900 dark:bg-gray-200 h-full rounded-full transition-all"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className="w-24 text-right font-mono text-sm">
                {supply.toLocaleString()}
              </span>
              {coin.status === "paused" && (
                <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  paused
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {highlights.map((h) => (
          <div
            key={h.title}
            className="border rounded-lg p-4 dark:border-gray-700"
          >
            <h4 className="font-semibold mb-1">{h.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {h.description}
            </p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
      {recentTransfers.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700 text-left">
              <th className="pb-2">Type</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">From / To</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentTransfers.map((t) => (
              <tr key={t.id} className="border-b dark:border-gray-800">
                <td className="py-2 capitalize">{t.type}</td>
                <td className="py-2 font-mono">
                  {parseFloat(t.amount).toLocaleString()} {t.currency}
                </td>
                <td className="py-2 text-sm text-gray-600 dark:text-gray-400">
                  {accountName(t.source_id)} → {accountName(t.destination_id)}
                </td>
                <td className="py-2">
                  <StatusBadge status={t.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-sm">No activity yet</p>
      )}
    </div>
  );
}
