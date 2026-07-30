-- Adiciona CEP como campo próprio em clients (antes só existia "address"
-- como texto livre) — necessário para aplicar a máscara XX.XXX-XXX no
-- formulário de Clientes.

alter table public.clients add column if not exists zip_code text;
