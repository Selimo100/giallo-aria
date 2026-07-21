-- Row Level Security policies for Giallo-Aria.

alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table categories enable row level security;
alter table game_content enable row level security;
alter table content_reports enable row level security;
alter table content_favourites enable row level security;
alter table saved_player_groups enable row level security;
alter table saved_game_presets enable row level security;
alter table saved_game_history enable row level security;
alter table content_usage_aggregates enable row level security;
alter table audit_logs enable row level security;
alter table maintenance_runs enable row level security;

-- profiles: a user manages only their own; staff may read all
create policy profiles_self_rw on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_staff_read on profiles
  for select using (is_staff(auth.uid()));

-- user_roles: only admins may manage; a user may read their own roles
create policy roles_self_read on user_roles
  for select using (user_id = auth.uid() or has_role(auth.uid(), 'admin'));
create policy roles_admin_write on user_roles
  for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));

-- categories: public read; admins write
create policy categories_public_read on categories for select using (true);
create policy categories_admin_write on categories
  for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));

-- game_content read rules:
--  * approved official/community content is public
--  * a user sees their own private/pending content
--  * staff see everything
create policy content_read on game_content for select using (
  (status = 'approved' and source_type in ('official','community'))
  or created_by = auth.uid()
  or is_staff(auth.uid())
);
-- authors manage their own content
create policy content_owner_write on game_content
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());
-- staff moderate (update status) any content
create policy content_staff_moderate on game_content
  for update using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

-- reports: any authenticated user may create; staff may read/resolve
create policy reports_insert on content_reports
  for insert with check (auth.uid() is not null);
create policy reports_staff_read on content_reports
  for select using (is_staff(auth.uid()));
create policy reports_staff_update on content_reports
  for update using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

-- favourites / saved data: strictly per-user
create policy fav_self on content_favourites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy groups_self on saved_player_groups
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy presets_self on saved_game_presets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy history_self on saved_game_history
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- aggregates: public read, staff write
create policy aggregates_read on content_usage_aggregates for select using (true);
create policy aggregates_staff_write on content_usage_aggregates
  for all using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

-- audit logs & maintenance: admins only (writes happen via service role, which bypasses RLS)
create policy audit_admin_read on audit_logs for select using (has_role(auth.uid(), 'admin'));
create policy maintenance_admin_read on maintenance_runs for select using (has_role(auth.uid(), 'admin'));
