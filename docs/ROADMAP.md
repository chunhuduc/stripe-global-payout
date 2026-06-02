# Roadmap

## v0.1 (current)

**Goal:** Production-style API for Stripe Global Payouts.

**Delivered:**

- Express API (TypeScript), Vercel deployable
- Neon Postgres schema and migrations
- `POST /api/payees`: Accounts v2 recipient + wire payout method (Jordan)
- `POST /api/payouts`, `GET /api/payouts/:id`: Outbound Payment flow
- `POST /webhooks/stripe`: signature verification, event deduplication, status sync
- Postman: `postman/global-payouts-api.json`
- Documentation under `docs/`

## v0.2 (planned)

- Admin dashboard (`apps/web`): payee list, payout UI, status views
- Country modules: **Turkey** (wire), **Indonesia** (local bank)
- Payout retry and failure workflows
- Filters and reporting (date, payee, status)

## Verification checklist

After sandbox setup ([GETTING-STARTED.md](./GETTING-STARTED.md), [TESTING.md](./TESTING.md)):

- [ ] `npm run migrate` succeeds
- [ ] `GET /health` returns OK
- [ ] `POST /api/payees` returns recipient and payout method IDs
- [ ] Stripe Dashboard shows the recipient under Global Payouts
- [ ] (Optional) `POST /api/payouts` with funded financial account
- [ ] Webhook updates `payouts.status`
- [ ] Duplicate `event.id` is ignored
