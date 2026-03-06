"use client";

import { useEffect, useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { LedgerEntry, AuditResult, Account } from "@/lib/types";

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [accountFilter, setAccountFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      StableMintClient.getLedgerEntries(),
      StableMintClient.getAccounts(),
      StableMintClient.getAudit(),
    ])
      .then(([e, a, au]) => {
        setEntries(e);
        setAccounts(a);
        setAudit(au);
      })
      .catch((err) => setError(String(err)));
  }, []);

  const accountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name ?? id.slice(0, 8) + "...";

  const filtered = (
    accountFilter
      ? entries.filter((e) => e.account_id === accountFilter)
      : entries
  ).sort(
    (a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
  );

  if (error) {
    return <p className="text-red-500">Failed to load: {error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Ledger</h2>

      <div className="border rounded-lg p-4 mb-6 dark:border-gray-700 bg-blue-50 dark:bg-blue-950">
        <h3 className="font-semibold mb-1">How the Ledger Works</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Every transfer produces exactly two entries: a <strong>debit</strong>{" "}
          from the source and a <strong>credit</strong> to the destination. For
          mints, the source is a virtual reserve account. The totals must always
          balance — if they don&apos;t, something is wrong. This invariant is
          verified by the{" "}
          <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">
            /api/ledger/audit
          </code>{" "}
          endpoint.
        </p>
      </div>

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
            Debits: {parseFloat(audit.total_debits ?? "0").toLocaleString()} |
            Credits: {parseFloat(audit.total_credits ?? "0").toLocaleString()}
          </p>
        </div>
      )}

      <div className="mb-4">
        <label className="text-sm font-medium mr-2">Filter by account:</label>
        <select
          className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
        >
          <option value="">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-gray-700 text-left">
            <th className="pb-2">Type</th>
            <th className="pb-2">Amount</th>
            <th className="pb-2">Currency</th>
            <th className="pb-2 text-right">Balance After</th>
            <th className="pb-2 pl-6">Account</th>
            <th className="pb-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((entry) => (
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
              <td className="py-2 font-mono">
                {parseFloat(entry.amount).toLocaleString()}
              </td>
              <td className="py-2">{entry.currency}</td>
              <td className="py-2 text-right font-mono">
                {parseFloat(entry.balance_after).toLocaleString()}
              </td>
              <td className="py-2 pl-6 text-sm">{accountName(entry.account_id)}</td>
              <td className="py-2 text-gray-500">
                {new Date(entry.inserted_at).toLocaleString()}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
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
