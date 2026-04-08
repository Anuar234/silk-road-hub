CREATE TYPE contract_status AS ENUM ('draft', 'negotiation', 'signed', 'active', 'completed', 'terminated');
CREATE TYPE contract_template_type AS ENUM ('export', 'investment', 'framework');
CREATE TYPE applicable_law AS ENUM ('KZ', 'EN', 'UNCITRAL', 'ICC');

CREATE TABLE contracts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id             UUID NOT NULL REFERENCES deals(id),
    template_type       contract_template_type NOT NULL,
    applicable_law      applicable_law NOT NULL,
    status              contract_status NOT NULL DEFAULT 'draft',
    signed_doc_file_id  UUID REFERENCES files(id),
    deadlines           JSONB NOT NULL DEFAULT '[]',
    notes               TEXT NOT NULL DEFAULT '',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_deal ON contracts(deal_id);
