import type {
  Stablecoin,
  Deployment,
  Account,
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
              deployment_id: params.deploymentId,
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
              deployment_id: params.deploymentId,
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
};
