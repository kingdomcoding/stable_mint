"use client";

import { useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Account, Address, Deployment, Transfer, Stablecoin } from "@/lib/types";

export default function TransferForm({
  sourceAccountId,
  sourceAddresses,
  allAccounts,
  allAddresses,
  deployments,
  stablecoins,
  onSuccess,
}: {
  sourceAccountId: string;
  sourceAddresses: Address[];
  allAccounts: Account[];
  allAddresses: (Address & { accountName: string })[];
  deployments: Deployment[];
  stablecoins: Stablecoin[];
  onSuccess: (transfer: Transfer) => void;
}) {
  const [destAccountId, setDestAccountId] = useState("");
  const [sourceAddrId, setSourceAddrId] = useState("");
  const [destAddrId, setDestAddrId] = useState("");
  const [deploymentId, setDeploymentId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const otherAccounts = allAccounts.filter(
    (a) => a.id !== sourceAccountId && a.type === "customer" && a.status === "active"
  );
  const destAddresses = allAddresses.filter((a) => a.account_id === destAccountId);

  const coinSymbol = (dep: Deployment) =>
    stablecoins.find((c) => c.id === dep.stablecoin_id)?.symbol ?? "";

  const activeDeployments = deployments.filter(
    (d) => stablecoins.find((c) => c.id === d.stablecoin_id)?.status === "active"
  );

  const selectedDep = deployments.find((d) => d.id === deploymentId);
  const derivedCurrency = selectedDep ? coinSymbol(selectedDep) : "";
  const filteredSourceAddrs = selectedDep
    ? sourceAddresses.filter((a) => a.chain === selectedDep.chain)
    : sourceAddresses;
  const filteredDestAddrs = selectedDep
    ? destAddresses.filter((a) => a.chain === selectedDep.chain)
    : destAddresses;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const transfer = await StableMintClient.transfer({
        deploymentId,
        sourceAddressId: sourceAddrId,
        destinationAddressId: destAddrId,
        amount,
        currency: derivedCurrency,
        idempotencyKey: crypto.randomUUID(),
      });
      setAmount("");
      setResult(
        `Transferred ${parseFloat(transfer.amount).toLocaleString()} ${transfer.currency}`
      );
      onSuccess(transfer);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm font-medium mb-2">Transfer</p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-gray-500">To Account</label>
          <select
            className="block border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={destAccountId}
            onChange={(e) => {
              setDestAccountId(e.target.value);
              setDestAddrId("");
            }}
            required
          >
            <option value="">Select</option>
            {otherAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Deployment</label>
          <select
            className="block border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={deploymentId}
            onChange={(e) => {
              setDeploymentId(e.target.value);
              setSourceAddrId("");
              setDestAddrId("");
            }}
            required
          >
            <option value="">Select</option>
            {activeDeployments.map((d) => (
              <option key={d.id} value={d.id}>
                {coinSymbol(d)} — {d.chain}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">From</label>
          <select
            className="block border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={sourceAddrId}
            onChange={(e) => setSourceAddrId(e.target.value)}
            required
          >
            <option value="">Select</option>
            {filteredSourceAddrs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.address.slice(0, 12)}...
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">To Address</label>
          <select
            className="block border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={destAddrId}
            onChange={(e) => setDestAddrId(e.target.value)}
            required
          >
            <option value="">Select</option>
            {filteredDestAddrs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.address.slice(0, 12)}...
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="block w-24 border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        {derivedCurrency && (
          <div>
            <label className="text-xs text-gray-500">Currency</label>
            <p className="block px-2 py-1.5 text-sm font-mono text-gray-700 dark:text-gray-300">
              {derivedCurrency}
            </p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !derivedCurrency}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "..." : "Transfer"}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {result && (
        <p className="text-green-700 dark:text-green-400 text-sm mt-2">
          {result}
        </p>
      )}
    </form>
  );
}
