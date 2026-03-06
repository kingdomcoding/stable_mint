"use client";

import { useEffect, useState, useCallback } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Account, Address, Deployment, Transfer } from "@/lib/types";
import { useTransfers } from "@/hooks/useTransfers";
import { useBalances } from "@/hooks/useBalances";
import TransferTable from "@/components/TransferTable";
import MintForm from "@/components/MintForm";
import BurnForm from "@/components/BurnForm";
import BalanceCard from "@/components/BalanceCard";

export default function TransfersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { transfers, error: transfersError, refresh: refreshTransfers } = useTransfers(selectedAccount);
  const { entries: balanceEntries, refresh: refreshBalances } = useBalances(selectedAccount);

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
        setAddresses(allAddresses.flat());
        const customer = accts.find((a) => a.type === "customer");
        if (customer && !selectedAccount) setSelectedAccount(customer.id);
      })
      .catch((err) => setError(String(err)));
  }, [selectedAccount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSuccess(transfer: Transfer) {
    const verb = transfer.type === "mint" ? "Minted" : "Burned";
    setSuccessMessage(`${verb} ${parseFloat(transfer.amount).toLocaleString()} ${transfer.currency}`);
    refreshTransfers();
    refreshBalances();
    setTimeout(() => setSuccessMessage(null), 5000);
  }

  const latestEntry = balanceEntries[0];
  const balance = latestEntry ? latestEntry.balance_after : "0";
  const currency = latestEntry ? latestEntry.currency : "ACME";

  const displayError = error || transfersError;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Transfers</h2>

      <div className="mb-4 flex items-center gap-4">
        <div>
          <label className="text-sm font-medium mr-2">Account:</label>
          <select
            className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.type})
              </option>
            ))}
          </select>
        </div>
        {selectedAccount && (
          <BalanceCard label="Balance" amount={balance} currency={currency} />
        )}
      </div>

      {displayError && <p className="text-red-500 text-sm mb-4">{displayError}</p>}

      {successMessage && (
        <div className="border border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950 rounded-lg p-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800 dark:text-green-400 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <MintForm deployments={deployments} addresses={addresses} onSuccess={handleSuccess} />
        <BurnForm deployments={deployments} addresses={addresses} onSuccess={handleSuccess} />
      </div>

      {selectedAccount && <TransferTable transfers={transfers} />}
    </div>
  );
}
