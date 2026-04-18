-- Add LOI and MOU to deal_documents types (ТЗ 5.3 "фиксация договорённостей").
ALTER TYPE doc_type ADD VALUE IF NOT EXISTS 'loi';
ALTER TYPE doc_type ADD VALUE IF NOT EXISTS 'mou';

-- Relax deal_id FK so the pilot UI can attach chat/documents to both
-- database-backed deals and mock-seeded deals. In Этап 2 the FK will be
-- restored once `deals` becomes the sole source of truth across the UI.
ALTER TABLE deal_comments DROP CONSTRAINT IF EXISTS deal_comments_deal_id_fkey;
ALTER TABLE deal_comments ALTER COLUMN deal_id TYPE VARCHAR(64) USING deal_id::text;

ALTER TABLE deal_documents DROP CONSTRAINT IF EXISTS deal_documents_deal_id_fkey;
ALTER TABLE deal_documents ALTER COLUMN deal_id TYPE VARCHAR(64) USING deal_id::text;
