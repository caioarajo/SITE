-- =============================================================
-- Corrige bug real na policy 0011: "select id from
-- current_client_event_ids()" não tem coluna "id" (a função retorna
-- setof uuid sem nome de coluna), então o Postgres resolveu "id" para
-- agenda_items.id da própria linha — comparando event_id com o id da
-- própria linha, que nunca bate. A policy nunca liberava nada.
--
-- Fix: usar "= ANY(...)" com a função setof diretamente, sem subquery
-- ambígua.
-- =============================================================

drop policy "agenda_items_client_read" on public.agenda_items;
create policy "agenda_items_client_read" on public.agenda_items
  for select to authenticated
  using (
    public.current_user_role() = 'cliente'
    and visible_to_client = true
    and event_id = any (select * from public.current_client_event_ids())
  );
