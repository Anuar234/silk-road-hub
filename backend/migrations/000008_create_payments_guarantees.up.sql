CREATE TYPE payment_stage_status AS ENUM ('pending', 'invoiced', 'paid', 'confirmed');
CREATE TYPE guarantee_type AS ENUM ('export_credit', 'insurance', 'letter_of_credit', 'bank_guarantee');

CREATE TABLE payment_plans (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id     UUID NOT NULL UNIQUE REFERENCES deals(id),
    total_usd   NUMERIC(15, 2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_stages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id     UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
    label       VARCHAR(255) NOT NULL,
    percentage  NUMERIC(5, 2) NOT NULL,
    amount_usd  NUMERIC(15, 2),
    status      payment_stage_status NOT NULL DEFAULT 'pending',
    due_date    DATE,
    paid_at     TIMESTAMPTZ,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_payment_stages_plan ON payment_stages(plan_id);

CREATE TABLE deal_guarantees (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id     UUID NOT NULL REFERENCES deals(id),
    type        guarantee_type NOT NULL,
    provider    VARCHAR(255) NOT NULL DEFAULT '',
    enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    notes       TEXT NOT NULL DEFAULT '',
    UNIQUE(deal_id, type)
);

CREATE INDEX idx_deal_guarantees_deal ON deal_guarantees(deal_id);
