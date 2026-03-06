# StableMint

A toy stablecoin issuance and orchestration platform inspired by
[Brale](https://brale.xyz). Built with Elixir/Phoenix + Ash Framework +
TypeScript/Next.js.

## Live Demo

- **Dashboard**: https://stablemint.josboxoffice.com
- **API**: https://stablemint-api.josboxoffice.com/api
- **OpenAPI**: https://stablemint-api.josboxoffice.com/api/open_api

## Quick Start

```bash
docker compose up --build

# API:       http://localhost:4400/api
# Dashboard: http://localhost:3000
# OpenAPI:   http://localhost:4400/api/open_api
```

Local dev (no Docker):

```bash
mix setup
mix phx.server         # starts on :4400

cd dashboard
npm install
npm run dev            # starts on :3000
```

Run tests:

```bash
mix test               # 24 tests
cd dashboard && npx tsc --noEmit
```

## Architecture Decisions

### Why Ash Framework
Ash is the declarative backbone. Resources define data, actions,
validations, and API endpoints in one place. AshJsonApi auto-generates
JSON:API compliant endpoints — no controllers, views, or serializers.
Code interfaces live on domains, not resources.

### Multi-Chain Adapter Pattern
Each blockchain implements a `ChainAdapter` behaviour. Adding a new
chain = implement ~6 callbacks + one line in the registry. Chain-specific
concerns are encapsulated — the API consumer never knows which chain.

### Double-Entry Ledger
Every transfer produces exactly two ledger entries that sum to zero.
The `audit` action verifies this invariant globally.

### OTP Supervision for Chain Isolation
Each chain gets its own GenServer under a one_for_one supervisor.
If Ethereum crashes, Solana and Stellar keep running.

### Unified Transfer Model
Mints, burns, and movements are all "transfers" with different types.
All logic lives inside Ash actions via changes and validations.

## Project Structure

```
lib/stable_mint/
  chains/          # ChainAdapter behaviour + mock adapters + GenServer processors
  stablecoins/     # Stablecoin + Deployment Ash resources
  banking/         # Account + Address + FiatAccount Ash resources
  platform/        # Transfer + LedgerEntry Ash resources
  changes/         # Custom Ash changes (ledger entries, chain dispatch)
  validations/     # Custom Ash validations (balance, mint/burn enabled)

dashboard/
  src/lib/         # TypeScript types + API client
  src/app/         # Next.js pages (overview, stablecoins, transfers, ledger)
  src/components/  # React components (MintForm, BurnForm, StatusBadge, etc.)
  src/hooks/       # React hooks (useTransfers, useBalances)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stablecoins` | List stablecoins |
| POST | `/api/stablecoins` | Create stablecoin |
| GET | `/api/deployments` | List deployments |
| POST | `/api/deployments` | Deploy to chain |
| GET | `/api/accounts` | List accounts |
| POST | `/api/accounts` | Create account |
| POST | `/api/deployments/:id/mints` | Mint tokens |
| POST | `/api/deployments/:id/redemptions` | Burn tokens |
| POST | `/api/accounts/:id/transfers` | Transfer tokens |
| GET | `/api/accounts/:id/transfers` | List transfers |
| GET | `/api/ledger/entries` | List ledger entries |

All mutation endpoints require an `Idempotency-Key` header.

## What I'd Do Differently at Scale

- Real chain integrations via ethereumex, solana-elixir
- Broadway for high-throughput transaction processing
- Event sourcing with `commanded` for aggregate boundaries
- AshAuthentication for OAuth2 client_credentials
- Multi-region PostgreSQL with read replicas
- HSM-backed key management for custody signing
