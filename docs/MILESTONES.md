# Project phases

## Phase 1 (API, current)

**Goal**: Prove end-to-end payout to a Jordan payee via Stripe Connect in test mode.

**Delivered**:

- Express API on **Vercel** with **Neon** Postgres
- Create payee for Jordan (`JO`) with IBAN/SWIFT
- Admin endpoint to initiate transfer + payout
- Stripe webhook handler for `transfer.created`, `transfer.reversed`, `payout.paid`, `payout.failed`
- `transfer_status` + payout `status` in Postgres; console logging on webhook
- Trial Postman: `postman/trial-mini-flow.json`
- Payee body accepts trial `{ name, bank }` or full individual payload
- `GET /api/payouts/:id` for status after webhooks
- [docs/DEPLOY.md](DEPLOY.md) for Vercel + Neon

**Out of scope for phase 1**:

- Admin web UI (`apps/web` placeholder)
- Additional countries beyond Jordan
- Payee self-service onboarding

## Phase 2 (planned)

- Admin web app on Vercel (`apps/web`) with CORS to API
- Payee list, payout UI, status views, manual retry
- Countries: Jordan, Pakistan, Turkey, Indonesia via config

## Verification checklist (phase 1)

- [ ] Neon project created; `npm run migrate` succeeds
- [ ] Vercel deploy green; `GET /health` returns OK on production URL
- [ ] `npm run build` passes locally
- [ ] Create payee returns Stripe account id
- [ ] Initiate payout returns transfer and payout ids
- [ ] Stripe webhook endpoint points to `https://aaron-stripe-payout-api.vercel.app/webhooks/stripe`
- [ ] Webhook updates payout status; duplicate `event.id` handled
