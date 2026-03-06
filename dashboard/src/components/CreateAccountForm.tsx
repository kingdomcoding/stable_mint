"use client";

import { useState } from "react";
import { StableMintClient } from "@/lib/api-client";
import type { Account } from "@/lib/types";

export default function CreateAccountForm({
  onSuccess,
}: {
  onSuccess: (account: Account) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"issuer" | "customer">("customer");
  const [custody, setCustody] = useState<"platform" | "self">("platform");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const account = await StableMintClient.createAccount({
        name,
        type,
        custodyModel: custody,
      });
      setName("");
      setOpen(false);
      onSuccess(account);
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
        + Create Account
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
            placeholder="Company Name"
            required
          />
        </div>
        <div>
          <label className="text-sm">Type</label>
          <select
            className="block border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={type}
            onChange={(e) => setType(e.target.value as "issuer" | "customer")}
          >
            <option value="customer">Customer</option>
            <option value="issuer">Issuer</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Custody</label>
          <select
            className="block border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={custody}
            onChange={(e) => setCustody(e.target.value as "platform" | "self")}
          >
            <option value="platform">Platform</option>
            <option value="self">Self</option>
          </select>
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
