"use client";

import { useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Deployment } from "@/lib/types";

const ALL_CHAINS: ("ethereum" | "solana" | "stellar")[] = ["ethereum", "solana", "stellar"];

export default function DeployToChainForm({
  stablecoinId,
  existingChains,
  onSuccess,
}: {
  stablecoinId: string;
  existingChains: string[];
  onSuccess: (dep: Deployment) => void;
}) {
  const available = ALL_CHAINS.filter((c) => !existingChains.includes(c));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (available.length === 0) return null;

  async function deploy(chain: "ethereum" | "solana" | "stellar") {
    setLoading(true);
    setError(null);
    try {
      const dep = await StableMintClient.deployToChain({ stablecoinId, chain });
      onSuccess(dep);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Deploy:</span>
      {available.map((chain) => (
        <button
          key={chain}
          onClick={() => deploy(chain)}
          disabled={loading}
          className="px-2 py-1 border rounded text-xs capitalize hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {chain}
        </button>
      ))}
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
