-- =============================================================
-- Categorias do portfolio deixam de ser uma lista fixa no codigo e no
-- check constraint, e passam a ser uma tabela de verdade — o admin cria,
-- edita (rotulo) e apaga albuns. O slug e a chave estavel usada em
-- portfolio_items.category e nos links "?album=<slug>" do site.
-- =============================================================

create table if not exists public.portfolio_categories (
  slug text primary key,
  label text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio_categories enable row level security;

create policy "portfolio_categories_public_read" on public.portfolio_categories
  for select to anon, authenticated
  using (true);

create policy "portfolio_categories_admin_write" on public.portfolio_categories
  for all to authenticated
  using (public.current_user_role() in ('admin', 'usuario_avancado'))
  with check (public.current_user_role() in ('admin', 'usuario_avancado'));

-- Semeia com as categorias que ja existiam no codigo, preservando os
-- mesmos slugs dos itens ja cadastrados. "eventos_gerais" fica de fora a
-- pedido do usuario (nenhum item publicado usava essa categoria).
insert into public.portfolio_categories (slug, label, display_order) values
  ('quinze_anos', '15 Anos', 0),
  ('casamentos', 'Casamentos', 1),
  ('empresarial', 'Empresarial', 2),
  ('infantil', 'Infantil', 3)
on conflict (slug) do nothing;

-- Troca o check constraint fixo por uma foreign key de verdade.
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.portfolio_items'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%category%'
  loop
    execute format('alter table public.portfolio_items drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.portfolio_items alter column category drop default;

alter table public.portfolio_items
  add constraint portfolio_items_category_fkey
  foreign key (category) references public.portfolio_categories(slug)
  on delete restrict on update cascade;
