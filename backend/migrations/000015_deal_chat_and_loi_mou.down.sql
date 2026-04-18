-- Reverting ADD VALUE on enum types requires recreating the type which is
-- unsafe while rows may reference 'loi'/'mou'. Rollback strategy: restore
-- from a pre-migration snapshot after reassigning affected rows.
SELECT 1;
