-- PostgreSQL does not support DROP VALUE for enum types without recreating
-- the entire type, which is unsafe while rows may reference these values.
-- Rollback strategy: restore from a pre-migration snapshot, or manually
-- reassign any deals with status IN ('intent_fixed', 'contract_signed',
-- 'in_execution') and recreate deal_status without the extra values.
SELECT 1;
