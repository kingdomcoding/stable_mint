"use client";

import { useEffect, useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Stablecoin, AuditResult } from "@/lib/types";

export default function OverviewPage() {
  const [stablecoins, setStablecoins] = useState<Stablecoin[]>([]);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      StableMintClient.getStablecoins(),
      StableMintClient.getAudit(),
    ])
      .then(([coins, auditResult]) => {
        setStablecoins(coins);
        setAudit(auditResult);
      })
      .catch((err) => setError(String(err)));
  }, []);

  if (error) {
    return <p className="text-red-500">Failed to load: {error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              "Loading..."
            )}
          </p>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-3">Stablecoins</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-gray-700 text-left">
            <th className="pb-2">Symbol</th>
            <th className="pb-2">Name</th>
            <th className="pb-2">Status</th>
            <th className="pb-2 text-right">Supply</th>
          </tr>
        </thead>
        <tbody>
          {stablecoins.map((coin) => (
            <tr key={coin.id} className="border-b dark:border-gray-800">
              <td className="py-2 font-mono">{coin.symbol}</td>
              <td className="py-2">{coin.name}</td>
              <td className="py-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    coin.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {coin.status}
                </span>
              </td>
              <td className="py-2 text-right font-mono">
                {coin.total_supply}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
