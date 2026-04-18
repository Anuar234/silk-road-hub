-- Rollback not supported without recreating the column + FK.
-- To roll back, reassign any shipments whose deal_id is not a valid UUID
-- referencing deals(id), then ALTER COLUMN TYPE UUID and restore the FK.
SELECT 1;
