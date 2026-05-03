-- Track which user submitted an investment project so we can enforce that
-- ТЗ §4.3 ("разместить инвестпроект — при наличии прав") — investor edits are
-- limited to their own records, while admins (and Kazakh Invest curators)
-- retain full access. Existing rows seeded by admins keep created_by NULL.
ALTER TABLE investment_projects
    ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_investment_projects_created_by ON investment_projects(created_by);
