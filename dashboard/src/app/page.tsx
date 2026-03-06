"use client";

import { useEffect, useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Stablecoin, Deployment, Account, Address, AuditResult } from "@/lib/types";
import QuickMint from "@/components/QuickMint";

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
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refreshStats() {
    StableMintClient.getStablecoins().then(setStablecoins);
    StableMintClient.getAudit().then(setAudit);
  }

  useEffect(() => {
    Promise.all([
      StableMintClient.getStablecoins(),
      StableMintClient.getDeployments(),
      StableMintClient.getAccounts(),
      StableMintClient.getAudit(),
    ])
      .then(async ([coins, deps, accts, auditResult]) => {
        setStablecoins(coins);
        setDeployments(deps);
        setAudit(auditResult);
        const allAddresses = await Promise.all(
          accts.map((a: Account) => StableMintClient.getAddresses(a.id))
        );
        setAddresses(allAddresses.flat());
      })
      .catch((err) => setError(String(err)));
  }, []);

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
          architecture. Mints, burns, and transfers flow through a
          double-entry ledger with chain-specific adapters — all declared
          via Ash Framework resources.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
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

      <h3 className="text-lg font-semibold mb-3">Live System State</h3>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4 dark:border-gray-700">
          <p className="text-sm text-gray-500">Stablecoins</p>
          <p className="text-3xl font-bold">{stablecoins.length}</p>
        </div>
        <div className="border rounded-lg p-4 dark:border-gray-700">
          <p className="text-sm text-gray-500">Total Supply</p>
          <p className="text-3xl font-bold">
            {stablecoins
              .reduce(
                (sum, c) => sum + parseFloat(c.total_supply || "0"),
                0
              )
              .toLocaleString()}
          </p>
        </div>
        <div className="border rounded-lg p-4 dark:border-gray-700">
          <p className="text-sm text-gray-500">Ledger Status</p>
          <p className="text-3xl font-bold">
            {audit ? (
              <span
                className={
                  audit.balanced ? "text-green-600" : "text-red-600"
                }
              >
                {audit.balanced ? "Balanced" : "Unbalanced"}
              </span>
            ) : (
              "..."
            )}
          </p>
        </div>
      </div>

      {(() => {
        const ethDep = deployments.find((d) => d.chain === "ethereum");
        const ethAddr = addresses.find((a) => a.chain === "ethereum");
        if (ethDep && ethAddr) {
          return (
            <QuickMint
              deployment={ethDep}
              address={ethAddr}
              onSuccess={refreshStats}
            />
          );
        }
        return null;
      })()}
    </div>
  );
}
