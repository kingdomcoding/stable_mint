"use client";

import { useEffect, useState, useCallback } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Account, Address, Deployment } from "@/lib/types";
import ChainBadge from "@/components/ChainBadge";
import CreateAccountForm from "@/components/CreateAccountForm";
import AddAddressForm from "@/components/AddAddressForm";
import TransferForm from "@/components/TransferForm";

const RESERVE_ID = "00000000-0000-0000-0000-000000000000";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [addresses, setAddresses] = useState<(Address & { accountName: string })[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [balances, setBalances] = useState<
    Record<string, { currency: string; amount: string }[]>
  >({});
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    Promise.all([
      StableMintClient.getAccounts(),
      StableMintClient.getDeployments(),
    ])
      .then(async ([accts, deps]) => {
        setAccounts(accts);
        setDeployments(deps);

        const allAddresses = await Promise.all(
          accts.map((a) => StableMintClient.getAddresses(a.id))
        );
        const withNames = allAddresses.flat().map((addr) => ({
          ...addr,
          accountName: accts.find((a) => a.id === addr.account_id)?.name ?? "Unknown",
        }));
        setAddresses(withNames);

        const balanceMap: Record<string, { currency: string; amount: string }[]> = {};
        await Promise.all(
          accts.map(async (a) => {
            const entries = await StableMintClient.getLedgerEntriesForAccount(a.id);
            const byCurrency = new Map<string, string>();
            for (const entry of entries) {
              if (!byCurrency.has(entry.currency)) {
                byCurrency.set(entry.currency, entry.balance_after);
              }
            }
            balanceMap[a.id] = Array.from(byCurrency.entries()).map(
              ([currency, amount]) => ({ currency, amount })
            );
          })
        );
        setBalances(balanceMap);
      })
      .catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSuspend(account: Account) {
    try {
      await StableMintClient.suspendAccount(account.id);
      loadData();
    } catch (err) {
      setError(String(err));
    }
  }

  const sorted = [...accounts].sort((a, b) => {
    if (a.id === RESERVE_ID) return 1;
    if (b.id === RESERVE_ID) return -1;
    if (a.type === "customer" && b.type !== "customer") return -1;
    if (a.type !== "customer" && b.type === "customer") return 1;
    return 0;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Accounts</h2>
        <CreateAccountForm onSuccess={() => loadData()} />
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {sorted.map((account) => {
        const acctAddresses = addresses.filter(
          (a) => a.account_id === account.id
        );
        const acctBalances = balances[account.id] ?? [];
        const isReserve = account.id === RESERVE_ID;

        return (
          <div
            key={account.id}
            className="border rounded-lg p-4 mb-4 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{account.name}</h3>
                <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {account.type}
                </span>
                <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {account.custody_model}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    account.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {account.status}
                </span>
              </div>
              {account.status === "active" && !isReserve && (
                <button
                  onClick={() => handleSuspend(account)}
                  className="px-2 py-0.5 border rounded text-xs hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Suspend
                </button>
              )}
            </div>

            {isReserve && (
              <p className="text-sm text-gray-500 mb-3">
                System account for double-entry bookkeeping. Negative balances
                represent tokens minted into circulation.
              </p>
            )}

            {acctBalances.length > 0 && (
              <div className="flex gap-3 mb-3">
                {acctBalances.map((b) => (
                  <div
                    key={b.currency}
                    className="border rounded px-3 py-1.5 dark:border-gray-700 inline-flex items-center gap-2"
                  >
                    <span className="font-mono font-semibold">
                      {parseFloat(b.amount).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">{b.currency}</span>
                  </div>
                ))}
              </div>
            )}

            {!isReserve && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">Addresses</p>
                  <AddAddressForm
                    accountId={account.id}
                    onSuccess={() => loadData()}
                  />
                </div>
                {acctAddresses.length > 0 ? (
                  <div className="space-y-1">
                    {acctAddresses.map((addr) => (
                      <div key={addr.id} className="flex items-center gap-2">
                        <ChainBadge chain={addr.chain} />
                        <span className="font-mono text-xs text-gray-500">
                          {addr.address}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No addresses yet</p>
                )}
              </div>
            )}

            {account.type === "customer" &&
              account.status === "active" &&
              acctAddresses.length > 0 && (
                <TransferForm
                  sourceAccountId={account.id}
                  sourceAddresses={acctAddresses}
                  allAccounts={accounts}
                  allAddresses={addresses}
                  deployments={deployments}
                  onSuccess={() => loadData()}
                />
              )}
          </div>
        );
      })}
    </div>
  );
}
