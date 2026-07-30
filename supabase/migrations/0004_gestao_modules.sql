-- =============================================================
-- Módulos de gestão: CRM, Cadastros e Financeiro
-- =============================================================
-- 8 tabelas internas de negócio (sem leitura pública, diferente de
-- services/portfolio_items/testimonials/faqs). Só quem está autenticado
-- e é admin ou usuario_avancado lê/escreve — mesmo padrão já corrigido
-- em 0003 (policies nascem com "to authenticated" desde o início).
--
-- Exceção: "opportunities" (CRM) ganha uma policy extra de INSERT para
-- anon, restrita, para permitir capturar prospecção que nasce no site
-- (clique em "Fale no WhatsApp") sem exigir login.

-- -------------------------------------------------------------
-- CADASTROS
-- -------------------------------------------------------------

create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  document text,                -- CPF/CNPJ
  email text,
  phone text,
  address text,
  client_type text not null default 'pessoa_fisica'
    check (client_type in ('pessoa_fisica', 'pessoa_juridica')),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  event_type text not null default 'casamento'
    check (event_type in ('casamento', 'debutante', 'corporativo', 'aniversario', 'outro')),
  event_date date,
  location text,
  guest_count int,
  budget_total numeric(12, 2),
  status text not null default 'planejamento'
    check (status in ('planejamento', 'confirmado', 'em_andamento', 'concluido', 'cancelado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colaboradores: prestadores/equipe que trabalham nos eventos (não são
-- necessariamente usuários do painel — profiles/auth.users é outra coisa).
create table public.staff (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role_title text,              -- cargo/função (ex.: fotógrafo, cerimonialista)
  email text,
  phone text,
  document text,
  hire_date date,
  day_rate numeric(12, 2),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,                 -- buffet, decoração, som, fotografia...
  contact_name text,
  email text,
  phone text,
  document text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  description text,
  unit_price numeric(12, 2) not null default 0,
  cost_price numeric(12, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- CRM
-- -------------------------------------------------------------

create table public.opportunities (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  email text,
  phone text,
  event_type text,
  source text not null default 'manual'
    check (source in ('site_form', 'whatsapp', 'manual', 'indicacao', 'outro')),
  stage text not null default 'novo'
    check (stage in ('novo', 'qualificando', 'proposta', 'negociacao', 'ganho', 'perdido')),
  estimated_value numeric(12, 2),
  expected_close_date date,
  lost_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- FINANCEIRO
-- -------------------------------------------------------------
-- "Atrasado" não é armazenado: é derivado (status = 'pendente' e
-- due_date < hoje), evitando dado obsoleto sem job/trigger.

create table public.accounts_payable (
  id uuid primary key default uuid_generate_v4(),
  description text not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  category text,
  amount numeric(12, 2) not null,
  due_date date not null,
  paid_date date,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts_receivable (
  id uuid primary key default uuid_generate_v4(),
  description text not null,
  client_id uuid references public.clients(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  amount numeric(12, 2) not null,
  due_date date not null,
  received_date date,
  status text not null default 'pendente' check (status in ('pendente', 'recebido', 'cancelado')),
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- ÍNDICES
-- -------------------------------------------------------------

create index events_client_id_idx on public.events(client_id);
create index opportunities_lead_id_idx on public.opportunities(lead_id);
create index opportunities_client_id_idx on public.opportunities(client_id);
create index opportunities_stage_idx on public.opportunities(stage);
create index accounts_payable_supplier_id_idx on public.accounts_payable(supplier_id);
create index accounts_payable_staff_id_idx on public.accounts_payable(staff_id);
create index accounts_payable_event_id_idx on public.accounts_payable(event_id);
create index accounts_payable_due_date_idx on public.accounts_payable(due_date);
create index accounts_payable_status_idx on public.accounts_payable(status);
create index accounts_receivable_client_id_idx on public.accounts_receivable(client_id);
create index accounts_receivable_event_id_idx on public.accounts_receivable(event_id);
create index accounts_receivable_due_date_idx on public.accounts_receivable(due_date);
create index accounts_receivable_status_idx on public.accounts_receivable(status);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------------

alter table public.clients enable row level security;
alter table public.events enable row level security;
alter table public.staff enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.opportunities enable row level security;
alter table public.accounts_payable enable row level security;
alter table public.accounts_receivable enable row level security;

create policy "clients_staff_all" on public.clients
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

create policy "events_staff_all" on public.events
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

create policy "staff_staff_all" on public.staff
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

create policy "suppliers_staff_all" on public.suppliers
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

create policy "products_staff_all" on public.products
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

create policy "opportunities_staff_all" on public.opportunities
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

-- Captura de prospecção anônima: clique em "Fale no WhatsApp" no site
-- cria uma oportunidade mínima sem exigir login. Restrita a estágio
-- inicial e às origens que fazem sentido vindas do site público.
create policy "opportunities_public_insert" on public.opportunities
  for insert to anon
  with check (
    stage = 'novo'
    and source in ('site_form', 'whatsapp')
    and client_id is null
  );

create policy "payable_staff_all" on public.accounts_payable
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

create policy "receivable_staff_all" on public.accounts_receivable
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));
