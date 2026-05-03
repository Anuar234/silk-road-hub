-- Add the three remaining ТЗ §5.3 lifecycle statuses. The existing nine values
-- model the RFQ pipeline (info gathering → review → negotiating); these three
-- cover the contract / execution phases the spec calls out:
--   Намерения зафиксированы → intent_fixed (LOI/MOU signed)
--   Контракт подписан       → contract_signed
--   В процессе исполнения   → in_execution
-- 'negotiating' and 'completed' already exist and map directly to ТЗ.
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'intent_fixed';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'contract_signed';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'in_execution';
