CREATE TYPE deal_status AS ENUM (
    'new', 'under_review', 'waiting_buyer_info', 'waiting_seller_info',
    'documents_preparation', 'negotiating', 'approved', 'completed', 'cancelled'
);

CREATE TABLE deals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id            UUID NOT NULL REFERENCES users(id),
    seller_id           VARCHAR(255) NOT NULL,
    product_id          VARCHAR(255) NOT NULL,
    thread_id           VARCHAR(255),
    quantity            VARCHAR(255) NOT NULL,
    destination_country VARCHAR(255) NOT NULL,
    target_timeline     VARCHAR(255) NOT NULL,
    incoterms           VARCHAR(100) NOT NULL,
    buyer_comment       TEXT NOT NULL DEFAULT '',
    status              deal_status NOT NULL DEFAULT 'new',
    assigned_manager    VARCHAR(255),
    internal_notes      TEXT NOT NULL DEFAULT '',
    total_value         VARCHAR(100),
    readiness           JSONB NOT NULL DEFAULT '{
        "buyerInfoComplete": false, "sellerInfoComplete": false,
        "productInfoComplete": false, "logisticsInfoComplete": false,
        "docsUploaded": false, "docsApproved": false, "readyForPreparation": false
    }',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deals_buyer ON deals(buyer_id);
CREATE INDEX idx_deals_seller ON deals(seller_id);
CREATE INDEX idx_deals_status ON deals(status);

CREATE TYPE doc_type AS ENUM ('invoice', 'contract', 'certificate', 'shipping', 'other');
CREATE TYPE doc_status AS ENUM (
    'not_requested', 'requested', 'uploaded', 'under_review',
    'approved', 'rejected', 'missing_info'
);
CREATE TYPE actor_role AS ENUM ('system', 'buyer', 'seller', 'admin');

CREATE TABLE deal_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id             UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    name                VARCHAR(512) NOT NULL,
    type                doc_type NOT NULL,
    status              doc_status NOT NULL DEFAULT 'not_requested',
    requested_from      VARCHAR(20),
    requested_at        TIMESTAMPTZ,
    uploaded_at         TIMESTAMPTZ,
    reviewed_at         TIMESTAMPTZ,
    uploaded_by_role    actor_role,
    note                TEXT,
    review_comment      TEXT,
    source_file_name    VARCHAR(512),
    source_file_size    BIGINT,
    file_id             UUID REFERENCES files(id),
    download_url        VARCHAR(1024),
    file_url            VARCHAR(1024)
);

CREATE INDEX idx_deal_documents_deal ON deal_documents(deal_id);

CREATE TABLE deal_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id         UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    from_status     deal_status NOT NULL,
    to_status       deal_status NOT NULL,
    changed_by      VARCHAR(255) NOT NULL,
    changed_by_role actor_role NOT NULL,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comment         TEXT
);

CREATE INDEX idx_deal_status_history_deal ON deal_status_history(deal_id);

CREATE TYPE comment_type AS ENUM (
    'internal_note', 'buyer_request', 'seller_request', 'document_note', 'status_note'
);
CREATE TYPE comment_visibility AS ENUM ('internal', 'buyer', 'seller', 'all');

CREATE TABLE deal_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id         UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    type            comment_type NOT NULL,
    visibility      comment_visibility NOT NULL,
    author          VARCHAR(255) NOT NULL,
    author_role     actor_role NOT NULL,
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deal_comments_deal ON deal_comments(deal_id);
