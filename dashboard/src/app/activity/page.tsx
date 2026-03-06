"use client";

import { useEffect, useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Transfer, Account } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

export default function ActivityPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      StableMintClient.getAllTransfers(),
      StableMintClient.getAccounts(),
    ])
      .then(([xfers, accts]) => {
        setTransfers(xfers);
        setAccounts(accts);
      })
      .catch((err) => setError(String(err)));
  }, []);

  const accountName = (id: string | null) => {
    if (!id) return "-";
    return accounts.find((a) => a.id === id)?.name ?? id.slice(0, 8) + "...";
  };

  const filtered = (
    typeFilter === "all"
      ? transfers
      : transfers.filter((t) => t.type === typeFilter)
  ).sort(
    (a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Activity</h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="flex gap-2 mb-4">
        {["all", "mint", "burn", "transfer"].map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`px-3 py-1 rounded text-sm capitalize ${
              typeFilter === f
                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                : "border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No activity yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700 text-left">
              <th className="pb-2">Type</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">From → To</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">TX Hash</th>
              <th className="pb-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b dark:border-gray-800">
                <td className="py-2 capitalize">{t.type}</td>
                <td className="py-2 font-mono">
                  {parseFloat(t.amount).toLocaleString()} {t.currency}
                </td>
                <td className="py-2 text-gray-600 dark:text-gray-400">
                  {accountName(t.source_id)} → {accountName(t.destination_id)}
                </td>
                <td className="py-2">
                  <StatusBadge status={t.status} />
                </td>
                <td className="py-2 font-mono text-xs text-gray-500 truncate max-w-[120px]">
                  {t.chain_tx_hash || "-"}
                </td>
                <td className="py-2 text-gray-500">
                  {new Date(t.inserted_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
