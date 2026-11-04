-- LP Casar: sites de casamento criados pelos próprios noivos.
--
-- Mesmo modelo da LP Memórias: RLS ligado e sem policy, de propósito. Todo acesso
-- passa pelas rotas api/casar, que conferem o dono do site antes de usar a service role.
-- As contas dos noivos usam o Supabase Auth, mas não têm linha em public.profiles:
-- por isso não entram em /admin e não alcançam as tabelas da equipe.

create table if not exists public.casar_sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  search_text text not null default '',
  searchable boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists casar_sites_search_idx on public.casar_sites (searchable, search_text);

-- Convidados, confirmações, recados e presentes: listas simples, sempre lidas por site.
create table if not exists public.casar_records (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.casar_sites (id) on delete cascade,
  kind text not null check (kind in ('guests', 'rsvps', 'messages', 'gifts')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists casar_records_site_idx on public.casar_records (site_id, kind, created_at);

alter table public.casar_sites enable row level security;
alter table public.casar_records enable row level security;

-- Contador de acessos: soma no banco para não perder visitas simultâneas.
create or replace function public.casar_count_view(target uuid)
returns void language sql security definer set search_path = '' as $$
  update public.casar_sites set views = views + 1 where id = target;
$$;
revoke all on function public.casar_count_view(uuid) from public, anon, authenticated;
grant execute on function public.casar_count_view(uuid) to service_role;

-- Fotos do site: públicas para os convidados; só o servidor grava.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('casar', 'casar', true, 5242880, array['image/jpeg'])
on conflict (id) do nothing;
