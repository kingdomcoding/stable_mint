export interface Stablecoin {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  status: "active" | "paused" | "decommissioned";
  total_supply: string;
  inserted_at: string;
  updated_at: string;
}

export interface Deployment {
  id: string;
  chain: "ethereum" | "solana" | "stellar";
  contract_address: string;
  mint_enabled: boolean;
  burn_enabled: boolean;
  stablecoin_id: string;
  inserted_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  type: "issuer" | "customer";
  status: "active" | "suspended";
  custody_model: "platform" | "self";
  inserted_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  chain: "ethereum" | "solana" | "stellar";
  address: string;
  label: string | null;
  account_id: string;
  inserted_at: string;
  updated_at: string;
}

export type TransferType = "mint" | "burn" | "transfer";
export type TransferStatus = "pending" | "processing" | "complete" | "failed";

export interface Transfer {
  id: string;
  idempotency_key: string;
  type: TransferType;
  status: TransferStatus;
  amount: string;
  currency: string;
  source_type: "address" | "fiat_account" | "reserve" | null;
  source_id: string | null;
  destination_type: "address" | "fiat_account" | "reserve" | null;
  destination_id: string | null;
  deployment_id: string;
  chain_tx_hash: string | null;
  error_reason: string | null;
  inserted_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  entry_type: "debit" | "credit";
  amount: string;
  currency: string;
  balance_after: string;
  transfer_id: string;
  account_id: string;
  inserted_at: string;
}

export interface AuditResult {
  balanced: boolean;
  total_debits: string | null;
  total_credits: string | null;
}

export interface JsonApiDocument<T> {
  data: JsonApiResource<T> | JsonApiResource<T>[];
}

export interface JsonApiResource<T> {
  id: string;
  type: string;
  attributes: T;
}
