# Webhooks

## Endpoint

- **URL**: `POST /webhooks/stripe`
- **Body**: Raw JSON (not parsed by global `express.json()`)
- **Header**: `Stripe-Signature` (required)

Configure the signing secret in `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard or `stripe listen`).

## Handled events

| Stripe event | Trial label | DB update |
| ------------ | ----------- | --------- |
| `transfer.created` | transfer paid (platform to connected account) | `payouts.transfer_status` = `paid` |
| `transfer.reversed` | transfer failed / reversed | `payouts.transfer_status` = `failed` |
| `payout.paid` | bank payout succeeded | `payouts.status` = `paid` |
| `payout.failed` | bank payout failed | `payouts.status` = `failed` + failure fields |

**Note:** Stripe does not emit `transfer.paid` or `transfer.failed`. Connect transfers succeed or fail synchronously on `transfers.create`; **`transfer.created`** is the webhook that confirms the transfer landed. We map it to `transfer_status = paid` in the docs above so it matches the trial wording.

Bank delivery status uses **`payout.paid`** / **`payout.failed`**.

## Deduplication

Stripe may retry the same event. Before handling:

1. Insert row into `stripe_webhook_events` with primary key `event_id` (= Stripe `event.id`).
2. On unique violation (`23505`), respond with `{ received: true, duplicate: true }` and skip handler side effects.
3. On success, run handler then respond `{ received: true }`.

Status changes are also written to server logs (`console.info`).

## Production (Vercel)

In Stripe Dashboard (test mode):

- URL: `https://aaron-stripe-payout-api.vercel.app/webhooks/stripe`
- Events: `transfer.created`, `transfer.reversed`, `payout.paid`, `payout.failed`
- Signing secret → `STRIPE_WEBHOOK_SECRET` on Vercel

## Local testing

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Use the webhook signing secret printed by the CLI in `.env.local` as `STRIPE_WEBHOOK_SECRET`.

Subscribe to the events listed above in the Dashboard or use:

```bash
stripe trigger transfer.created
stripe trigger payout.paid
```

Note: triggered events may not match rows in `payouts` unless ids align; use the full Postman flow for integration tests.

## Errors

- Missing or invalid signature: `400` with message prefix `Webhook Error:`
- Handler exceptions during construction/verification: `400`
