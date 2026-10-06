-- =============================================================
-- Ponto focal por foto do portfolio: permite marcar manualmente onde
-- esta o rosto/assunto principal de uma foto, para o corte "cover" das
-- miniaturas (mosaico do album e capa do segmento) nao cortar cabecas.
-- NULL = usa a estimativa padrao no front-end (centro, levemente acima).
-- =============================================================

alter table public.portfolio_items
  add column if not exists focal_x numeric(5,2),
  add column if not exists focal_y numeric(5,2);

comment on column public.portfolio_items.focal_x is
  'Ponto focal horizontal (0-100, % da largura da foto) para o crop "cover" das miniaturas. NULL = usa o padrao do front-end.';
comment on column public.portfolio_items.focal_y is
  'Ponto focal vertical (0-100, % da altura da foto) para o crop "cover" das miniaturas. NULL = usa o padrao do front-end.';
