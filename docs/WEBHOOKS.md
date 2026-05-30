# Webhooks

## Endpoint

- **URL**: `POST /webhooks/stripe`
- **Body**: Raw JSON (not parsed by global `express.json()`)
- **Header**: `Stripe-Signature` (required)

Configure the signing secret in `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard or `stripe listen`).

## Handled events

| Event | Action |
|-------|--------|
| `payout.paid` | Set payout `status` to `paid`, clear/update failure fields as applicable |
| `payout.failed` | Set `status` to `failed`, store `failure_code` and `failure_message` |

Other event types are acknowledged after dedupe insert but not processed.

## Deduplication

Stripe may retry the same event. Before handling:

1. Insert row into `stripe_webhook_events` with primary key `event_id` (= Stripe `event.id`).
2. On unique violation (`23505`), respond with `{ received: true, duplicate: true }` and skip handler side effects.
3. On success, run `handleStripeWebhook` then respond `{ received: true }`.

## Production (Vercel)

In Stripe Dashboard (test mode for M1):

- URL: `https://<your-project>.vercel.app/webhooks/stripe`
- Events: `payout.paid`, `payout.failed`
- Signing secret → `STRIPE_WEBHOOK_SECRET` on Vercel

## Local testing

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Use the webhook signing secret printed by the CLI in `.env` as `STRIPE_WEBHOOK_SECRET`.

Trigger test events (examples):

```bash
stripe trigger payout.paid
stripe trigger payout.failed
```

Note: triggered events may not match rows in `payouts` unless ids align; use real payout flow or manual DB seeding for integration tests.

## Errors

- Missing or invalid signature: `400` with message prefix `Webhook Error:`
- Handler exceptions during construction/verification: `400`
