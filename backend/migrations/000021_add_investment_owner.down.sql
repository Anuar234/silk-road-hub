DROP INDEX IF EXISTS idx_investment_projects_created_by;
ALTER TABLE investment_projects DROP COLUMN IF EXISTS created_by;
