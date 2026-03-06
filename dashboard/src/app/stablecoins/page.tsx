"use client";

import { useEffect, useState, useCallback } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Stablecoin, Deployment, Address, Account } from "@/lib/types";
import MintForm from "@/components/MintForm";
import BurnForm from "@/components/BurnForm";
import ChainBadge from "@/components/ChainBadge";
import QuickMint from "@/components/QuickMint";

export default function StablecoinsPage() {
  const [stablecoins, setStablecoins] = useState<Stablecoin[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
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
        setAccounts(accts);
        const allAddresses = await Promise.all(
          accts.map((a) => StableMintClient.getAddresses(a.id))
        );
        setAddresses(allAddresses.flat());
      })
      .catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (error) {
    return <p className="text-red-500">Failed to load: {error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Stablecoins</h2>

      {(() => {
        const ethDep = deployments.find((d) => d.chain === "ethereum");
        const ethAddr = addresses.find((a) => a.chain === "ethereum");
        if (ethDep && ethAddr) {
          return (
            <div className="mb-6">
              <QuickMint
                deployment={ethDep}
                address={ethAddr}
                onSuccess={loadData}
              />
            </div>
          );
        }
        return null;
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <MintForm
          deployments={deployments}
          addresses={addresses}
          onSuccess={loadData}
        />
        <BurnForm
          deployments={deployments}
          addresses={addresses}
          onSuccess={loadData}
        />
      </div>

      {stablecoins.map((coin) => {
        const coinDeployments = deployments.filter(
          (d) => d.stablecoin_id === coin.id
        );
        return (
          <div
            key={coin.id}
            className="border rounded-lg p-4 mb-4 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {coin.name}{" "}
                  <span className="font-mono text-gray-500">
                    ({coin.symbol})
                  </span>
                </h3>
                <p className="text-sm text-gray-500">
                  Decimals: {coin.decimals} | Supply: {coin.total_supply}
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
                          className={`text-xs ${
                            dep.mint_enabled
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          Mint: {dep.mint_enabled ? "on" : "off"}
                        </span>
                        <span
                          className={`text-xs ${
                            dep.burn_enabled
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
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

      {accounts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Accounts</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left">
                <th className="pb-2">Name</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Addresses</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b dark:border-gray-800">
                  <td className="py-2">{a.name}</td>
                  <td className="py-2 capitalize">{a.type}</td>
                  <td className="py-2 capitalize">{a.status}</td>
                  <td className="py-2">
                    {addresses
                      .filter((addr) => addr.account_id === a.id)
                      .map((addr) => (
                        <span key={addr.id} className="mr-2">
                          <ChainBadge chain={addr.chain} />
                        </span>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
