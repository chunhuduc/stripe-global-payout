# Global Payouts sandbox setup

This API requires **Stripe Global Payouts** on a **Dashboard sandbox**, not only default test mode on the root account.

Reference: [Stripe: Test Global Payouts](https://docs.stripe.com/global-payouts/testing).

## Enable Global Payouts

| Step | Action |
| ---- | ------ |
| 1 | Dashboard account picker → **Create sandbox** or select an existing sandbox |
| 2 | Confirm the **sandbox banner** is visible |
| 3 | **Global Payouts** → **Get started** (inside that sandbox) |
| 4 | **Developers → API keys** → copy the **secret key while the sandbox is selected** |
| 5 | Set `STRIPE_SECRET_KEY` in `.env.local` (or Vercel env) |

Each new sandbox needs **Get started** again; payouts are not enabled by default on every sandbox.

If Global Payouts shows **not eligible** on the main test account, use a sandbox as above rather than the root test account alone.

## Fund the financial account (outbound payments)

Financial account IDs use prefix `fa_test_`.

**Dashboard:** Balances → Transfer → **Add money** when the sandbox shortcut is available.

**API (summary):**

1. `GET /v2/money_management/financial_accounts` → note `fa_test_...`
2. Create or list `financial_addresses` (`finaddr_test_...`)
3. `POST /v2/test_helpers/financial_addresses/{id}/credit` with USD ACH test data

Set `STRIPE_FINANCIAL_ACCOUNT_ID=fa_test_...` before calling `POST /api/payouts`.

## Sandbox test bank credentials

Use only in sandbox. Bank verification code: **`SM11AA`**.

### Jordan (wire)

| SWIFT / BIC | IBAN | Result |
| ----------- | ---- | ------ |
| `AAAAJOJOXXX` | `JO32ABCJ0010123456789012345678` | Payout succeeds |
| `AAAAJOJOXXX` | `JO94CBJO0010000000000131000302` | `no_account` |
| `AAAAJOJOXXX` | `JO67CBJO0010000000000131000303` | `account_closed` |

### Turkiye (wire)

| SWIFT / BIC | IBAN | Result |
| ----------- | ---- | ------ |
| `AAAATRISXXX` | `TR560020813300013300013300` | Payout succeeds |

### Indonesia (local bank)

| Routing | Account | Result |
| ------- | ------- | ------ |
| `000` | `000123456789` | Payout succeeds |

Failure scenarios: see [Stripe: Test Global Payouts](https://docs.stripe.com/global-payouts/testing).

## Webhooks in sandbox

Subscribe v2 outbound payment events on the sandbox webhook endpoint, or forward locally:

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

See [WEBHOOKS.md](./WEBHOOKS.md) and [TESTING.md](./TESTING.md).

## Quick checklist

```bash
npm run migrate
npm run dev
```

Postman: `postman/global-payouts-api.json` with Jordan success IBAN/SWIFT from the table above.
