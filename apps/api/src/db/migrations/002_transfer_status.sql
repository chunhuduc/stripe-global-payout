-- Legacy Connect: transfer step status separate from bank payout status.

ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS transfer_status VARCHAR(32) NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_payouts_stripe_transfer_id ON payouts(stripe_transfer_id);
