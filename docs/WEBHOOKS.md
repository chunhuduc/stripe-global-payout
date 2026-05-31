# Webhooks

## Endpoint

| Item | Value |
| ---- | ----- |
| URL | `POST /webhooks/stripe` |
| Body | Raw JSON (not parsed by global `express.json()`) |
| Header | `Stripe-Signature` (required) |
| Secret env | `STRIPE_WEBHOOK_SECRET` |

Obtain the signing secret from the Stripe Dashboard webhook settings or from `stripe listen` during local development.

## "Transfer" vs Stripe event names

If your product spec says **transfer** to the freelancer's bank, Stripe implements that as an **Outbound Payment**. This API listens for `v2.money_management.outbound_payment.*`, not Connect `transfer.*` events.

Each payout row uses `stripe_outbound_payment_id` to match webhook `related_object.id`.

## Handled events (Global Payouts)

| Stripe event | `payouts.status` |
| ------------ | ---------------- |
| `v2.money_management.outbound_payment.posted` | `paid` |
| `v2.money_management.outbound_payment.failed` | `failed` |
| `v2.money_management.outbound_payment.canceled` | `canceled` |
| `v2.money_management.outbound_payment.returned` | `failed` |
| `v2.money_management.outbound_payment.created` | `pending` |
| `v2.money_management.outbound_payment.processing` | `pending` |

Thin v2 payloads use `related_object.id` as the outbound payment ID. Handler: `apps/api/src/services/webhookService.ts`.

## Deduplication

1. Insert into `stripe_webhook_events` with primary key `event_id` (= Stripe `event.id`).
2. On unique violation (`23505`), respond `{ received: true, duplicate: true }` and skip side effects.
3. Otherwise run the handler and respond `{ received: true }`.

## Dashboard configuration

Subscribe your endpoint to the v2 outbound payment events listed above.

**Deployed example path:** `https://<your-host>/webhooks/stripe`

Set `STRIPE_WEBHOOK_SECRET` in Vercel to match the endpoint signing secret.

## Local testing

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Place the printed `whsec_...` in `.env.local`, restart the API, then create an outbound payment so Stripe delivers real events.

The Stripe CLI `stripe trigger` command does not support v2 outbound payment event types.

## Errors

Invalid signature returns **400** with `Webhook Error: ...`. Stripe may retry according to its retry policy.
