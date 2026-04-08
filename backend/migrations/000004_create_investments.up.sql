CREATE TYPE investment_stage AS ENUM ('concept', 'feasibility', 'design', 'construction', 'operational');
CREATE TYPE investment_source AS ENUM ('kazakh_invest', 'private', 'ppp');

CREATE TABLE investment_projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(512) NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    sector          VARCHAR(100) NOT NULL,
    region_code     VARCHAR(20) NOT NULL,
    volume_usd      BIGINT NOT NULL DEFAULT 0,
    stage           investment_stage NOT NULL DEFAULT 'concept',
    source          investment_source NOT NULL DEFAULT 'private',
    initiator       VARCHAR(255) NOT NULL DEFAULT '',
    contact_email   VARCHAR(255) NOT NULL DEFAULT '',
    document_ids    UUID[] NOT NULL DEFAULT '{}',
    tags            TEXT[] NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investments_sector ON investment_projects(sector);
CREATE INDEX idx_investments_stage ON investment_projects(stage);
