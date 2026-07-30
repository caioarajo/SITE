-- =============================================================
-- Corrige leitura pública quebrada pelas policies de admin
-- =============================================================
--
-- As policies "..._admin_write" (migration 0002) foram criadas com
-- "for all", que por padrão vale para TODOS os roles, incluindo anon.
-- Como o Postgres avalia (com OR) todas as policies permissivas de uma
-- tabela para decidir uma SELECT, a policy de admin também é avaliada
-- para visitantes anônimos — e como current_user_role() teve EXECUTE
-- revogado de anon, essa avaliação falha com "permission denied for
-- function current_user_role" em vez de simplesmente retornar false,
-- derrubando também a policy pública "..._public_read" que deveria
-- ter liberado a leitura.
--
-- Fix: restringir as policies de admin ao role authenticated, para
-- que anon nunca precise avaliar current_user_role().

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write" on public.services
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "portfolio_admin_write" on public.portfolio_items;
create policy "portfolio_admin_write" on public.portfolio_items
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "testimonials_admin_write" on public.testimonials;
create policy "testimonials_admin_write" on public.testimonials
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "faqs_admin_write" on public.faqs;
create policy "faqs_admin_write" on public.faqs
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "leads_admin_read" on public.leads;
create policy "leads_admin_read" on public.leads
  for select to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "leads_admin_update" on public.leads;
create policy "leads_admin_update" on public.leads
  for update to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "leads_admin_delete" on public.leads;
create policy "leads_admin_delete" on public.leads
  for delete to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings
  for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "portfolio_bucket_admin_write" on storage.objects;
create policy "portfolio_bucket_admin_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio' and public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "portfolio_bucket_admin_update" on storage.objects;
create policy "portfolio_bucket_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio' and public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "portfolio_bucket_admin_delete" on storage.objects;
create policy "portfolio_bucket_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio' and public.current_user_role() in ('admin', 'usuario_avancado'));
