-- Add investor and institutional roles (ТЗ 4.3, 4.4).
-- ALTER TYPE ADD VALUE is supported by PostgreSQL without rebuilding dependents.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'investor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'institutional';
