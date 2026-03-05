import { useEffect, useState, useCallback } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { LedgerEntry } from "@/lib/types";

export function useBalances(accountId: string) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!accountId) return;
    StableMintClient.getLedgerEntries()
      .then((data) => {
        setEntries(data.filter((e) => e.account_id === accountId));
        setError(null);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [accountId]);

  useEffect(() => {
    if (!accountId) return;
    refresh();
  }, [accountId, refresh]);

  return { entries, loading, error, refresh };
}
