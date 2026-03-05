"use client";

import { useEffect, useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Transfer, Account } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    StableMintClient.getAccounts()
      .then(setAccounts)
      .catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;
    StableMintClient.getTransfers(selectedAccount)
      .then(setTransfers)
      .catch((err) => setError(String(err)));
  }, [selectedAccount]);

  if (error) {
    return <p className="text-red-500">Failed to load: {error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Transfers</h2>

      <div className="mb-4">
        <label className="text-sm font-medium mr-2">Account:</label>
        <select
          className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.type})
            </option>
          ))}
        </select>
      </div>

      {selectedAccount && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700 text-left">
              <th className="pb-2">Type</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Currency</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">TX Hash</th>
              <th className="pb-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id} className="border-b dark:border-gray-800">
                <td className="py-2 capitalize">{t.type}</td>
                <td className="py-2 font-mono">{t.amount}</td>
                <td className="py-2">{t.currency}</td>
                <td className="py-2">
                  <StatusBadge status={t.status} />
                </td>
                <td className="py-2 font-mono text-xs truncate max-w-[120px]">
                  {t.chain_tx_hash || "-"}
                </td>
                <td className="py-2 text-gray-500">
                  {new Date(t.inserted_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {transfers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  No transfers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
