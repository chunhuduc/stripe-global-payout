# Architecture

## Overview

Production API: `https://aaron-stripe-payout-api.vercel.app`

### System map

Left to right: who calls the API, what it talks to, how Stripe calls back.

```mermaid
flowchart LR
  Admin["Admin\nPostman / curl"]
  API["Express API\nVercel"]
  Neon[("Neon\nPostgres")]
  Stripe["Stripe\nConnect"]

  Admin -->|"X-Admin-Key"| API
  API <-->|"read / write"| Neon
  API <-->|"API calls"| Stripe
  Stripe -.->|"webhooks"| API
```

| Piece | Role |
| ----- | ---- |
| Admin | Creates payees and starts payouts (no Stripe login for payees) |
| Express API | `apps/api`, entry `api/index.ts` on Vercel |
| Neon | `payees`, `payouts`, `stripe_webhook_events` |
| Stripe | Custom accounts, transfer, payout, webhook events |

### API routes (phase 1)

```mermaid
flowchart LR
  subgraph public [No auth]
    H["GET /\nGET /health"]
  end
  subgraph admin [X-Admin-Key]
    P1["POST /api/payees"]
    P2["POST /api/payouts"]
  end
  subgraph stripe [Stripe signature]
    W["POST /webhooks/stripe"]
  end
```

### Flow A: Create payee

```mermaid
sequenceDiagram
  autonumber
  actor Admin
  participant API as API
  participant Stripe
  participant DB as Neon

  Admin->>API: POST /api/payees
  API->>Stripe: Custom account + bank
  Stripe-->>API: account id
  API->>DB: insert payee
  API-->>Admin: payee id
```

### Flow B: Payout + status

```mermaid
sequenceDiagram
  autonumber
  actor Admin
  participant API as API
  participant Stripe
  participant DB as Neon

  Admin->>API: POST /api/payouts
  API->>Stripe: transfer to connected account
  API->>Stripe: payout to bank
  API->>DB: insert payout (pending)
  API-->>Admin: payout ids

  Note over Stripe,API: Later, async
  Stripe->>API: payout.paid or payout.failed
  API->>DB: dedupe event.id, update status
```

## Runtime

- **Production:** Vercel Hobby (free tier), single Express app exported from `api/index.ts`.
- **Database:** Neon serverless Postgres (`@neondatabase/serverless` Pool), pooled `DATABASE_URL` on Vercel.
- **Local:** `npm run dev` listens on `PORT`; same code path via `createApp()`.

## Components

### API (`apps/api`)

- **Express** app factory in `src/app.ts`; routes: health, payees, payouts, webhooks.
- **Middleware:** `requireAdmin` checks `X-Admin-Key` against `ADMIN_API_KEY`.
- **Webhooks:** `/webhooks` router registered before `express.json()` for Stripe raw body verification.

### Data (Neon Postgres)

- **payees**: local id, country, Stripe connected account id, email, status.
- **payouts**: payee link, Stripe transfer/payout ids, amount, currency, status, failure fields.
- **stripe_webhook_events**: primary key on Stripe `event.id` for idempotent processing.

### Stripe

- **Payees:** Connect **Custom** accounts + external bank (Jordan: IBAN + SWIFT in M1).
- **Payout flow:** transfer to connected account, then payout on connected account.
- **Webhooks:** `payout.paid` and `payout.failed` update `payouts` by `stripe_payout_id`.

### Shared (`packages/shared`)

Shared TypeScript types consumed by the API.

## Configuration

- Country modules under `src/config/countries/` (M1: Jordan `JO`).
- Env validation in `src/config/env.ts` (dotenv only outside production).

## Security notes (M1)

- Shared admin API key (set strong value in Vercel env).
- Webhook signing secret required.
- No payee-facing auth in M1.
