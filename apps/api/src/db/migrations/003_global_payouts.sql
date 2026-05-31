-- Global Payouts pivot: recipients + payout methods (replaces Connect stripe_account_id).

ALTER TABLE payees
  ADD COLUMN IF NOT EXISTS stripe_recipient_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_payout_method_id VARCHAR(255);

UPDATE payees
SET stripe_recipient_id = stripe_account_id
WHERE stripe_recipient_id IS NULL AND stripe_account_id IS NOT NULL;

ALTER TABLE payees DROP COLUMN IF EXISTS stripe_account_id;

CREATE UNIQUE INDEX IF NOT EXISTS payees_stripe_recipient_id_unique
  ON payees (stripe_recipient_id)
  WHERE stripe_recipient_id IS NOT NULL;

ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS stripe_outbound_payment_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_payouts_stripe_outbound_payment_id
  ON payouts (stripe_outbound_payment_id);

-- Legacy Connect columns kept nullable for existing rows; new payouts use stripe_outbound_payment_id.
ALTER TABLE payouts
  ALTER COLUMN stripe_payout_id DROP NOT NULL,
  ALTER COLUMN stripe_transfer_id DROP NOT NULL;
