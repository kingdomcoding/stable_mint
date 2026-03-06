"use client";

import { useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Deployment, Address } from "@/lib/types";

export default function QuickMint({
  deployment,
  address,
  onSuccess,
}: {
  deployment: Deployment;
  address: Address;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleMint() {
    setLoading(true);
    setResult(null);
    try {
      const transfer = await StableMintClient.mint({
        deploymentId: deployment.id,
        destinationAddressId: address.id,
        amount: "1000",
        currency: "ACME",
        idempotencyKey: crypto.randomUUID(),
      });
      setResult(`Minted 1,000 ACME → transfer ${transfer.id.slice(0, 8)}... — check Transfers page to see it in the table`);
      onSuccess();
    } catch (err) {
      setResult(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 dark:border-gray-700 bg-green-50 dark:bg-green-950">
      <h3 className="font-semibold mb-2">Try it: Mint 1,000 ACME</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        One click. Mints tokens to Alice on Ethereum, creates ledger entries,
        dispatches to chain processor.
      </p>
      <button
        onClick={handleMint}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Minting..." : "Mint 1,000 ACME"}
      </button>
      {result && (
        <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
          {result}
        </p>
      )}
    </div>
  );
}
