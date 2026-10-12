-- =============================================================
-- Ferramenta de foto do depoimento em destaque: ponto focal (mesma ideia
-- do portfolio) para o crop "cover" do card grande nao cortar a cabeca, e
-- remove photo_url_2, que ficou sem uso desde que o card passou a mostrar
-- uma unica foto.
-- =============================================================

alter table public.testimonials
  add column if not exists focal_x numeric(5,2),
  add column if not exists focal_y numeric(5,2);

comment on column public.testimonials.focal_x is
  'Ponto focal horizontal (0-100, % da largura da foto) para o crop "cover" do card em destaque. NULL = usa o padrao do front-end.';
comment on column public.testimonials.focal_y is
  'Ponto focal vertical (0-100, % da altura da foto) para o crop "cover" do card em destaque. NULL = usa o padrao do front-end.';

alter table public.testimonials drop column if exists photo_url_2;
