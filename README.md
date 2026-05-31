# Stripe Global Payouts API

Monorepo for admin-driven freelancer onboarding and payouts via **Stripe Global Payouts** (US platform account, recipients in Jordan, Turkey, and Indonesia). Phase 1 ships the API on **Vercel** with **Neon** Postgres, Jordan wire recipients, and v2 outbound payment webhooks.

## Documentation

Start with **[docs/README.md](docs/README.md)**:

- [Getting started](docs/GETTING-STARTED.md)
- [Global Payouts sandbox](docs/GLOBAL-PAYOUTS-SANDBOX.md)
- [Testing](docs/TESTING.md)
- [Webhooks](docs/WEBHOOKS.md)
- [Deploy](docs/DEPLOY.md)
- [Architecture](docs/ARCHITECTURE.md)

## Quick start (local)

1. Copy environment file:

   ```bash
   cp .env.example .env.local
   ```

   Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`, and `ADMIN_API_KEY` (see [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md)).

2. Install and migrate:

   ```bash
   npm install
   npm run migrate
   ```

3. Run API:

   ```bash
   npm run dev
   ```

4. Webhooks (second terminal):

   ```bash
   stripe listen --forward-to localhost:3000/webhooks/stripe
   ```

   Copy the CLI `whsec_...` into `.env.local` as `STRIPE_WEBHOOK_SECRET` and restart the API.

Default base URL: `http://localhost:3000`. Admin routes require `X-Admin-Key`.

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | None | Service info |
| GET | `/health` | None | Liveness check |
| POST | `/api/payees` | `X-Admin-Key` | Create Global Payouts recipient + wire bank (Jordan in Postman) |
| POST | `/api/payouts` | `X-Admin-Key` | Outbound payment (`STRIPE_FINANCIAL_ACCOUNT_ID` required) |
| GET | `/api/payouts/:id` | `X-Admin-Key` | Payout status |
| POST | `/webhooks/stripe` | Stripe signature | `v2.money_management.outbound_payment.*` |

Postman collection: [`postman/trial-mini-flow.json`](postman/trial-mini-flow.json).

## How it works

1. Freelancer personal and bank data are submitted to your platform.
2. The API creates a Stripe **recipient** (Accounts v2) and **payout method**.
3. An admin triggers an **outbound payment** from your financial account (when configured).
4. Webhooks update payout status: paid, failed, or canceled.

No Connect connected accounts. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Scripts

| Script | Action |
|--------|--------|
| `npm run dev` | Local API |
| `npm run build` | Compile API |
| `npm run migrate` | Apply SQL to Postgres |
| `npm run start` | Run compiled API |

## Deploy

[Vercel](https://vercel.com) + [Neon](https://neon.tech). See [docs/DEPLOY.md](docs/DEPLOY.md).
