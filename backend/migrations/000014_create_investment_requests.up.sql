-- Investor requests against an investment project (ТЗ 4.3, 5.11).
-- project_id is VARCHAR (not UUID FK) to accommodate seeded catalog entries
-- that originate outside the canonical investment_projects table during pilot.
CREATE TABLE investment_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  VARCHAR(64) NOT NULL,
    investor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_usd  BIGINT NOT NULL DEFAULT 0,
    message     TEXT NOT NULL DEFAULT '',
    status      VARCHAR(32) NOT NULL DEFAULT 'new',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investment_requests_project ON investment_requests(project_id);
CREATE INDEX idx_investment_requests_investor ON investment_requests(investor_id);
CREATE INDEX idx_investment_requests_status ON investment_requests(status);
