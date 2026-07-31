-- =============================================================
-- Módulo de Agenda de Eventos
-- =============================================================

-- events.event_type só tinha 5 valores; o Portfólio já usa 6 segmentos
-- (formatura e infantil são categorias próprias lá). Alinha os dois para
-- que um template de agenda possa casar 1:1 com o tipo do evento.
alter table public.events drop constraint events_event_type_check;
alter table public.events add constraint events_event_type_check
  check (event_type in ('casamento', 'debutante', 'formatura', 'corporativo', 'infantil', 'aniversario', 'outro'));

-- Liga um profile de role "cliente" ao registro de cliente que ele
-- representa — base para a Linha do Tempo somente-leitura do cliente
-- (papel já existia reservado no sistema, sem uso real até aqui).
alter table public.profiles add column if not exists client_id uuid references public.clients(id) on delete set null;

-- -------------------------------------------------------------
-- TEMPLATES DE CRONOGRAMA REGRESSIVO
-- -------------------------------------------------------------
create table public.agenda_templates (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null check (event_type in ('casamento', 'debutante', 'formatura', 'corporativo', 'infantil', 'aniversario', 'outro')),
  name text not null,
  description text,
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agenda_template_items (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references public.agenda_templates(id) on delete cascade,
  title text not null,
  category text not null check (category in ('reuniao', 'visita_tecnica', 'degustacao', 'prazo_fornecedor', 'dia_evento', 'interno')),
  -- Deslocamento em dias a partir da data do evento (negativo = antes,
  -- 0 = dia do evento, positivo = depois). Datas são calculadas na hora
  -- de aplicar o template, nunca fixas.
  offset_days int not null,
  visible_to_client boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index agenda_template_items_template_id_idx on public.agenda_template_items(template_id);

-- -------------------------------------------------------------
-- COMPROMISSOS DA AGENDA
-- -------------------------------------------------------------
create table public.agenda_items (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  responsible_id uuid references public.staff(id) on delete set null,

  title text not null,
  description text,
  category text not null check (category in ('reuniao', 'visita_tecnica', 'degustacao', 'prazo_fornecedor', 'dia_evento', 'interno')),

  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,

  location text,
  location_type text not null default 'presencial' check (location_type in ('presencial', 'online')),
  meeting_link text,

  priority text not null default 'normal' check (priority in ('baixa', 'normal', 'alta', 'critica')),
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido')),
  -- "Atrasado" não é armazenado — é calculado (status != concluido e
  -- start_at no passado) para nunca ficar desatualizado.

  reminders jsonb not null default '[]'::jsonb,
  meeting_minutes text,
  visible_to_client boolean not null default false,

  template_id uuid references public.agenda_templates(id) on delete set null,
  template_item_id uuid references public.agenda_template_items(id) on delete set null,

  -- Convite de fornecedor: link de acesso único, sem login. Token só
  -- existe quando um fornecedor foi convidado para este item.
  supplier_invite_token uuid unique,
  supplier_confirmed_at timestamptz,

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agenda_items_event_id_idx on public.agenda_items(event_id);
create index agenda_items_responsible_id_idx on public.agenda_items(responsible_id);
create index agenda_items_start_at_idx on public.agenda_items(start_at);
create index agenda_items_status_idx on public.agenda_items(status);
create index agenda_items_supplier_invite_token_idx on public.agenda_items(supplier_invite_token) where supplier_invite_token is not null;

create table public.agenda_item_attachments (
  id uuid primary key default uuid_generate_v4(),
  agenda_item_id uuid not null references public.agenda_items(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index agenda_item_attachments_item_id_idx on public.agenda_item_attachments(agenda_item_id);

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
alter table public.agenda_templates enable row level security;
alter table public.agenda_template_items enable row level security;
alter table public.agenda_items enable row level security;
alter table public.agenda_item_attachments enable row level security;

-- Templates: leitura para toda a equipe (para aplicar em um evento),
-- escrita só para admin (mesmo padrão de site_settings).
create policy "agenda_templates_staff_read" on public.agenda_templates
  for select to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'));
create policy "agenda_templates_admin_write" on public.agenda_templates
  for insert to authenticated
  with check (public.current_user_role() = 'admin');
create policy "agenda_templates_admin_update" on public.agenda_templates
  for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
create policy "agenda_templates_admin_delete" on public.agenda_templates
  for delete to authenticated
  using (public.current_user_role() = 'admin');

create policy "agenda_template_items_staff_read" on public.agenda_template_items
  for select to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'));
create policy "agenda_template_items_admin_write" on public.agenda_template_items
  for insert to authenticated
  with check (public.current_user_role() = 'admin');
create policy "agenda_template_items_admin_update" on public.agenda_template_items
  for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
create policy "agenda_template_items_admin_delete" on public.agenda_template_items
  for delete to authenticated
  using (public.current_user_role() = 'admin');

-- Compromissos: equipe (admin/usuario_avancado) tem CRUD completo.
create policy "agenda_items_staff_all" on public.agenda_items
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

-- Cliente: só enxerga itens marcados como visíveis, do(s) evento(s) do
-- próprio cliente (via profiles.client_id) — leitura apenas.
create policy "agenda_items_client_read" on public.agenda_items
  for select to authenticated
  using (
    public.current_user_role() = 'cliente'
    and visible_to_client = true
    and event_id in (
      select e.id from public.events e
      join public.profiles p on p.client_id = e.client_id
      where p.id = auth.uid() and p.is_active = true
    )
  );

create policy "agenda_item_attachments_staff_all" on public.agenda_item_attachments
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));
