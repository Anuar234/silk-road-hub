-- News / market analytics editorial content (ТЗ 5.8).
CREATE TYPE news_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE news (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          VARCHAR(255) NOT NULL UNIQUE,
    title         VARCHAR(512) NOT NULL,
    summary       TEXT NOT NULL DEFAULT '',
    body          TEXT NOT NULL DEFAULT '',
    cover_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    status        news_status NOT NULL DEFAULT 'draft',
    author_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    tags          TEXT[] NOT NULL DEFAULT '{}',
    published_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_published_at ON news(published_at DESC NULLS LAST);
CREATE INDEX idx_news_slug ON news(slug);
