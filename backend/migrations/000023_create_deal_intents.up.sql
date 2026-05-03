-- ТЗ §5.3 — фиксация договорённостей (LOI, MOU). Treats them as first-class
-- entities, not just uploaded files: each intent records who signed and when,
-- so the deal can transition to phase «Намерения зафиксированы» (ТЗ §5.3
-- intent_fixed status added in migration 000019) once both sides have signed.

CREATE TYPE intent_kind AS ENUM ('loi', 'mou');
CREATE TYPE intent_status AS ENUM ('draft', 'signed', 'cancelled');

CREATE TABLE deal_intents (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- VARCHAR for the same hybrid mock/real-deal reason as deal_documents.deal_id
    -- (see migration 000015). Etap 2: tighten to FK once deals are DB-only.
    deal_id          VARCHAR(64) NOT NULL,
    kind             intent_kind NOT NULL,
    title            VARCHAR(512) NOT NULL,
    summary          TEXT NOT NULL DEFAULT '',
    file_id          UUID REFERENCES files(id) ON DELETE SET NULL,
    status           intent_status NOT NULL DEFAULT 'draft',
    signed_by_buyer  BOOLEAN NOT NULL DEFAULT FALSE,
    signed_by_seller BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at        TIMESTAMPTZ,
    cancelled_at     TIMESTAMPTZ,
    created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deal_intents_deal ON deal_intents(deal_id);
CREATE INDEX idx_deal_intents_status ON deal_intents(status);
