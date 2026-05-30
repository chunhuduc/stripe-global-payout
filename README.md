# Stripe Connect Payout API

Monorepo for admin-driven payee onboarding and payouts via Stripe Connect Custom (Phase 1: API on **Vercel**, **Neon** Postgres, Jordan payees, webhooks).

## Deploy target

- **API:** [Vercel](https://vercel.com) (serverless Express via `api/index.ts`)
- **Database:** [Neon](https://neon.tech) Postgres (free tier; link from Vercel Storage)

See [docs/DEPLOY.md](docs/DEPLOY.md) for full setup.

## Quick start (local)

1. Copy env and set Stripe + Neon URLs:

   ```bash
   cp .env.example .env
   ```

2. Install and migrate:

   ```bash
   npm install
   npm run migrate
   ```

3. Run API locally:

   ```bash
   npm run dev
   ```

Default local base: `http://localhost:3000`. Admin routes require `X-Admin-Key` (`ADMIN_API_KEY`).

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Liveness check |
| POST | `/api/payees` | `X-Admin-Key` | Create Connect Custom payee (Jordan `JO` in phase 1) |
| POST | `/api/payouts` | `X-Admin-Key` | Transfer to connected account and create payout |
| POST | `/webhooks/stripe` | Stripe signature | `payout.paid` / `payout.failed` (deduped by `event.id`) |

### curl examples

Replace `BASE` with `http://localhost:3000` or `https://your-project.vercel.app`.

Health:

```bash
curl -s "$BASE/health"
```

Create Jordan payee:

```bash
curl -s -X POST "$BASE/api/payees" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_API_KEY" \
  -d '{
    "countryCode": "JO",
    "individual": {
      "firstName": "Test",
      "lastName": "Recipient",
      "email": "test.recipient@example.com"
    },
    "bank": {
      "accountHolderName": "Test Recipient",
      "iban": "JO32ABCJ0010123456789012345678",
      "swift": "AAAajoJOXXX"
    }
  }'
```

Initiate payout (`amount` in minor units):

```bash
curl -s -X POST "$BASE/api/payouts" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_API_KEY" \
  -d '{
    "payeeId": "<payee-uuid>",
    "amount": 1000,
    "currency": "jod",
    "transferCurrency": "usd"
  }'
```

Stripe webhooks (local):

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Production webhook URL: `https://<project>.vercel.app/webhooks/stripe`

## Repo layout

| Path | Purpose |
|------|---------|
| `apps/api` | Express API source |
| `api/index.ts` | Vercel serverless entry (imports built `app`) |
| `apps/web` | Admin UI placeholder (phase 2) |
| `packages/shared` | Shared TypeScript types |
| `postman/milestone-1.json` | Postman collection |
| `docs/` | Architecture, deploy, milestones, webhooks |
| `vercel.json` | Vercel build and rewrites |

## Scripts

| Script | Action |
|--------|--------|
| `npm run dev` | Local API (`tsx watch`) |
| `npm run build` | Compile `apps/api` (required before Vercel deploy) |
| `npm run migrate` | Apply SQL to Neon |
| `npm run start` | Run compiled API locally |

## Docs

- [docs/DEPLOY.md](docs/DEPLOY.md): Vercel + Neon
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/MILESTONES.md](docs/MILESTONES.md)
- [docs/WEBHOOKS.md](docs/WEBHOOKS.md)
