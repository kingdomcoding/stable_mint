import { useEffect, useState, useCallback } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Transfer } from "@/lib/types";

export function useTransfers(accountId: string, pollInterval = 5000) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!accountId) return;
    StableMintClient.getTransfers(accountId)
      .then((data) => {
        setTransfers(data);
        setError(null);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [accountId]);

  useEffect(() => {
    if (!accountId) return;
    refresh();
    const interval = setInterval(refresh, pollInterval);
    return () => clearInterval(interval);
  }, [accountId, pollInterval, refresh]);

  return { transfers, loading, error, refresh };
}
