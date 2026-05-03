-- Add 'in_negotiation' and 'archived' to product_status (ТЗ §5.2 requires
-- the four statuses: Черновик / Опубликовано / В переговорах / Архивировано).
-- 'moderation' and 'rejected' remain as internal admin transitions.
ALTER TYPE product_status ADD VALUE IF NOT EXISTS 'in_negotiation';
ALTER TYPE product_status ADD VALUE IF NOT EXISTS 'archived';
