-- PostgreSQL does not support DROP VALUE for enum types without recreating
-- the entire type, which is unsafe while rows may reference these values.
-- Rollback strategy: restore from a pre-migration snapshot, or manually
-- reassign any users with role IN ('investor', 'institutional') to another
-- role and recreate user_role without the extra values.
-- This file is intentionally a no-op so the migration tool succeeds.
SELECT 1;
