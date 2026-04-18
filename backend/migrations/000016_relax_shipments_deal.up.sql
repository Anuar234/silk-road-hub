-- Relax shipments.deal_id FK so the pilot UI can create shipments against both
-- database-backed deals and mock-seeded deals. In Этап 2 the FK will be restored
-- once `deals` becomes the sole source of truth across the UI.
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_deal_id_fkey;
ALTER TABLE shipments ALTER COLUMN deal_id TYPE VARCHAR(64) USING deal_id::text;
