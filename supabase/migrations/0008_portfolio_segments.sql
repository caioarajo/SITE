-- =============================================================
-- Portfólio por segmento (álbuns): 15 anos, casamentos, formaturas,
-- empresarial, infantil, eventos em geral
-- =============================================================
-- "category" separa o portfólio em álbuns; "is_cover" marca a foto de
-- capa usada como miniatura de cada segmento na visão geral (só uma
-- por categoria — garantido pela aplicação, não por constraint, já que
-- teria que ser um índice único parcial por categoria).

alter table public.portfolio_items
  add column if not exists category text not null default 'eventos_gerais'
    check (category in ('quinze_anos', 'casamentos', 'formaturas', 'empresarial', 'infantil', 'eventos_gerais'));

alter table public.portfolio_items
  add column if not exists is_cover boolean not null default false;

create index if not exists portfolio_items_category_idx on public.portfolio_items(category);

-- Os itens seed atuais são todos de casamento.
update public.portfolio_items set category = 'casamentos' where category = 'eventos_gerais';
update public.portfolio_items set is_cover = true
  where id = (select id from public.portfolio_items where category = 'casamentos' order by display_order asc limit 1);
