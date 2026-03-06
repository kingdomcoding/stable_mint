"use client";

import { useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Stablecoin } from "@/lib/types";

export default function CreateStablecoinForm({
  onSuccess,
}: {
  onSuccess: (coin: Stablecoin) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const coin = await StableMintClient.createStablecoin({ name, symbol });
      setName("");
      setSymbol("");
      setOpen(false);
      onSuccess(coin);
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
        className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
      >
        + Create Stablecoin
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 dark:border-gray-700">
      <div className="flex items-end gap-3">
        <div>
          <label className="text-sm">Name</label>
          <input
            type="text"
            className="block w-48 border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Dollar"
            required
          />
        </div>
        <div>
          <label className="text-sm">Symbol</label>
          <input
            type="text"
            className="block w-24 border rounded px-2 py-1.5 text-sm font-mono dark:bg-gray-800 dark:border-gray-600"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="ACME"
            maxLength={10}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 bg-gray-900 text-white rounded text-sm hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-1.5 border rounded text-sm dark:border-gray-600"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </form>
  );
}
