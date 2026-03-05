"use client";

import { useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Deployment } from "@/lib/types";

export default function MintForm({
  deployments,
  addresses,
  onSuccess,
}: {
  deployments: Deployment[];
  addresses: { id: string; address: string; chain: string }[];
  onSuccess: () => void;
}) {
  const [deploymentId, setDeploymentId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await StableMintClient.mint({
        deploymentId,
        destinationAddressId: addressId,
        amount,
        currency,
        idempotencyKey: crypto.randomUUID(),
      });
      setAmount("");
      onSuccess();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 dark:border-gray-700">
      <h3 className="font-semibold mb-3">Mint Tokens</h3>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Deployment</label>
          <select
            className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={deploymentId}
            onChange={(e) => setDeploymentId(e.target.value)}
            required
          >
            <option value="">Select</option>
            {deployments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.chain} - {d.contract_address.slice(0, 10)}...
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Destination Address</label>
          <select
            className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
            required
          >
            <option value="">Select</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.chain} - {a.address.slice(0, 10)}...
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm">Currency</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="ACME"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-3 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Minting..." : "Mint"}
      </button>
    </form>
  );
}
