"use client";

import { useEffect, useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { LedgerEntry, AuditResult } from "@/lib/types";

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      StableMintClient.getLedgerEntries(),
      StableMintClient.getAudit(),
    ])
      .then(([e, a]) => {
        setEntries(e);
        setAudit(a);
      })
      .catch((err) => setError(String(err)));
  }, []);

  if (error) {
    return <p className="text-red-500">Failed to load: {error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Ledger</h2>

      {audit && (
        <div
          className={`border rounded-lg p-4 mb-6 ${
            audit.balanced
              ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
          }`}
        >
          <p className="font-semibold">
            {audit.balanced ? "Ledger is balanced" : "Ledger is UNBALANCED"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Debits: {audit.total_debits ?? "0"} | Credits:{" "}
            {audit.total_credits ?? "0"}
          </p>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-gray-700 text-left">
            <th className="pb-2">Type</th>
            <th className="pb-2">Amount</th>
            <th className="pb-2">Currency</th>
            <th className="pb-2 text-right">Balance After</th>
            <th className="pb-2">Account</th>
            <th className="pb-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b dark:border-gray-800">
              <td className="py-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    entry.entry_type === "debit"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}
                >
                  {entry.entry_type}
                </span>
              </td>
              <td className="py-2 font-mono">{entry.amount}</td>
              <td className="py-2">{entry.currency}</td>
              <td className="py-2 text-right font-mono">
                {entry.balance_after}
              </td>
              <td className="py-2 font-mono text-xs truncate max-w-[100px]">
                {entry.account_id}
              </td>
              <td className="py-2 text-gray-500">
                {new Date(entry.inserted_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-500">
                No ledger entries
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
