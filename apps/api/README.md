# API package (`apps/api`)

Express + TypeScript service for **Stripe Global Payouts**.

## Layout

| Path | Purpose |
| ---- | ------- |
| `src/app.ts` | Express app: webhooks before `express.json()` |
| `src/routes/` | HTTP handlers (`payees`, `payouts`, `webhooks`, `health`) |
| `src/services/` | Business logic (DB + Stripe orchestration) |
| `src/stripe/` | Stripe integration (v1 client for webhooks, v2 fetch for GP) |
| `src/config/` | Env vars, country registry (JO today) |
| `src/db/` | Neon pool, SQL migrations |
| `src/middleware/adminAuth.ts` | `X-Admin-Key` gate for admin routes |
| `src/utils/normalizePayeeBody.ts` | Accepts `{ name, bank }` or full individual payload |

## Request flow

1. **Payee:** `POST /api/payees` → `payeeService` → `stripe/recipients.ts` (Accounts v2 + Outbound Setup Intent) → insert `payees`.
2. **Payout:** `POST /api/payouts` → `payoutService` → `stripe/outboundPayments.ts` → insert `payouts` (pending).
3. **Webhook:** `POST /webhooks/stripe` → verify signature → dedupe `stripe_webhook_events` → update `payouts.status`.

## Commands

```bash
npm run dev      # from repo root
npm run migrate  # apply src/db/migrations/*.sql
npm run build
```

See repo `docs/CODEMAP.md` and `docs/GETTING-STARTED.md`.
