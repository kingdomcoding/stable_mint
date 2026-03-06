"use client";

import { useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Address } from "@/lib/types";

export default function AddAddressForm({
  accountId,
  onSuccess,
}: {
  accountId: string;
  onSuccess: (address: Address) => void;
}) {
  const [open, setOpen] = useState(false);
  const [chain, setChain] = useState<"ethereum" | "solana" | "stellar">("ethereum");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const addr = await StableMintClient.createAddress({
        accountId,
        chain,
        address,
      });
      setAddress("");
      setOpen(false);
      onSuccess(addr);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        + Add Address
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 mt-2">
      <select
        className="border rounded px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-600"
        value={chain}
        onChange={(e) => setChain(e.target.value as "ethereum" | "solana" | "stellar")}
      >
        <option value="ethereum">Ethereum</option>
        <option value="solana">Solana</option>
        <option value="stellar">Stellar</option>
      </select>
      <input
        type="text"
        className="flex-1 border rounded px-2 py-1 text-xs font-mono dark:bg-gray-800 dark:border-gray-600"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="0x... or G... or base58"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="px-2 py-1 bg-gray-900 text-white rounded text-xs dark:bg-gray-100 dark:text-gray-900 disabled:opacity-50"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-2 py-1 border rounded text-xs dark:border-gray-600"
      >
        Cancel
      </button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </form>
  );
}
