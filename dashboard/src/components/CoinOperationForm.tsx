"use client";

import { useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Deployment, Transfer } from "@/lib/types";

export default function CoinOperationForm({
  symbol,
  deployments,
  addresses,
  onSuccess,
}: {
  symbol: string;
  deployments: Deployment[];
  addresses: { id: string; address: string; chain: string; accountName: string }[];
  onSuccess: (transfer: Transfer) => void;
}) {
  const [deploymentId, setDeploymentId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const selectedDep = deployments.find((d) => d.id === deploymentId);
  const filteredAddresses = selectedDep
    ? addresses.filter((a) => a.chain === selectedDep.chain)
    : addresses;

  async function handleAction(mode: "mint" | "burn") {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const transfer =
        mode === "mint"
          ? await StableMintClient.mint({
              deploymentId,
              destinationAddressId: addressId,
              amount,
              currency: symbol,
              idempotencyKey: crypto.randomUUID(),
            })
          : await StableMintClient.burn({
              deploymentId,
              sourceAddressId: addressId,
              amount,
              currency: symbol,
              idempotencyKey: crypto.randomUUID(),
            });
      setAmount("");
      const verb = mode === "mint" ? "Minted" : "Burned";
      setResult(`${verb} ${parseFloat(transfer.amount).toLocaleString()} ${symbol}`);
      onSuccess(transfer);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const mintDisabled = !selectedDep?.mint_enabled;
  const burnDisabled = !selectedDep?.burn_enabled;
  const formIncomplete = !deploymentId || !addressId || !amount;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-gray-500">Deployment</label>
          <select
            className="block border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={deploymentId}
            onChange={(e) => {
              setDeploymentId(e.target.value);
              setAddressId("");
            }}
          >
            <option value="">Select chain</option>
            {deployments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.chain}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Address</label>
          <select
            className="block border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
          >
            <option value="">Select address</option>
            {filteredAddresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountName} — {a.address.slice(0, 10)}...
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
            className="block w-28 border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleAction("mint")}
          disabled={loading || formIncomplete || mintDisabled}
          className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
          title={mintDisabled ? "Mint disabled on this deployment" : ""}
        >
          Mint
        </button>
        <button
          onClick={() => handleAction("burn")}
          disabled={loading || formIncomplete || burnDisabled}
          className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
          title={burnDisabled ? "Burn disabled on this deployment" : ""}
        >
          Burn
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {result && (
        <p className="text-green-700 dark:text-green-400 text-sm mt-2">
          {result}
        </p>
      )}
    </div>
  );
}
