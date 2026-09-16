-- 0003_storage.sql — Storage buckets and their policies.
--
--   client-logos : client logo uploads. clients.logo_path points at an object here.
--                  Authenticated staff read and write.
--   templates    : the master taajeel_template.pptx (~11.5 MB after the lossless
--                  strip, template/FORENSICS.md §6). The browser fetches it at
--                  render time. Authenticated staff READ ONLY; writes are
--                  service-role only, because a bad template silently corrupts
--                  every deck produced afterwards.
--
-- Both buckets are PRIVATE. The browser must read them through the Supabase
-- client (which sends the user's JWT) or through a signed URL — a bare
-- fetch() of a /storage/v1/object/public/... URL will 400. See README.

begin;

insert into storage.buckets (id, name, public)
values ('client-logos', 'client-logos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('templates', 'templates', false)
on conflict (id) do nothing;

-- ------------------------------------------------- client-logos: read + write

drop policy if exists client_logos_read on storage.objects;
create policy client_logos_read on storage.objects
  for select to authenticated
  using (bucket_id = 'client-logos');

drop policy if exists client_logos_insert on storage.objects;
create policy client_logos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'client-logos');

drop policy if exists client_logos_update on storage.objects;
create policy client_logos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'client-logos')
  with check (bucket_id = 'client-logos');

drop policy if exists client_logos_delete on storage.objects;
create policy client_logos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'client-logos');

-- ------------------------------------------------- templates: read only
--
-- No insert/update/delete policy is created for `authenticated`, and that is
-- the whole mechanism: with RLS on storage.objects, an operation with no
-- matching policy is denied. service_role bypasses RLS and can therefore
-- upload a new master template.

drop policy if exists templates_read on storage.objects;
create policy templates_read on storage.objects
  for select to authenticated
  using (bucket_id = 'templates');

commit;
