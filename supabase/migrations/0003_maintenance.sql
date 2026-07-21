-- Weekly legitimate maintenance task using pg_cron.
-- Performs real, idempotent work: recomputes usage aggregates, recalculates
-- report counters, refreshes weekly featured content, archives old resolved
-- reports, and records an auditable row in maintenance_runs.
-- It does NOT fabricate users, sessions, visits, or any fake activity.

create or replace function run_weekly_maintenance() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  run_id uuid;
  affected int := 0;
  n int;
begin
  insert into maintenance_runs (status) values ('running') returning id into run_id;

  -- 1. Recompute usage aggregates from game_content counters (idempotent upsert).
  insert into content_usage_aggregates (content_id, usage_count, skip_count, updated_at)
  select id, usage_count, skip_count, now() from game_content
  on conflict (content_id) do update
    set usage_count = excluded.usage_count,
        skip_count = excluded.skip_count,
        updated_at = now();
  get diagnostics n = row_count; affected := affected + n;

  -- 2. Recalculate report counters from actual reports (source of truth).
  update game_content gc
    set report_count = sub.c
  from (select content_id, count(*) c from content_reports group by content_id) sub
  where gc.id = sub.content_id and gc.report_count is distinct from sub.c;
  get diagnostics n = row_count; affected := affected + n;

  -- 3. Refresh weekly featured content: one approved item per game_type,
  --    chosen deterministically for the current ISO week (no randomness spam).
  update game_content set is_featured = false where is_featured = true;
  with ranked as (
    select id, game_type,
      row_number() over (
        partition by game_type
        order by md5(id::text || to_char(now(), 'IYYY-IW'))
      ) rn
    from game_content where status = 'approved'
  )
  update game_content gc set is_featured = true
  from ranked where gc.id = ranked.id and ranked.rn = 1;
  get diagnostics n = row_count; affected := affected + n;

  -- 4. Archive resolved reports older than 90 days.
  delete from content_reports where resolved = true and created_at < now() - interval '90 days';
  get diagnostics n = row_count; affected := affected + n;

  update maintenance_runs
    set finished_at = now(), status = 'completed', affected_records = affected
  where id = run_id;
  return run_id;
exception when others then
  update maintenance_runs
    set finished_at = now(), status = 'failed', error = sqlerrm
  where id = run_id;
  raise;
end;
$$;

-- Schedule once per week (Mondays 03:00 UTC). Requires the pg_cron extension,
-- enabled from Dashboard > Database > Extensions.
-- create extension if not exists pg_cron;
-- select cron.schedule('giallo-aria-weekly', '0 3 * * 1', $$ select run_weekly_maintenance(); $$);
