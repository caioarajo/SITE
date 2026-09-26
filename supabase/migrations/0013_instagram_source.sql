-- =============================================================
-- Fase 2 do plano de integração com Instagram: permite que
-- oportunidades do CRM sejam marcadas com origem "instagram" (além
-- de site_form, whatsapp, manual, indicacao, outro já existentes).
--
-- Usa um DO block para localizar e remover o check constraint atual
-- de "source" dinamicamente, em vez de assumir o nome
-- auto-gerado pelo Postgres — mais robusto a variações de nome.
-- =============================================================

do $$
declare
  r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%source%'
  loop
    execute format('alter table public.opportunities drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.opportunities
  add constraint opportunities_source_check
  check (source in ('site_form', 'whatsapp', 'manual', 'indicacao', 'outro', 'instagram'));

drop policy "opportunities_public_insert" on public.opportunities;
create policy "opportunities_public_insert" on public.opportunities
  for insert to anon
  with check (stage = 'novo' and source in ('site_form', 'whatsapp', 'instagram') and client_id is null);
