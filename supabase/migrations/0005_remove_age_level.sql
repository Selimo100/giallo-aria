-- 0005_remove_age_level.sql
-- Removes the age-level system completely (fasce d'età / minimum_age).
--
-- Safe & non-destructive to unrelated content: it only drops the age column
-- and its dependent index, and recreates the content-filter index without the
-- age dimension. Guarded with IF EXISTS so it is idempotent and safe to run on
-- databases that never had the column.

-- The filter index references minimum_age, so drop it first.
drop index if exists idx_content_filter;

-- Drop the age column. No other object depends on it after the index is gone.
alter table if exists game_content drop column if exists minimum_age;

-- Recreate the content-filter index without the age dimension.
create index if not exists idx_content_filter
  on game_content (game_type, status, intensita, difficolta);

-- Also drop the personal-content mirror column, if a deployment added one.
alter table if exists personal_content drop column if exists minimum_age;
