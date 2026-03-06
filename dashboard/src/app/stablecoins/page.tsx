"use client";

import { useEffect, useState, useCallback } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Stablecoin, Deployment, Address } from "@/lib/types";
import ChainBadge from "@/components/ChainBadge";
import CreateStablecoinForm from "@/components/CreateStablecoinForm";
import DeployToChainForm from "@/components/DeployToChainForm";
import CoinOperationForm from "@/components/CoinOperationForm";

export default function StablecoinsPage() {
  const [stablecoins, setStablecoins] = useState<Stablecoin[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [addresses, setAddresses] = useState<(Address & { accountName: string })[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    Promise.all([
      StableMintClient.getStablecoins(),
      StableMintClient.getDeployments(),
      StableMintClient.getAccounts(),
    ])
      .then(async ([coins, deps, accts]) => {
        setStablecoins(coins);
        setDeployments(deps);
        const allAddresses = await Promise.all(
          accts.map((a) => StableMintClient.getAddresses(a.id))
        );
        setAddresses(
          allAddresses.flat().map((addr) => ({
            ...addr,
            accountName: accts.find((a) => a.id === addr.account_id)?.name ?? "Unknown",
          }))
        );
      })
      .catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handlePause(coin: Stablecoin) {
    try {
      await StableMintClient.pauseStablecoin(coin.id);
      loadData();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleResume(coin: Stablecoin) {
    try {
      await StableMintClient.resumeStablecoin(coin.id);
      loadData();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Stablecoins</h2>
        <CreateStablecoinForm onSuccess={() => loadData()} />
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {stablecoins.map((coin) => {
        const coinDeps = deployments.filter((d) => d.stablecoin_id === coin.id);
        const isPaused = coin.status === "paused";

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
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    coin.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {coin.status}
                </span>
                {coin.status === "active" && (
                  <button
                    onClick={() => handlePause(coin)}
                    className="px-2 py-0.5 border rounded text-xs hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                  >
                    Pause
                  </button>
                )}
                {coin.status === "paused" && (
                  <button
                    onClick={() => handleResume(coin)}
                    className="px-2 py-0.5 border rounded text-xs text-green-700 border-green-300 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-950 dark:text-green-400"
                  >
                    Resume
                  </button>
                )}
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Deployments</p>
                <DeployToChainForm
                  stablecoinId={coin.id}
                  existingChains={coinDeps.map((d) => d.chain)}
                  onSuccess={() => loadData()}
                />
              </div>
              {coinDeps.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {coinDeps.map((dep) => (
                    <div
                      key={dep.id}
                      className="border rounded p-2 text-sm dark:border-gray-600"
                    >
                      <ChainBadge chain={dep.chain} />
                      <p className="font-mono text-xs text-gray-500 truncate mt-1">
                        {dep.contract_address}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span
                          className={`text-xs ${dep.mint_enabled ? "text-green-600" : "text-gray-400"}`}
                        >
                          Mint: {dep.mint_enabled ? "on" : "off"}
                        </span>
                        <span
                          className={`text-xs ${dep.burn_enabled ? "text-green-600" : "text-gray-400"}`}
                        >
                          Burn: {dep.burn_enabled ? "on" : "off"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isPaused ? (
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Operations disabled — coin is paused
              </p>
            ) : coinDeps.length > 0 ? (
              <div>
                <p className="text-sm font-medium mb-2">Operations</p>
                <CoinOperationForm
                  symbol={coin.symbol}
                  deployments={coinDeps}
                  addresses={addresses}
                  onSuccess={() => loadData()}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Deploy to a chain to enable operations
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
