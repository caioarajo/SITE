-- Poster (frame estático) para itens de vídeo do portfólio — gerado no
-- navegador durante o upload (captura de frame via canvas) e usado como
-- miniatura em vez de carregar o vídeo inteiro só para exibir uma prévia.
alter table public.portfolio_items add column if not exists poster_url text;
