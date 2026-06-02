# Testing the API

End-to-end verification uses your **Global Payouts-enabled** Stripe sandbox and this repo's Postman collection.

## Setup

1. Complete [GLOBAL-PAYOUTS-SANDBOX.md](./GLOBAL-PAYOUTS-SANDBOX.md).
2. Configure `.env.local` per [GETTING-STARTED.md](./GETTING-STARTED.md).
3. Run migrations and start the API:

```bash
npm install
npm run migrate
npm run dev
```

4. **Webhooks (local):** in a second terminal:

```bash
stripe login
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Copy the CLI `whsec_...` into `.env.local` as `STRIPE_WEBHOOK_SECRET`, then restart `npm run dev`.

5. In Stripe Dashboard (sandbox), subscribe the webhook endpoint to:

- `v2.money_management.outbound_payment.created`
- `v2.money_management.outbound_payment.posted`
- `v2.money_management.outbound_payment.failed`
- `v2.money_management.outbound_payment.canceled`

## Postman

Import `postman/global-payouts-api.json`. Variables:

| Variable | Example |
| -------- | ------- |
| `baseUrl` | `http://localhost:3000` or your Vercel URL |
| `adminKey` | value of `ADMIN_API_KEY` |

### 1. Create payee (Jordan wire)

**POST** `/api/payees`

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.test",
  "countryCode": "JO",
  "bank": {
    "iban": "JO32ABCJ0010123456789012345678",
    "swift": "AAAAJOJOXXX",
    "accountHolderName": "Jane Doe"
  }
}
```

**Expected:** `201` with `payee.id`, `stripeRecipientId`, `stripePayoutMethodId`. Confirm recipient in Dashboard under **Global Payouts > Recipients**.

Use sandbox test credentials from [GLOBAL-PAYOUTS-SANDBOX.md](./GLOBAL-PAYOUTS-SANDBOX.md).

Save `payee.id` as Postman variable `payeeId`.

### 2. Outbound payment (optional)

Requires `STRIPE_FINANCIAL_ACCOUNT_ID` and a funded financial account.

**POST** `/api/payouts`

```json
{
  "payeeId": "{{payeeId}}",
  "amount": 1000,
  "currency": "jod"
}
```

If the API returns `503` for missing financial account configuration, recipient onboarding (step 1) can still be validated without this step.

### 3. Payout status

**GET** `/api/payouts/{{payoutId}}` with `X-Admin-Key`.

After an outbound payment and webhook delivery, `status` should update (`pending`, `paid`, `failed`, or `canceled`).

### Webhooks

With `stripe listen` or a Dashboard webhook pointing at your deploy URL:

- API logs: `[webhook] v2.money_management.outbound_payment...`
- Postgres: rows in `stripe_webhook_events` and updated `payouts.status`

`stripe trigger` does **not** support v2 outbound payment events. Use a real outbound payment or Dashboard test delivery.

## curl example

```bash
export BASE=http://localhost:3000
export ADMIN_API_KEY=your-key

curl -s "$BASE/health"

curl -s -X POST "$BASE/api/payees" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_API_KEY" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.test",
    "countryCode": "JO",
    "bank": {
      "iban": "JO32ABCJ0010123456789012345678",
      "swift": "AAAAJOJOXXX"
    }
  }'
```

## Troubleshooting

| Symptom | Action |
| ------- | ------ |
| Global Payouts / v2 errors, "not eligible" | Enable GP inside a **Dashboard sandbox**, not only default test mode ([GLOBAL-PAYOUTS-SANDBOX.md](./GLOBAL-PAYOUTS-SANDBOX.md)) |
| Webhook signature invalid | Match `STRIPE_WEBHOOK_SECRET` to CLI or Dashboard endpoint; restart API after env change |
| Payout `503` | Set `STRIPE_FINANCIAL_ACCOUNT_ID` and fund the financial account |
| Country errors | Phase 1 implements **Jordan (`JO`)** wire; Turkey and Indonesia are planned extensions |

## Production URL

Same requests against your deployed base URL; set Vercel env vars and Dashboard webhook per [DEPLOY.md](./DEPLOY.md).
