-- =============================================================
-- Corrige leitura do cliente na agenda (mesma classe de bug da 0003)
-- =============================================================
-- A policy "agenda_items_client_read" fazia uma subquery direto em
-- "events" para achar os eventos do cliente logado. Mas RLS é recursiva:
-- essa subquery roda com os mesmos privilégios do usuário "cliente", e a
-- policy de "events" só libera SELECT para admin/usuario_avancado — logo
-- a subquery sempre voltava vazia, e nenhum item aparecia pro cliente,
-- mesmo com visible_to_client = true e o vínculo certo.
--
-- Fix: função security definer (mesmo padrão de current_user_role()) que
-- resolve a lista de eventos do cliente ignorando a RLS de "events"
-- internamente, e só then aplica a checagem de role/visibilidade na policy.

create or replace function public.current_client_event_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.id from public.events e
  join public.profiles p on p.client_id = e.client_id
  where p.id = auth.uid() and p.is_active = true
$$;

revoke execute on function public.current_client_event_ids() from public;
revoke execute on function public.current_client_event_ids() from anon;
grant execute on function public.current_client_event_ids() to authenticated;

drop policy "agenda_items_client_read" on public.agenda_items;
create policy "agenda_items_client_read" on public.agenda_items
  for select to authenticated
  using (
    public.current_user_role() = 'cliente'
    and visible_to_client = true
    and event_id in (select id from public.current_client_event_ids())
  );
