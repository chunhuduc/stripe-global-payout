# Code map

Where to look when extending or debugging this project.

## Repository layout

```
api/index.ts              # Vercel entry (imports compiled Express app)
apps/api/src/             # Application source
apps/web/                 # Phase 2 admin UI (placeholder)
docs/                     # Setup and operations guides
postman/                  # API test collection
```

## Stripe integration (two clients)

| File | API | Used for |
| ---- | --- | -------- |
| `stripe/client.ts` | Stripe Node SDK (v1) | Webhook signature verification only |
| `stripe/v2Client.ts` | `fetch` + preview `Stripe-Version` | Global Payouts (recipients, outbound payments) |
| `stripe/recipients.ts` | v2 | Create recipient + wire payout method |
| `stripe/outboundPayments.ts` | v2 | Pay freelancer from Financial Account |

Global Payouts is not available on the classic Connect transfer/payout APIs.

## Database tables

| Table | Role |
| ----- | ---- |
| `payees` | Local id + `stripe_recipient_id` + `stripe_payout_method_id` |
| `payouts` | Amount, currency, `status`, `stripe_outbound_payment_id` |
| `stripe_webhook_events` | Dedupe by Stripe `event.id` |

Older columns (`stripe_transfer_id`, `stripe_payout_id`, `transfer_status`) come from an earlier schema and are unused by the Global Payouts code path.

## Adding a country (phase 2)

1. Add `apps/api/src/config/countries/<country>.ts` implementing `CountryConfig`.
2. Register it in `apps/api/src/config/countries/index.ts`.
3. Extend `stripe/recipients.ts` if the country uses local bank fields instead of wire IBAN/SWIFT.

## Webhook events

Handler: `apps/api/src/services/webhookService.ts`

Subscribe to `v2.money_management.outbound_payment.*` in the Stripe Dashboard. See [WEBHOOKS.md](./WEBHOOKS.md).
