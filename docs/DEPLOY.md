# Deploy (Vercel + Neon)

## 1. Neon database

1. Create a project at [neon.tech](https://neon.tech) or link **Vercel → Storage → Neon** on the Vercel project.
2. Connection strings:
   - **Pooled** → `DATABASE_URL` (API runtime)
   - **Direct** → `DATABASE_URL_UNPOOLED` (migrations, if shown separately)

## 2. Migrations

From a machine with repo access and env configured:

```bash
cp .env.example .env.local
# set DATABASE_URL (and DATABASE_URL_UNPOOLED if used)
npm install
npm run migrate
```

## 3. Vercel project

1. Import the GitHub repository in [vercel.com](https://vercel.com).
2. Framework preset: **Other** (`vercel.json` defines build).
3. **Environment variables** (Production and Preview):

| Variable | Notes |
| -------- | ----- |
| `STRIPE_SECRET_KEY` | Sandbox-scoped `sk_test_...` with Global Payouts enabled |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard webhook endpoint |
| `STRIPE_API_VERSION` | Optional; defaults in application code |
| `STRIPE_FINANCIAL_ACCOUNT_ID` | `fa_test_...` when using outbound payments |
| `DATABASE_URL` | Neon **pooled** URL |
| `ADMIN_API_KEY` | Strong secret for `X-Admin-Key` |
| `NODE_ENV` | `production` |

4. Deploy. Build runs `npm run build` (compiles `apps/api` to `dist`).

Example API URL pattern: `https://<project>.vercel.app`

## 4. Stripe webhooks (production URL)

In **Stripe Dashboard → Developers → Webhooks** (sandbox or test mode as appropriate):

- **Endpoint URL:** `https://<your-vercel-host>/webhooks/stripe`
- **Events (v2 outbound payments):**
  - `v2.money_management.outbound_payment.created`
  - `v2.money_management.outbound_payment.posted`
  - `v2.money_management.outbound_payment.failed`
  - `v2.money_management.outbound_payment.canceled`
  - `v2.money_management.outbound_payment.returned` (optional)

Copy the signing secret into Vercel as `STRIPE_WEBHOOK_SECRET` and redeploy if needed.

**Local development:** `stripe listen --forward-to localhost:3000/webhooks/stripe`

## 5. Verify deployment

- `GET /health` on the Vercel URL
- Postman `baseUrl` set to the Vercel host; `X-Admin-Key` header set
- Create payee per [TESTING.md](./TESTING.md)

## Operational notes

- Fund the sandbox **Financial Account** before outbound payments ([GLOBAL-PAYOUTS-SANDBOX.md](./GLOBAL-PAYOUTS-SANDBOX.md)).
- Neon and Vercel free tiers are suitable for test traffic; monitor limits for production load.
