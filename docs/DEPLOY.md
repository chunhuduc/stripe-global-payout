# Deploy (Vercel + Neon, free tier)

No Docker. Postgres runs on **Neon** (free tier). API runs on **Vercel** (Hobby/free).

## 1. Neon database

1. Create a project at [neon.tech](https://neon.tech) (free tier) or use **Vercel → Storage → Neon** on the same Vercel project.
2. Copy connection strings:
   - **Pooled** → `DATABASE_URL` (API runtime)
   - **Direct** → `DATABASE_URL_UNPOOLED` (migrations; optional if only one URL is shown)

## 2. Run migrations (once)

From your machine with env set:

```bash
cp .env.example .env.local
# fill DATABASE_URL and DATABASE_URL_UNPOOLED (migrate loads .env.local from repo root)
npm install
npm run migrate
```

## 3. Vercel project

1. Import the GitHub repo in [vercel.com](https://vercel.com).
2. Framework preset: **Other** (build uses `vercel.json`).
3. **Environment variables** (Production + Preview):

| Variable | Notes |
| -------- | ----- |
| `STRIPE_SECRET_KEY` | `sk_test_...` for M1 |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard webhook endpoint |
| `DATABASE_URL` | Neon **pooled** URL (auto if Neon linked) |
| `ADMIN_API_KEY` | Strong secret for `X-Admin-Key` |
| `NODE_ENV` | `production` |

4. Deploy. `buildCommand` runs `npm run build` (required so `apps/api/dist` exists). API base: `https://aaron-stripe-payout-api.vercel.app`

If deploy fails with "default export must be a function or server", confirm `api/index.ts` re-exports `apps/api/dist/app.js` (default Express app) and redeploy after `npm run build` succeeds locally.

## 4. Stripe webhooks (production URL)

In **Stripe Dashboard → Developers → Webhooks (test mode)**:

- Endpoint: `https://aaron-stripe-payout-api.vercel.app/webhooks/stripe`
- Events: `transfer.created`, `transfer.reversed`, `payout.paid`, `payout.failed`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET` in Vercel, redeploy if needed

Local dev: `stripe listen --forward-to localhost:3000/webhooks/stripe` (or forward to preview URL).

## 5. Postman / curl

Set `baseUrl` to your Vercel URL. Admin routes need `X-Admin-Key`.

## Free tier notes

- **Neon:** free tier has storage/compute limits; fine for M1 test traffic.
- **Vercel Hobby:** serverless execution limits apply; webhook + API routes share the `api/index.ts` Express app.
- Top up **Stripe test platform balance** before payouts (Dashboard, test mode).
