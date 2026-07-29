-- =============================================================
-- LP Assessoria e Cerimonial — gestão de usuários e RBAC
-- =============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'usuario_avancado' check (role in ('admin', 'usuario_avancado', 'cliente')),
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuário só pode ler o próprio perfil (usado no client/middleware para
-- saber seu papel). Nenhuma policy de escrita para anon/authenticated: toda
-- escrita acontece nas rotas de API do Next.js via client de service role,
-- que ignora RLS por definição — e cada rota confere ali mesmo se quem está
-- chamando é admin antes de fazer qualquer alteração.
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid());

-- Função usada nas policies das demais tabelas: devolve o papel do usuário
-- autenticado, mas só se a conta estiver ativa (senão, null — e nenhuma
-- policy vai bater com null, então o usuário desativado perde acesso mesmo
-- com um token ainda válido).
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles
  where id = auth.uid() and is_active = true
$$;

-- current_user_role() só precisa ser chamada durante a avaliação das
-- policies abaixo (sempre no contexto de um usuário "authenticated"); não
-- deve ficar exposta como RPC pública.
revoke execute on function public.current_user_role() from public;
revoke execute on function public.current_user_role() from anon;
grant execute on function public.current_user_role() to authenticated;

-- Dá o papel de admin ao usuário que já existe (criado manualmente antes
-- desta migration) — sem isso ele perde acesso assim que as policies abaixo
-- trocarem de "authenticated" para checar o papel.
insert into public.profiles (id, name, role, is_active)
select id, 'Administrador', 'admin', true
from auth.users
where email = 'admin@lpcerimonial.com.br'
on conflict (id) do nothing;

-- =============================================================
-- Reescreve as policies de escrita das tabelas operacionais: antes
-- qualquer usuário autenticado tinha acesso total; agora só admin e
-- usuario_avancado (site_settings continua só admin).
-- =============================================================

drop policy if exists "services_admin_all" on public.services;
create policy "services_admin_write" on public.services
  for all using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "portfolio_admin_all" on public.portfolio_items;
create policy "portfolio_admin_write" on public.portfolio_items
  for all using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_write" on public.testimonials
  for all using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "faqs_admin_all" on public.faqs;
create policy "faqs_admin_write" on public.faqs
  for all using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "leads_admin_read" on public.leads;
create policy "leads_admin_read" on public.leads
  for select using (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "leads_admin_update" on public.leads;
create policy "leads_admin_update" on public.leads
  for update using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "leads_admin_delete" on public.leads;
create policy "leads_admin_delete" on public.leads
  for delete using (public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Bucket do portfólio: mesma regra (admin + usuario_avancado podem escrever)
drop policy if exists "portfolio_bucket_admin_write" on storage.objects;
create policy "portfolio_bucket_admin_write" on storage.objects
  for insert with check (bucket_id = 'portfolio' and public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "portfolio_bucket_admin_update" on storage.objects;
create policy "portfolio_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'portfolio' and public.current_user_role() in ('admin', 'usuario_avancado'));

drop policy if exists "portfolio_bucket_admin_delete" on storage.objects;
create policy "portfolio_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'portfolio' and public.current_user_role() in ('admin', 'usuario_avancado'));
