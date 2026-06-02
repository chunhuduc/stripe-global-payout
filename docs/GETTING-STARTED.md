# Getting started

This API implements **Stripe Global Payouts**: freelancers are **recipients** on your US platform account (not Connect connected accounts). Bank details are stored as **payout methods**; payments use **Outbound Payments** (v2 API).

## Prerequisites

1. **Stripe sandbox** with **Global Payouts** enabled (see [GLOBAL-PAYOUTS-SANDBOX.md](./GLOBAL-PAYOUTS-SANDBOX.md)).
2. **Neon** Postgres (or compatible Postgres) for `DATABASE_URL`.
3. **Node.js 20+** for local runs.

## Environment

Copy `.env.example` to `.env.local` at the repo root:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `STRIPE_SECRET_KEY` | Yes | Sandbox-scoped `sk_test_...` (copy while sandbox is selected in Dashboard) |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_...` from Dashboard webhook or `stripe listen` |
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `ADMIN_API_KEY` | Yes | Secret for `X-Admin-Key` on admin routes |
| `STRIPE_API_VERSION` | No | Defaults to preview version in code |
| `STRIPE_FINANCIAL_ACCOUNT_ID` | For payouts | `fa_test_...` from Global Payouts financial account |

## Local run

```bash
npm install
npm run migrate
npm run dev
```

API base: `http://localhost:3000`. Admin routes require header `X-Admin-Key: <ADMIN_API_KEY>`.

## First checks

| Step | Command |
| ---- | ------- |
| Health | `GET /health` |
| Create payee | `POST /api/payees` (see [TESTING.md](./TESTING.md)) |
| Webhooks | `stripe listen --forward-to localhost:3000/webhooks/stripe` |

Import Postman collection: `postman/global-payouts-api.json`.

## Terminology

If your product spec says **transfer** to the freelancer's bank, the Stripe integration is an **Outbound Payment**. Webhooks use `v2.money_management.outbound_payment.*`, not Connect `transfer.*`. Details: [WEBHOOKS.md](./WEBHOOKS.md).

## Deployed API

Optional hosted URL (configure your own env on Vercel): see [DEPLOY.md](./DEPLOY.md).
