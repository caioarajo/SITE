-- =============================================================
-- Listas de convidados e convidados (Cadastros)
-- =============================================================
-- Uma lista de convidados pode ser reaproveitada em mais de um evento
-- (ex.: mesma lista base usada no civil e na festa) — por isso a relação
-- entre eventos e listas é N:N via "event_guest_lists", em vez de uma
-- coluna event_id direto em guest_lists.

create table public.guest_lists (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guests (
  id uuid primary key default uuid_generate_v4(),
  guest_list_id uuid not null references public.guest_lists(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  category text,                 -- ex.: família, amigos, trabalho
  companions int not null default 0,
  rsvp_status text not null default 'pendente'
    check (rsvp_status in ('pendente', 'confirmado', 'recusado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_guest_lists (
  event_id uuid not null references public.events(id) on delete cascade,
  guest_list_id uuid not null references public.guest_lists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, guest_list_id)
);

create index guests_guest_list_id_idx on public.guests(guest_list_id);
create index guests_rsvp_status_idx on public.guests(rsvp_status);
create index event_guest_lists_guest_list_id_idx on public.event_guest_lists(guest_list_id);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (mesmo padrão das demais tabelas de gestão:
-- só admin/usuario_avancado, sem leitura pública, policies já
-- nascem "to authenticated")
-- -------------------------------------------------------------

alter table public.guest_lists enable row level security;
alter table public.guests enable row level security;
alter table public.event_guest_lists enable row level security;

create policy "guest_lists_staff_all" on public.guest_lists
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

create policy "guests_staff_all" on public.guests
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

create policy "event_guest_lists_staff_all" on public.event_guest_lists
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));
