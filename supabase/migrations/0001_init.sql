-- =============================================================
-- LP Assessoria e Cerimonial — schema inicial
-- Rode este arquivo no SQL Editor do Supabase (ou via supabase CLI)
-- =============================================================

create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------
-- SERVICES (pacotes: Intermediário, Completo, Cerimonial do Dia)
-- -------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  tagline text,
  price_label text default 'Sob consulta',
  features text[] not null default '{}',
  is_featured boolean not null default false,
  is_published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- PORTFOLIO ITEMS (fotos e vídeos de trabalhos realizados)
-- -------------------------------------------------------------
create table if not exists public.portfolio_items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  caption text,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  storage_path text not null,
  url text not null,
  is_published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- TESTIMONIALS (depoimentos dos noivos)
-- -------------------------------------------------------------
create table if not exists public.testimonials (
  id uuid primary key default uuid_generate_v4(),
  couple_names text not null,
  quote text not null,
  photo_url_1 text,
  photo_url_2 text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- FAQ
-- -------------------------------------------------------------
create table if not exists public.faqs (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  answer text not null,
  is_published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- LEADS (envios do formulário de contato)
-- -------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  event_type text,
  event_date date,
  message text,
  status text not null default 'novo' check (status in ('novo', 'em_contato', 'fechado')),
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- SITE SETTINGS (telefone, e-mail, instagram — editável pelo admin)
-- -------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value text
);

insert into public.site_settings (key, value) values
  ('phone', '92 99266-2890'),
  ('whatsapp', '5592992662890'),
  ('email', 'liapontesa@gmail.com'),
  ('instagram', '@lpcerimonial_')
on conflict (key) do nothing;

-- =============================================================
-- ROW LEVEL SECURITY
-- Regra geral: qualquer pessoa (anon) pode LER conteúdo publicado.
-- Apenas usuários autenticados (a conta da Lia, criada no painel do
-- Supabase) podem criar, editar e apagar registros.
-- Leads: qualquer pessoa pode INSERIR (o formulário do site), mas só
-- o admin autenticado pode ler/atualizar/apagar.
-- =============================================================

alter table public.services enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.leads enable row level security;
alter table public.site_settings enable row level security;

-- SERVICES
create policy "services_public_read" on public.services
  for select using (is_published = true);
create policy "services_admin_all" on public.services
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- PORTFOLIO
create policy "portfolio_public_read" on public.portfolio_items
  for select using (is_published = true);
create policy "portfolio_admin_all" on public.portfolio_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- TESTIMONIALS
create policy "testimonials_public_read" on public.testimonials
  for select using (is_published = true);
create policy "testimonials_admin_all" on public.testimonials
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- FAQS
create policy "faqs_public_read" on public.faqs
  for select using (is_published = true);
create policy "faqs_admin_all" on public.faqs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- LEADS (o público só pode inserir; ler/editar é só do admin)
create policy "leads_public_insert" on public.leads
  for insert with check (true);
create policy "leads_admin_read" on public.leads
  for select using (auth.role() = 'authenticated');
create policy "leads_admin_update" on public.leads
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "leads_admin_delete" on public.leads
  for delete using (auth.role() = 'authenticated');

-- SITE SETTINGS
create policy "settings_public_read" on public.site_settings
  for select using (true);
create policy "settings_admin_write" on public.site_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- =============================================================
-- STORAGE (bucket para as fotos/vídeos do portfólio)
-- =============================================================
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

create policy "portfolio_bucket_public_read" on storage.objects
  for select using (bucket_id = 'portfolio');
create policy "portfolio_bucket_admin_write" on storage.objects
  for insert with check (bucket_id = 'portfolio' and auth.role() = 'authenticated');
create policy "portfolio_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'portfolio' and auth.role() = 'authenticated');
create policy "portfolio_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'portfolio' and auth.role() = 'authenticated');

-- =============================================================
-- SEED DATA — conteúdo inicial (o mesmo do site atual), para a
-- aplicação já nascer com o conteúdo real preenchido
-- =============================================================

insert into public.services (name, tagline, is_featured, display_order, features) values
(
  'Intermediário',
  'Planejamento e assessoria completos, com organização à distância e execução presencial no grande dia.',
  false, 1,
  array[
    'Reunião inicial de alinhamento com os noivos',
    'Indicação de fornecedores confiáveis',
    'Até 3 reuniões para as principais decisões',
    'Checklist personalizado para o cronograma',
    'Orientação sobre contratos e conferência com fornecedores',
    '1 visita técnica ao local do evento',
    'Montagem de cronograma detalhado do dia',
    'Coordenação completa no dia, com até 2 profissionais do início ao fim'
  ]
),
(
  'Pacote Completo',
  'Planejamento do início ao fim: da ideia à execução, acompanhando cada reunião com fornecedores.',
  true, 2,
  array[
    'Reunião inicial para entender perfil, estilo e expectativas',
    'Planejamento completo, do início da organização ao pós-evento',
    'Planilha de orçamento personalizada, com controle de gastos',
    'Pesquisa, indicação e acompanhamento em reuniões com fornecedores',
    'Condução completa do protocolo de cerimônias católicas',
    'Negociação e análise detalhada de todos os contratos',
    'Checklists mensais e visita técnica com fornecedores',
    'Cronograma completo do dia e ensaio do cortejo',
    'Equipe de apoio e acompanhamento integral no dia do casamento'
  ]
),
(
  'Cerimonial do Dia',
  'Vocês já organizaram tudo — eu cuido para que a execução no dia da festa saia perfeita.',
  false, 3,
  array[
    'Reunião prévia para entender o que já foi organizado',
    'Acompanhamento da montagem e desmontagem da festa',
    'Ensaio na semana do evento',
    'Recepção na igreja e no local da festa',
    'Orientação e acomodação dos convidados',
    'Gerenciamento dos ritos e entrega de lembranças',
    'Supervisão da qualidade dos serviços contratados',
    'Suporte completo até o final da festa'
  ]
)
on conflict do nothing;

insert into public.faqs (question, answer, display_order) values
('Com quanto tempo de antecedência devo contratar?', 'O ideal é entre 6 e 12 meses antes do evento, para aproveitarmos bem o tempo de planejamento e escolha de fornecedores. Mas também atendo casamentos com prazos mais curtos — cada caso é avaliado individualmente.', 1),
('Vocês atendem só casamentos?', 'Não! Além de casamentos, atendo festas de 15 anos, formaturas, eventos empresariais, infantis e eventos em geral.', 2),
('Qual a diferença entre os três pacotes?', 'O Cerimonial do Dia executa o planejamento que vocês já fizeram sozinhos; o Intermediário soma acompanhamento à distância nas principais decisões; e o Completo cuida de tudo, do primeiro fornecedor ao último brinde da festa.', 3),
('Atendem eventos fora de Manaus?', 'Sim, atendo eventos em toda a região e também posso viajar para o seu destino — é só conversarmos sobre os detalhes.', 4),
('Como funciona o pagamento?', 'O valor é dividido em parcelas ao longo do planejamento, combinadas na reunião inicial de acordo com a data do seu evento.', 5),
('Vocês indicam fornecedores?', 'Sim! Trabalho com uma rede de fornecedores de confiança e indico as melhores opções de acordo com o estilo e o orçamento de vocês.', 6)
on conflict do nothing;

insert into public.testimonials (couple_names, quote, is_featured, display_order, photo_url_1, photo_url_2) values
('Camila', 'Incansáveis, sempre atentos, sempre gentis atendendo a todos. Você foi a escolha mais certa que nós fizemos.', false, 1, null, null),
('Sabrina', 'Foi tudo lindo, recebemos muitos elogios do profissionalismo e organização de vocês. Foi incrível pra gente!', false, 2, null, null),
('Joyce', 'Você foi demais, só boas notícias — falando da organização, do cerimonial, foi incrível, deram um toque especial.', false, 3, null, null),
('Endria & Davidson', 'Foi amor à primeira vista! Desde a primeira conversa sabíamos que tinha que ser a Lia! Ela acreditou nos nossos sonhos como se fossem dela. Muito além de uma prestação de serviço, é uma história construída com lindas memórias em cada detalhe, inesquecível!', true, 4, '/images/testimonial-endria-1.jpg', '/images/testimonial-endria-2.jpg')
on conflict do nothing;

-- Itens de portfólio iniciais (fotos que já vêm junto com o projeto em
-- /public/images). A partir daqui, novos itens devem ser cadastrados em
-- /admin/portfolio, que faz upload de verdade para o Supabase Storage.
insert into public.portfolio_items (title, caption, media_type, storage_path, url, display_order) values
('Brinde entre padrinhos e madrinhas', 'Brinde entre padrinhos e madrinhas', 'image', 'seed/portfolio-02.jpg', '/images/portfolio-02.jpg', 1),
('Saída da cerimônia sob chuva de pétalas', 'Saída da cerimônia sob chuva de pétalas', 'image', 'seed/portfolio-01.jpg', '/images/portfolio-01.jpg', 2),
('O primeiro corte do bolo', 'O primeiro corte do bolo', 'image', 'seed/portfolio-05.jpg', '/images/portfolio-05.jpg', 3),
('Sob o arco de flores brancas', 'Sob o arco de flores brancas', 'image', 'seed/portfolio-03.jpg', '/images/portfolio-03.jpg', 4),
('Celebração sob luzes de festa', 'Celebração sob luzes de festa', 'image', 'seed/portfolio-07.jpg', '/images/portfolio-07.jpg', 5),
('Momento de emoção na igreja', 'Momento de emoção na igreja', 'image', 'seed/portfolio-04.jpg', '/images/portfolio-04.jpg', 6),
('Abraço sob o arco floral', 'Abraço sob o arco floral', 'image', 'seed/portfolio-06.jpg', '/images/portfolio-06.jpg', 7)
on conflict do nothing;

