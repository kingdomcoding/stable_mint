"use client";

import { useEffect, useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Stablecoin, Deployment } from "@/lib/types";
import ChainBadge from "@/components/ChainBadge";

export default function StablecoinsPage() {
  const [stablecoins, setStablecoins] = useState<Stablecoin[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      StableMintClient.getStablecoins(),
      StableMintClient.getDeployments(),
    ])
      .then(([coins, deps]) => {
        setStablecoins(coins);
        setDeployments(deps);
      })
      .catch((err) => setError(String(err)));
  }, []);

  if (error) {
    return <p className="text-red-500">Failed to load: {error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Stablecoins</h2>

      {stablecoins.map((coin) => {
        const coinDeployments = deployments.filter(
          (d) => d.stablecoin_id === coin.id
        );
        return (
          <div key={coin.id} className="border rounded-lg p-4 mb-4 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {coin.name}{" "}
                  <span className="font-mono text-gray-500">({coin.symbol})</span>
                </h3>
                <p className="text-sm text-gray-500">
                  Decimals: {coin.decimals} | Supply:{" "}
                  {parseFloat(coin.total_supply || "0").toLocaleString()}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  coin.status === "active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                }`}
              >
                {coin.status}
              </span>
            </div>

            {coinDeployments.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Deployments</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {coinDeployments.map((dep) => (
                    <div key={dep.id} className="border rounded p-2 text-sm dark:border-gray-600">
                      <ChainBadge chain={dep.chain} />
                      <p className="font-mono text-xs text-gray-500 truncate mt-1">
                        {dep.contract_address}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-xs ${dep.mint_enabled ? "text-green-600" : "text-gray-400"}`}>
                          Mint: {dep.mint_enabled ? "on" : "off"}
                        </span>
                        <span className={`text-xs ${dep.burn_enabled ? "text-green-600" : "text-gray-400"}`}>
                          Burn: {dep.burn_enabled ? "on" : "off"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
