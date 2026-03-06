import type {
  Stablecoin,
  Deployment,
  Account,
  Address,
  Transfer,
  LedgerEntry,
  AuditResult,
  JsonApiDocument,
  JsonApiResource,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api";

function extractAttributes<T>(doc: JsonApiDocument<T>): T[] {
  const data = Array.isArray(doc.data) ? doc.data : [doc.data];
  return data.map((r: JsonApiResource<T>) => ({ id: r.id, ...r.attributes }) as T & { id: string });
}

function extractOne<T>(doc: JsonApiDocument<T>): T & { id: string } {
  const resource = Array.isArray(doc.data) ? doc.data[0] : doc.data;
  return { id: resource.id, ...resource.attributes } as T & { id: string };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text();
    try {
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
        const messages = parsed.errors.map(
          (e: { detail?: string; title?: string }) => e.detail || e.title || "Unknown error"
        );
        throw new Error(messages.join("; "));
      }
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message !== `API ${res.status}: ${body}`) {
        throw parseErr;
      }
    }
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export const StableMintClient = {
  async getStablecoins(): Promise<Stablecoin[]> {
    const doc = await request<JsonApiDocument<Omit<Stablecoin, "id">>>("/stablecoins");
    return extractAttributes(doc) as Stablecoin[];
  },

  async getDeployments(): Promise<Deployment[]> {
    const doc = await request<JsonApiDocument<Omit<Deployment, "id">>>("/deployments");
    return extractAttributes(doc) as Deployment[];
  },

  async getAccounts(): Promise<Account[]> {
    const doc = await request<JsonApiDocument<Omit<Account, "id">>>("/accounts");
    return extractAttributes(doc) as Account[];
  },

  async getAddresses(accountId: string): Promise<Address[]> {
    const doc = await request<JsonApiDocument<Omit<Address, "id">>>(
      `/accounts/${accountId}/addresses`
    );
    return extractAttributes(doc) as Address[];
  },

  async getTransfers(accountId: string): Promise<Transfer[]> {
    const doc = await request<JsonApiDocument<Omit<Transfer, "id">>>(
      `/accounts/${accountId}/transfers`
    );
    return extractAttributes(doc) as Transfer[];
  },

  async mint(params: {
    deploymentId: string;
    destinationAddressId: string;
    amount: string;
    currency: string;
    idempotencyKey: string;
  }): Promise<Transfer> {
    const doc = await request<JsonApiDocument<Omit<Transfer, "id">>>(
      `/deployments/${params.deploymentId}/mints`,
      {
        method: "POST",
        headers: {
          "Idempotency-Key": params.idempotencyKey,
        },
        body: JSON.stringify({
          data: {
            type: "transfers",
            attributes: {
              amount: params.amount,
              currency: params.currency,
              destination_address_id: params.destinationAddressId,
              idempotency_key: params.idempotencyKey,
            },
          },
        }),
      }
    );
    return extractOne(doc) as Transfer;
  },

  async burn(params: {
    deploymentId: string;
    sourceAddressId: string;
    amount: string;
    currency: string;
    idempotencyKey: string;
  }): Promise<Transfer> {
    const doc = await request<JsonApiDocument<Omit<Transfer, "id">>>(
      `/deployments/${params.deploymentId}/redemptions`,
      {
        method: "POST",
        headers: {
          "Idempotency-Key": params.idempotencyKey,
        },
        body: JSON.stringify({
          data: {
            type: "transfers",
            attributes: {
              amount: params.amount,
              currency: params.currency,
              source_address_id: params.sourceAddressId,
              idempotency_key: params.idempotencyKey,
            },
          },
        }),
      }
    );
    return extractOne(doc) as Transfer;
  },

  async getLedgerEntries(): Promise<LedgerEntry[]> {
    const doc = await request<JsonApiDocument<Omit<LedgerEntry, "id">>>("/ledger/entries");
    return extractAttributes(doc) as LedgerEntry[];
  },

  async getAudit(): Promise<AuditResult> {
    return request<AuditResult>("/ledger/audit");
  },

  async createStablecoin(params: {
    name: string;
    symbol: string;
    decimals?: number;
  }): Promise<Stablecoin> {
    const doc = await request<JsonApiDocument<Omit<Stablecoin, "id">>>(
      "/stablecoins",
      {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          data: {
            type: "stablecoins",
            attributes: {
              name: params.name,
              symbol: params.symbol,
              ...(params.decimals !== undefined && { decimals: params.decimals }),
            },
          },
        }),
      }
    );
    return extractOne(doc) as Stablecoin;
  },

  async pauseStablecoin(id: string): Promise<Stablecoin> {
    const doc = await request<JsonApiDocument<Omit<Stablecoin, "id">>>(
      `/stablecoins/${id}/pause`,
      {
        method: "PATCH",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          data: { type: "stablecoins", attributes: {} },
        }),
      }
    );
    return extractOne(doc) as Stablecoin;
  },

  async resumeStablecoin(id: string): Promise<Stablecoin> {
    const doc = await request<JsonApiDocument<Omit<Stablecoin, "id">>>(
      `/stablecoins/${id}/resume`,
      {
        method: "PATCH",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          data: { type: "stablecoins", attributes: {} },
        }),
      }
    );
    return extractOne(doc) as Stablecoin;
  },

  async deployToChain(params: {
    stablecoinId: string;
    chain: "ethereum" | "solana" | "stellar";
  }): Promise<Deployment> {
    const doc = await request<JsonApiDocument<Omit<Deployment, "id">>>(
      "/deployments",
      {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          data: {
            type: "deployments",
            attributes: {
              chain: params.chain,
              stablecoin_id: params.stablecoinId,
            },
          },
        }),
      }
    );
    return extractOne(doc) as Deployment;
  },

  async createAccount(params: {
    name: string;
    type: "issuer" | "customer";
    custodyModel: "platform" | "self";
  }): Promise<Account> {
    const doc = await request<JsonApiDocument<Omit<Account, "id">>>(
      "/accounts",
      {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          data: {
            type: "accounts",
            attributes: {
              name: params.name,
              type: params.type,
              custody_model: params.custodyModel,
            },
          },
        }),
      }
    );
    return extractOne(doc) as Account;
  },

  async suspendAccount(id: string): Promise<Account> {
    const doc = await request<JsonApiDocument<Omit<Account, "id">>>(
      `/accounts/${id}/suspend`,
      {
        method: "PATCH",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          data: { type: "accounts", attributes: {} },
        }),
      }
    );
    return extractOne(doc) as Account;
  },

  async reactivateAccount(id: string): Promise<Account> {
    const doc = await request<JsonApiDocument<Omit<Account, "id">>>(
      `/accounts/${id}/reactivate`,
      {
        method: "PATCH",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          data: { type: "accounts", attributes: {} },
        }),
      }
    );
    return extractOne(doc) as Account;
  },

  async createAddress(params: {
    accountId: string;
    chain: "ethereum" | "solana" | "stellar";
    address: string;
    label?: string;
  }): Promise<Address> {
    const doc = await request<JsonApiDocument<Omit<Address, "id">>>(
      `/accounts/${params.accountId}/addresses`,
      {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          data: {
            type: "addresses",
            attributes: {
              account_id: params.accountId,
              chain: params.chain,
              address: params.address,
              ...(params.label && { label: params.label }),
            },
          },
        }),
      }
    );
    return extractOne(doc) as Address;
  },

  async transfer(params: {
    deploymentId: string;
    sourceAddressId: string;
    destinationAddressId: string;
    amount: string;
    currency: string;
    idempotencyKey: string;
  }): Promise<Transfer> {
    const doc = await request<JsonApiDocument<Omit<Transfer, "id">>>(
      "/transfers",
      {
        method: "POST",
        headers: { "Idempotency-Key": params.idempotencyKey },
        body: JSON.stringify({
          data: {
            type: "transfers",
            attributes: {
              deployment_id: params.deploymentId,
              source_address_id: params.sourceAddressId,
              destination_address_id: params.destinationAddressId,
              amount: params.amount,
              currency: params.currency,
              idempotency_key: params.idempotencyKey,
            },
          },
        }),
      }
    );
    return extractOne(doc) as Transfer;
  },

  async getAllTransfers(): Promise<Transfer[]> {
    const doc = await request<JsonApiDocument<Omit<Transfer, "id">>>("/transfers");
    return extractAttributes(doc) as Transfer[];
  },

  async getLedgerEntriesForAccount(accountId: string): Promise<LedgerEntry[]> {
    const doc = await request<JsonApiDocument<Omit<LedgerEntry, "id">>>(
      `/accounts/${accountId}/ledger_entries`
    );
    return extractAttributes(doc) as LedgerEntry[];
  },
};
