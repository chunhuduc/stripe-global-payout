# Project scope

## Phase 1 (delivered in this repo)

**Goal:** API foundation for Global Payouts: save freelancer bank details as Stripe recipients, initiate outbound payments, sync status via webhooks.

**Included:**

- Express API (TypeScript), deployable on Vercel
- Neon Postgres schema and migrations
- `POST /api/payees`: recipient + payout method (Jordan wire in Postman collection)
- `POST /api/payouts`, `GET /api/payouts/:id`: outbound payment flow
- `POST /webhooks/stripe`: signature verification, event deduplication, status updates
- Postman: `postman/trial-mini-flow.json`
- Documentation under `docs/`

**Out of scope for phase 1:**

- Admin web UI (`apps/web` placeholder only)
- Turkey and Indonesia recipient field modules (Jordan first)
- Freelancer self-service onboarding UI
- Production hardening (rate limits, audit logs, key rotation runbooks)

## Phase 2 (planned)

- Admin dashboard (`apps/web`) with payee list, payout actions, status views
- Recipient onboarding for **Turkey** and **Indonesia** (country config)
- Retry / failure handling workflows
- Reporting and filters (date, payee, status)

## Verification checklist

Use after deploy and sandbox setup ([GETTING-STARTED.md](./GETTING-STARTED.md), [TESTING.md](./TESTING.md)):

- [ ] `npm run migrate` succeeds against your database
- [ ] `GET /health` returns OK (local and/or Vercel)
- [ ] `POST /api/payees` returns recipient and payout method IDs
- [ ] Stripe Dashboard shows the new recipient
- [ ] (Optional) `POST /api/payouts` with funded financial account
- [ ] Webhook endpoint configured; payout `status` updates after outbound payment events
- [ ] Duplicate webhook `event.id` does not double-apply status changes
