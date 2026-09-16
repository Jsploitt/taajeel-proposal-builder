-- 0002_rls.sql — row level security.
--
-- ONE ROLE. Every signed-in user is a Taajeel staff member and may read and
-- write everything. Anonymous visitors get nothing at all.
--
-- There is deliberately no role hierarchy, no owner column check and no
-- per-table exception. Taajeel is a single small team; inventing tiers here
-- would be guessing at a policy nobody has stated, and a wrong guess silently
-- hides rows. If tiers are ever needed they belong in a later migration
-- written against a real requirement.
--
-- Note: the `service_role` key bypasses RLS entirely. It is not mentioned in
-- any policy below and does not need to be.

begin;

alter table public.clients     enable row level security;
alter table public.services    enable row level security;
alter table public.scope_steps enable row level security;
alter table public.boilerplate enable row level security;
alter table public.rate_card   enable row level security;
alter table public.proposals   enable row level security;

-- Belt and braces: make the anon role's lack of access explicit rather than
-- relying only on "no policy exists for anon".
revoke all on public.clients     from anon;
revoke all on public.services    from anon;
revoke all on public.scope_steps from anon;
revoke all on public.boilerplate from anon;
revoke all on public.rate_card   from anon;
revoke all on public.proposals   from anon;

grant select, insert, update, delete on public.clients     to authenticated;
grant select, insert, update, delete on public.services    to authenticated;
grant select, insert, update, delete on public.scope_steps to authenticated;
grant select, insert, update, delete on public.boilerplate to authenticated;
grant select, insert, update, delete on public.rate_card   to authenticated;
grant select, insert, update, delete on public.proposals   to authenticated;

-- One FOR ALL policy per table. USING gates read/update/delete,
-- WITH CHECK gates insert/update.

drop policy if exists clients_authenticated_all on public.clients;
create policy clients_authenticated_all on public.clients
  for all to authenticated using (true) with check (true);

drop policy if exists services_authenticated_all on public.services;
create policy services_authenticated_all on public.services
  for all to authenticated using (true) with check (true);

drop policy if exists scope_steps_authenticated_all on public.scope_steps;
create policy scope_steps_authenticated_all on public.scope_steps
  for all to authenticated using (true) with check (true);

drop policy if exists boilerplate_authenticated_all on public.boilerplate;
create policy boilerplate_authenticated_all on public.boilerplate
  for all to authenticated using (true) with check (true);

drop policy if exists rate_card_authenticated_all on public.rate_card;
create policy rate_card_authenticated_all on public.rate_card
  for all to authenticated using (true) with check (true);

drop policy if exists proposals_authenticated_all on public.proposals;
create policy proposals_authenticated_all on public.proposals
  for all to authenticated using (true) with check (true);

commit;
