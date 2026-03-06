# StableMint

A stablecoin issuance and orchestration platform built to explore the same
architectural problems Brale solves: multi-chain token lifecycle management,
double-entry financial accounting, and fault-isolated chain processing.

Elixir/Phoenix + Ash Framework + TypeScript/Next.js.

**Dashboard**: https://stablemint.josboxoffice.com
&nbsp;|&nbsp;
**API**: https://stablemint-api.josboxoffice.com/api
&nbsp;|&nbsp;
**OpenAPI spec**: https://stablemint-api.josboxoffice.com/api/open_api

```bash
docker compose up --build
# Dashboard  http://localhost:3000
# API        http://localhost:4400/api
# OpenAPI    http://localhost:4400/api/open_api
```

---

## Domain Model

StableMint manages four core concepts organized into three Ash domains:

```
Stablecoins domain          Banking domain              Platform domain
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│  Stablecoin  │            │   Account    │            │   Transfer   │
│              │            │              │            │              │
│  name        │            │  name        │            │  type        │  mint | burn | transfer
│  symbol      │            │  type        │  issuer|   │  status      │  pending → processing → complete
│  decimals    │            │  status      │  customer  │  amount      │
│  status      │  active|   │  custody     │  platform| │  currency    │
│  total_supply│  paused    │              │  self      │  source      │
└──────┬───────┘            └──────┬───────┘            │  destination │
       │ has_many                  │ has_many            │  chain_tx    │
┌──────▼───────┐            ┌──────▼───────┐            └──────┬───────┘
│  Deployment  │            │   Address    │                   │ creates
│              │            │              │            ┌──────▼───────┐
│  chain       │ ethereum|  │  chain       │            │ LedgerEntry  │
│  contract    │ solana|    │  address     │            │              │
│  mint_enabled│ stellar    │  label       │            │  entry_type  │  debit | credit
│  burn_enabled│            │              │            │  amount      │
└──────────────┘            │  FiatAccount │            │  balance_after│
                            │  (for issuer │            │  account_id  │
                            │   reserves)  │            └──────────────┘
                            └──────────────┘
```

A stablecoin gets deployed to one or more chains. Each deployment gets a contract
address and independent mint/burn controls. Accounts hold addresses on specific
chains. Transfers move value between addresses through a deployment, and every
transfer produces exactly two ledger entries.

---

## Why Ash Framework

Brale operates as an issuance-as-a-service platform where the domain model _is_
the product. The hard problem isn't routing HTTP requests — it's encoding the
rules of stablecoin lifecycle management, multi-chain orchestration, and
financial accounting into a system that's correct by construction.

Ash is a natural fit for this kind of domain because resources _are_ the domain
model. A single resource file declares the data shape, state transitions,
validations, side effects, and API surface in one place. There's no translation
layer between "what the business rules are" and "what the code does."

Consider the mint action on Transfer:

```elixir
create :mint do
  accept [:amount, :currency]

  argument :deployment_id, :uuid, allow_nil?: false
  argument :destination_address_id, :uuid, allow_nil?: false
  argument :idempotency_key, :string, allow_nil?: false

  change set_attribute(:type, :mint)
  change set_attribute(:source_type, :reserve)
  change {StableMint.Changes.ResolveDestination, []}
  change {StableMint.Changes.SetIdempotencyKey, []}

  validate {StableMint.Validations.MintEnabled, []}
  validate {StableMint.Validations.PositiveAmount, []}

  change {StableMint.Changes.RecordLedgerEntries, direction: :mint}
  change {StableMint.Changes.AdjustSupply, direction: :mint}
  change {StableMint.Changes.DispatchToChain, []}
end
```

Reading top to bottom, this is a complete specification of what minting means:
accept an amount and currency, resolve the destination address, validate that
minting is enabled on this deployment and the amount is positive, record the
ledger entries, adjust the stablecoin's total supply, and dispatch the
transaction to the chain processor.

The burn and transfer actions are composed from the same building blocks in
different combinations. `RecordLedgerEntries` takes a `:direction` option that
determines which accounts get debited and credited. `AdjustSupply` only runs
for mints and burns (transfers don't change supply). `DispatchToChain` is
identical across all three. This composability means adding a new transfer type
(say, a cross-chain bridge) is a matter of assembling existing changes, not
writing new controller logic.

The domain boundaries map cleanly to Ash domains: `Stablecoins` manages coin
lifecycle and chain deployments, `Banking` manages accounts and addresses,
`Platform` orchestrates transfers and the ledger. Each domain exposes code
interfaces (`mint!`, `burn!`, `get_balance`) that internal code calls, while
AshJsonApi auto-generates the JSON:API HTTP surface from the same resource
definitions. No controllers, serializers, or view layers to keep in sync.

---

## The Double-Entry Ledger

Every transfer — mint, burn, or movement — produces exactly two ledger entries:
one debit and one credit for the same amount. This is the core accounting
invariant.

**Mint** (new tokens enter circulation):
```
Reserve account    ← debit   (balance decreases, representing obligation)
Destination account ← credit  (balance increases, tokens received)
```

**Burn** (tokens leave circulation):
```
Source account     ← debit   (balance decreases, tokens surrendered)
Reserve account    ← credit  (balance increases, obligation reduced)
```

**Transfer** (tokens move between accounts):
```
Source account      ← debit   (balance decreases)
Destination account ← credit  (balance increases)
```

The reserve account (`00000000-0000-0000-0000-000000000000`) is a well-known
sentinel representing the system's reserve pool. When you mint, the reserve's
balance goes negative — this is intentional. It represents the system's
outstanding obligation: how many tokens exist in circulation.

Each ledger entry carries a `balance_after` field computed from the previous
entry for that account and currency:

```elixir
defp create_entry(transfer, account_id, entry_type) do
  balance = current_balance(account_id, transfer.currency)

  balance_after =
    case entry_type do
      :debit -> Decimal.sub(balance, transfer.amount)
      :credit -> Decimal.add(balance, transfer.amount)
    end

  # ... create the entry with this balance_after
end
```

This creates a sequential chain of balances. You can reconstruct any account's
balance at any point in time by reading a single row, without summing the
entire history.

The global invariant is verified by the audit endpoint:

```elixir
action :audit, :map do
  run fn _input, _context ->
    result = Repo.one(
      from e in "ledger_entries",
        select: %{
          total_debits: sum(fragment("CASE WHEN ? = 'debit' THEN ? ELSE 0 END",
                                     e.entry_type, e.amount)),
          total_credits: sum(fragment("CASE WHEN ? = 'credit' THEN ? ELSE 0 END",
                                      e.entry_type, e.amount))
        }
    )

    balanced = Decimal.eq?(result.total_debits, result.total_credits)
    {:ok, %{balanced: balanced, ...}}
  end
end
```

If `balanced` is ever `false`, something has gone fundamentally wrong. This is
the financial equivalent of a checksum — a single query that proves the entire
ledger is consistent.

### Extending to Cross-Chain Transfers

A cross-chain bridge (e.g., moving ACME from Ethereum to Solana) is
conceptually two linked transfers:

1. **Burn** on the source chain — destroy tokens on Ethereum
2. **Mint** on the destination chain — create tokens on Solana

Each leg independently produces balanced ledger entries, so the global invariant
holds without modification. What you'd add is a parent `bridge_transfer` record
that links the two legs and tracks the overall state machine
(`initiated → source_burned → destination_minted → complete`). The Ash
composition model makes this straightforward: a new `:bridge` action that
internally calls the existing `:burn` and `:mint` changes in sequence, with the
bridge record coordinating the two-phase commit.

The total supply stays correct automatically — the burn decrements it on the
source chain's stablecoin record, and the mint increments it on the destination
chain's. If both chains share the same stablecoin, supply is unchanged (tokens
moved, not created). If they're different deployments of the same stablecoin,
the per-deployment accounting tracks where the supply lives.

---

## Multi-Chain Supervision

Each supported chain runs as its own GenServer under a `one_for_one` supervisor:

```
StableMint.Supervisor (one_for_one)
├── Repo
├── PubSub
├── ProcessorRegistry
├── Chains.Supervisor (one_for_one)
│   ├── Processor("ethereum")   ← GenServer, polls every 12s
│   ├── Processor("solana")     ← GenServer, polls every 1s
│   └── Processor("stellar")    ← GenServer, polls every 5s
└── Endpoint
```

The design choice here is `one_for_one` at the chain supervisor level, and the
reason is fault isolation. If the Ethereum processor crashes — a bad RPC
response, a malformed transaction, an unexpected chain state — only the
Ethereum GenServer restarts. Solana and Stellar continue processing without
interruption. This directly maps to how a production multi-chain platform needs
to behave: chain outages are routine (RPC providers go down, chains halt,
upgrades happen), and one chain's problems must never cascade to others.

Each chain implements the `Adapter` behaviour:

```elixir
@callback mint(keyword()) :: {:ok, tx_hash()} | {:error, term()}
@callback burn(keyword()) :: {:ok, tx_hash()} | {:error, term()}
@callback transfer(keyword()) :: {:ok, tx_hash()} | {:error, term()}
@callback get_transaction_status(tx_hash()) :: {:ok, tx_status()} | {:error, term()}
@callback get_balance(address(), token_contract()) :: {:ok, amount()} | {:error, term()}
@callback validate_address(address()) :: :ok | {:error, String.t()}
@callback finality_time() :: pos_integer()
@callback chain_name() :: String.t()
```

`finality_time()` is notable — each chain declares how long it takes to reach
finality (Ethereum ~12s, Solana ~1s, Stellar ~5s). The GenServer uses this to
schedule its confirmation polling interval. This isn't just configuration; it's
a behavioral contract that encodes a real-world property of each chain.

Adding a new chain means implementing these 8 callbacks and adding one line to
the registry. The GenServer, supervisor, dispatch logic, and API surface don't
change. In the adapters here, chain interactions are mocked (they return
simulated tx hashes and randomized confirmation statuses), but the interface is
the same shape you'd use with real chain SDKs.

### Transfer Lifecycle

A transfer moves through states driven by the GenServer:

```
API Request
    │
    ▼
 [pending]  ──── Transfer created, ledger entries recorded
    │
    ▼
Processor.submit()  ──── DispatchToChain sends to the right GenServer
    │
    ▼
 [processing]  ──── Chain transaction submitted, tx_hash recorded
    │
    ▼
:check_confirmations  ──── GenServer polls at chain's finality interval
    │
    ├──► [complete]  ──── Chain confirmed the transaction
    └──► [failed]    ──── Chain rejected or transaction timed out
```

The pending → processing transition happens asynchronously via `GenServer.cast`,
so the API returns immediately with the pending transfer. The GenServer handles
chain submission and confirmation polling independently of the request cycle.

---

## Idempotency

All mutating endpoints require an `Idempotency-Key` header, enforced by a Plug
that runs before any request reaches the router. The key is stored on the
transfer record with a unique constraint — submitting the same key twice returns
a database conflict rather than creating duplicate transactions.

This isn't optional in financial infrastructure. Network retries, client
timeouts, and load balancer replays all produce duplicate requests. Without
idempotency, every retry risks double-minting or double-burning tokens.

---

## What I'd Do Differently at Production Scale

**Replace mock adapters with real chain clients.** Each adapter would use the
actual chain SDK — `ethereumex` for Ethereum JSON-RPC, Solana's web3 client,
Stellar's Horizon API. The behaviour interface wouldn't change; only the
implementations become real.

**Broadway for transaction processing.** The current GenServer-per-chain model
works for low throughput, but at scale you'd want Broadway pipelines with
configurable concurrency, batching, and back-pressure. Each chain becomes a
Broadway pipeline with chain-specific rate limiting (Ethereum ~15 TPS,
Solana ~400 TPS). Broadway's built-in fault tolerance and acknowledgment
tracking replace the manual pending_txs map.

**Event sourcing for the transfer lifecycle.** Instead of updating transfer
status in place, emit domain events (`TransferSubmitted`, `ChainTxConfirmed`,
`TransferFinalized`). This gives you a complete audit trail for free, enables
event-driven side effects (notifications, webhook delivery), and makes it
possible to rebuild system state from events. The `commanded` library fits
naturally here — its aggregates map to Ash resources.

**Distributed locking for idempotency.** The current unique constraint works
for a single database, but at scale you'd want distributed locks (Redis or
PostgreSQL advisory locks) to handle the window between receiving a request
and committing the transaction.

**AshAuthentication for API security.** OAuth2 client_credentials flow for
API consumers, scoped by account. Each customer gets API keys that can only
operate on their own accounts and addresses.

**Separate read and write paths.** The ledger is append-only by nature. A
read replica handles balance queries and audit checks while the primary handles
writes. At higher scale, materialized views or a CQRS split keeps read latency
constant regardless of ledger size.

**HSM-backed signing.** The mock adapters generate fake tx hashes, but real
chain transactions require private key management. Hardware Security Modules
(AWS CloudHSM, Azure Managed HSM) hold signing keys, and the adapter calls out
to the HSM for each transaction. Keys never exist in application memory.

---

## Running Locally

```bash
# With Docker (recommended)
docker compose up --build

# Without Docker
mix setup && mix phx.server    # API on :4400
cd dashboard && npm i && npm run dev  # Dashboard on :3000

# Tests
mix test
cd dashboard && npx tsc --noEmit
```

## API Reference

All mutation endpoints require an `Idempotency-Key` header.
Responses follow the [JSON:API](https://jsonapi.org/) specification.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/stablecoins` | List all stablecoins |
| `POST` | `/api/stablecoins` | Create a stablecoin |
| `PATCH` | `/api/stablecoins/:id/pause` | Pause a stablecoin |
| `PATCH` | `/api/stablecoins/:id/resume` | Resume a paused stablecoin |
| `GET` | `/api/deployments` | List all deployments |
| `POST` | `/api/deployments` | Deploy stablecoin to a chain |
| `GET` | `/api/accounts` | List all accounts |
| `POST` | `/api/accounts` | Create an account |
| `PATCH` | `/api/accounts/:id/suspend` | Suspend an account |
| `PATCH` | `/api/accounts/:id/reactivate` | Reactivate a suspended account |
| `GET` | `/api/accounts/:id/addresses` | List addresses for an account |
| `POST` | `/api/accounts/:id/addresses` | Register an address |
| `POST` | `/api/deployments/:id/mints` | Mint tokens |
| `POST` | `/api/deployments/:id/redemptions` | Burn (redeem) tokens |
| `POST` | `/api/transfers` | Transfer tokens between addresses |
| `GET` | `/api/transfers` | List all transfers |
| `GET` | `/api/accounts/:id/transfers` | List transfers for an account |
| `GET` | `/api/ledger/entries` | List all ledger entries |
| `GET` | `/api/accounts/:id/ledger_entries` | List ledger entries for an account |
| `GET` | `/api/ledger/audit` | Verify ledger balance invariant |

## Project Structure

```
lib/stable_mint/
  stablecoins/       Stablecoin + Deployment resources, lifecycle actions
  banking/           Account + Address + FiatAccount resources
  platform/          Transfer + LedgerEntry resources, transfer actions
  chains/            Adapter behaviour, per-chain GenServers, supervisor
  changes/           Ash changes — ledger recording, supply adjustment, chain dispatch
  validations/       Ash validations — balance checks, mint/burn guards, address format

dashboard/
  src/app/           Next.js pages — overview, stablecoins, accounts, activity, ledger
  src/components/    Forms and UI — mint, burn, transfer, account/address creation
  src/lib/           TypeScript types + JSON:API client
```
