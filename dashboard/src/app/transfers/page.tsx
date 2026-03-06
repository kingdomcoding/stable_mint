"use client";

import { useEffect, useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Account } from "@/lib/types";
import { useTransfers } from "@/hooks/useTransfers";
import TransferTable from "@/components/TransferTable";

export default function TransfersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { transfers, error: transfersError } = useTransfers(selectedAccount);

  useEffect(() => {
    StableMintClient.getAccounts()
      .then((accts) => {
        setAccounts(accts);
        const customer = accts.find((a) => a.type === "customer");
        if (customer) setSelectedAccount(customer.id);
      })
      .catch((err) => setError(String(err)));
  }, []);

  const displayError = error || transfersError;
  if (displayError) {
    return <p className="text-red-500">Failed to load: {displayError}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Transfers</h2>

      <div className="mb-4">
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

      {selectedAccount && <TransferTable transfers={transfers} />}
    </div>
  );
}
