-- LP Memórias: contas de quem contrata o serviço, separadas dos usuários do site.
--
-- O login continua no Supabase Auth, mas estas contas não têm linha em
-- public.profiles: por isso não entram em /admin nem aparecem em /admin/usuarios.
-- RLS ligado e sem policy, como nas outras tabelas memorias_*: todo acesso passa
-- pelas rotas do servidor, que conferem de quem é cada evento.

create table if not exists public.memorias_clients (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null default '',
  notes text not null default '',
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.memorias_clients enable row level security;

-- Excluir a conta não apaga as fotos: o evento continua com a equipe.
alter table public.memorias_events
  add column if not exists client_id uuid references public.memorias_clients (id) on delete set null;

create index if not exists memorias_events_client_idx on public.memorias_events (client_id);
