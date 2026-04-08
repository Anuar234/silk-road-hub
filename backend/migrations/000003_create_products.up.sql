CREATE TYPE product_status AS ENUM ('draft', 'moderation', 'published', 'rejected');

CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(255) NOT NULL,
    name                VARCHAR(255) NOT NULL,
    category            VARCHAR(255) NOT NULL DEFAULT '',
    hs_code             VARCHAR(50) NOT NULL DEFAULT '',
    moq                 VARCHAR(100) NOT NULL DEFAULT '',
    incoterms           VARCHAR(20) NOT NULL DEFAULT 'EXW',
    price               VARCHAR(100) NOT NULL DEFAULT '',
    lead_time_days      INTEGER NOT NULL DEFAULT 0,
    packaging           VARCHAR(255) NOT NULL DEFAULT '',
    description         TEXT NOT NULL DEFAULT '',
    image_urls          TEXT[] NOT NULL DEFAULT '{}',
    seller_id           UUID NOT NULL REFERENCES users(id),
    country_code        VARCHAR(10) NOT NULL DEFAULT 'KZ',
    region_code         VARCHAR(20),
    sector_id           VARCHAR(100) NOT NULL,
    subcategory_id      VARCHAR(100) NOT NULL,
    tags                TEXT[] NOT NULL DEFAULT '{}',
    samples_available   BOOLEAN NOT NULL DEFAULT FALSE,
    private_label       BOOLEAN NOT NULL DEFAULT FALSE,
    status              product_status NOT NULL DEFAULT 'draft',
    moderation_comment  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_sector ON products(sector_id);
