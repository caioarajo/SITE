-- LP Memórias: fotos dos convidados, moderação e telão ao vivo.
--
-- As três tabelas ficam com RLS ligado e SEM nenhuma policy: anon e usuários
-- autenticados não têm acesso direto. Todo acesso passa pelas rotas em
-- src/app/api/memorias e src/app/api/admin/memorias, que validam o token do
-- link (convidado/telão) ou o papel do usuário e usam a service role.

create table if not exists public.memorias_events (
  id uuid primary key default gen_random_uuid(),
  guest_token text not null unique,
  wall_token text not null unique,
  settings jsonb not null,
  blocked_devices text[] not null default '{}',
  show_now jsonb,
  event_date date,
  retention_until date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.memorias_posts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.memorias_events (id) on delete cascade,
  kind text not null check (kind in ('photo', 'video', 'message')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  pinned boolean not null default false,
  flagged boolean not null default false,
  guest_name text not null default '',
  caption text not null default '',
  width integer not null default 0,
  height integer not null default 0,
  hearts integer not null default 0,
  size_bytes bigint not null default 0,
  device_id text not null,
  client_id text,
  original_path text,
  display_path text,
  thumb_path text,
  mime text,
  created_at timestamptz not null default now()
);

create index if not exists memorias_posts_event_created_idx on public.memorias_posts (event_id, created_at);
create index if not exists memorias_posts_event_device_idx on public.memorias_posts (event_id, device_id, created_at);
-- O reenvio automático em rede ruim não pode duplicar a publicação.
create unique index if not exists memorias_posts_idempotency_idx
  on public.memorias_posts (event_id, device_id, client_id) where client_id is not null;

create table if not exists public.memorias_hearts (
  post_id uuid not null references public.memorias_posts (id) on delete cascade,
  device_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, device_id)
);

create index if not exists memorias_hearts_device_idx on public.memorias_hearts (device_id);

-- Mantém memorias_posts.hearts certo mesmo com várias curtidas ao mesmo tempo.
create or replace function public.memorias_sync_hearts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.post_id, old.post_id);
begin
  update public.memorias_posts
  set hearts = (select count(*) from public.memorias_hearts where post_id = target)
  where id = target;
  return null;
end;
$$;

drop trigger if exists memorias_hearts_sync on public.memorias_hearts;
create trigger memorias_hearts_sync
after insert or delete on public.memorias_hearts
for each row execute function public.memorias_sync_hearts();

revoke all on function public.memorias_sync_hearts() from public, anon, authenticated;

alter table public.memorias_events enable row level security;
alter table public.memorias_posts enable row level security;
alter table public.memorias_hearts enable row level security;

-- Bucket privado: a leitura sai só por URL assinada de curta duração. Limite de
-- 50 MB por arquivo; os tipos aceitos impedem hospedar HTML ou scripts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memorias',
  'memorias',
  false,
  52428800,
  array['image/*', 'video/*', 'application/octet-stream']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
