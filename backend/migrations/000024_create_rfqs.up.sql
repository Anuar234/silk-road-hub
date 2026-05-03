-- Request for Quote (RFQ): when a buyer can't find a matching product in the
-- catalog, they post their need here. An admin reviews the request and links
-- ("matches") suitable sellers; matching auto-creates a messaging thread so
-- the parties can negotiate. Once a deal is signed, status flips to fulfilled.

CREATE TYPE rfq_status AS ENUM (
    'open',       -- newly posted, awaiting admin review
    'in_review',  -- admin acknowledged, looking for sellers
    'matched',    -- at least one seller has been suggested
    'fulfilled',  -- a deal was signed off the back of this RFQ
    'closed'      -- withdrawn by buyer or closed without a deal
);

CREATE TABLE rfqs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(512) NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    -- Loose references to the catalog taxonomy. We keep them as plain strings
    -- to mirror the products table — strict FKs would force RFQs to wait until
    -- categories/sectors are fully migrated to DB.
    sector_id       VARCHAR(100) NOT NULL DEFAULT '',
    subcategory_id  VARCHAR(100) NOT NULL DEFAULT '',
    target_country  VARCHAR(64) NOT NULL DEFAULT '',
    quantity        VARCHAR(255) NOT NULL DEFAULT '',
    budget_usd      BIGINT,
    target_date     DATE,
    incoterms       VARCHAR(64) NOT NULL DEFAULT '',
    notes           TEXT NOT NULL DEFAULT '',
    status          rfq_status NOT NULL DEFAULT 'open',
    admin_notes     TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rfqs_buyer ON rfqs(buyer_id, created_at DESC);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_sector ON rfqs(sector_id);

-- Admin-curated link from RFQ to a candidate seller. UNIQUE prevents the same
-- seller from being matched twice to a single RFQ.
CREATE TABLE rfq_matches (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    seller_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note        TEXT NOT NULL DEFAULT '',
    -- Optional pointer to the messaging thread that was opened in tandem.
    thread_id   UUID,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (rfq_id, seller_id)
);

CREATE INDEX idx_rfq_matches_rfq ON rfq_matches(rfq_id);
CREATE INDEX idx_rfq_matches_seller ON rfq_matches(seller_id);
