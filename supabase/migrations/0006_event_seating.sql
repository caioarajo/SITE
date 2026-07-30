-- =============================================================
-- Mapa de mesas e cadeiras por evento
-- =============================================================
-- Mesas são específicas de um evento (não reaproveitáveis como as
-- guest_lists) — cada evento monta seu próprio salão. As cadeiras de
-- cada mesa são geradas pela aplicação a partir de "seat_count" e
-- identificadas por número + letra da mesa (ex.: "1A".."10A").
--
-- "Quem fica em pé" não é um dado armazenado: é derivado (convidados
-- do evento, via event_guest_lists, que não ocupam nenhuma cadeira).

create table public.event_tables (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null,                 -- "A", "B", "VIP"... identificador customizável
  seat_count int not null default 8 check (seat_count > 0 and seat_count <= 40),
  shape text not null default 'round' check (shape in ('round', 'rectangle')),
  pos_x numeric not null default 0,    -- posição no mapa visual (drag and drop)
  pos_y numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, label)
);

create table public.event_seats (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  event_table_id uuid not null references public.event_tables(id) on delete cascade,
  seat_number int not null,
  seat_code text not null,             -- "1A", "2A"...
  guest_id uuid references public.guests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_table_id, seat_number),
  -- Um convidado só pode ocupar 1 cadeira por evento. NULLs múltiplos
  -- (cadeiras vazias) são permitidos normalmente por uma unique constraint.
  unique (event_id, guest_id)
);

create index event_tables_event_id_idx on public.event_tables(event_id);
create index event_seats_event_id_idx on public.event_seats(event_id);
create index event_seats_event_table_id_idx on public.event_seats(event_table_id);
create index event_seats_guest_id_idx on public.event_seats(guest_id);

alter table public.event_tables enable row level security;
alter table public.event_seats enable row level security;

create policy "event_tables_staff_all" on public.event_tables
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

create policy "event_seats_staff_all" on public.event_seats
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));
