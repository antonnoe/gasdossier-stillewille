-- =====================================================================
--  RLS-policies voor de kerndossiers-authenticatie
--  Tabellen: public.gebruikers en public.aanvragen
--
--  Voer dit uit in de Supabase SQL Editor (of via `supabase db push`).
--  Veilig om opnieuw te draaien: policies worden eerst verwijderd.
-- =====================================================================

-- ---------------------------------------------------------------------
--  Verwachte tabelstructuur (ter referentie — pas aan op je schema)
-- ---------------------------------------------------------------------
-- create table if not exists public.gebruikers (
--   email      text primary key,
--   naam       text,
--   rol        text not null default 'gebruiker'
--                check (rol in ('gebruiker', 'beheerder', 'owner')),
--   created_at timestamptz not null default now()
-- );
--
-- create table if not exists public.aanvragen (
--   id         uuid primary key default gen_random_uuid(),
--   naam       text not null,
--   email      text not null,
--   reden      text,
--   status     text not null default 'pending'
--                check (status in ('pending', 'approved', 'rejected')),
--   created_at timestamptz not null default now()
-- );


-- ---------------------------------------------------------------------
--  Hulpfunctie: rol van de huidige ingelogde gebruiker
--
--  SECURITY DEFINER zodat de functie de gebruikers-tabel mag lezen
--  zónder zelf door RLS te gaan. Dat voorkomt oneindige recursie wanneer
--  een policy op "gebruikers" de rol van de aanroeper wil controleren.
-- ---------------------------------------------------------------------
create or replace function public.huidige_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol
  from public.gebruikers
  where email = (auth.jwt() ->> 'email')
  limit 1;
$$;

revoke all on function public.huidige_rol() from public;
grant execute on function public.huidige_rol() to anon, authenticated;


-- =====================================================================
--  Tabel: gebruikers
-- =====================================================================
alter table public.gebruikers enable row level security;

-- Basisrechten (RLS blijft de poortwachter).
grant select on public.gebruikers to authenticated;

drop policy if exists "gebruikers_select_eigen_of_beheer" on public.gebruikers;
drop policy if exists "gebruikers_beheer_update"          on public.gebruikers;
drop policy if exists "gebruikers_beheer_delete"          on public.gebruikers;

-- Lezen: je eigen rij, of álles als je beheerder/owner bent.
create policy "gebruikers_select_eigen_of_beheer"
  on public.gebruikers
  for select
  to authenticated
  using (
    email = (auth.jwt() ->> 'email')
    or public.huidige_rol() in ('beheerder', 'owner')
  );

-- Bewerken/verwijderen: alleen beheerders/owners.
-- (Toevoegen gebeurt via de Edge Function met de service-role sleutel,
--  die RLS omzeilt — daarom is er geen INSERT-policy voor gewone rollen.)
create policy "gebruikers_beheer_update"
  on public.gebruikers
  for update
  to authenticated
  using      (public.huidige_rol() in ('beheerder', 'owner'))
  with check (public.huidige_rol() in ('beheerder', 'owner'));

create policy "gebruikers_beheer_delete"
  on public.gebruikers
  for delete
  to authenticated
  using (public.huidige_rol() in ('beheerder', 'owner'));


-- =====================================================================
--  Tabel: aanvragen
-- =====================================================================
alter table public.aanvragen enable row level security;

-- Anonieme bezoekers mogen een aanvraag indienen (insert), beheerders
-- mogen ze lezen en bijwerken.
grant insert on public.aanvragen to anon, authenticated;
grant select, update, delete on public.aanvragen to authenticated;

drop policy if exists "aanvragen_insert_publiek"   on public.aanvragen;
drop policy if exists "aanvragen_select_beheer"    on public.aanvragen;
drop policy if exists "aanvragen_update_beheer"    on public.aanvragen;
drop policy if exists "aanvragen_delete_beheer"    on public.aanvragen;

-- Indienen: iedereen (ook niet-ingelogd), maar alleen met status 'pending'.
create policy "aanvragen_insert_publiek"
  on public.aanvragen
  for insert
  to anon, authenticated
  with check (status = 'pending');

-- Lezen: alleen beheerders/owners.
create policy "aanvragen_select_beheer"
  on public.aanvragen
  for select
  to authenticated
  using (public.huidige_rol() in ('beheerder', 'owner'));

-- Bijwerken (goedkeuren/afwijzen): alleen beheerders/owners.
create policy "aanvragen_update_beheer"
  on public.aanvragen
  for update
  to authenticated
  using      (public.huidige_rol() in ('beheerder', 'owner'))
  with check (public.huidige_rol() in ('beheerder', 'owner'));

-- Verwijderen: alleen beheerders/owners.
create policy "aanvragen_delete_beheer"
  on public.aanvragen
  for delete
  to authenticated
  using (public.huidige_rol() in ('beheerder', 'owner'));


-- =====================================================================
--  RPC: approve_aanvraag(p_email, p_naam)
--
--  Keurt een toegangsaanvraag goed. Wordt vanuit admin.html aangeroepen
--  via supabase.rpc('approve_aanvraag', { p_email, p_naam }).
--
--  SECURITY DEFINER: draait met de rechten van de eigenaar en omzeilt zo
--  RLS om in "gebruikers" te schrijven en de aanvraag bij te werken.
--  Daarom controleert de functie éérst zelf of de aanroeper beheerder of
--  owner is — anders een fout.
-- =====================================================================
create or replace function public.approve_aanvraag(
  p_email text,
  p_naam  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_naam  text := nullif(trim(p_naam), '');
begin
  -- Alleen beheerders/owners mogen goedkeuren.
  if public.huidige_rol() not in ('beheerder', 'owner') then
    raise exception 'Geen beheerdersrechten'
      using errcode = '42501';  -- insufficient_privilege
  end if;

  if v_email is null or v_email = '' then
    raise exception 'E-mailadres ontbreekt'
      using errcode = '22023';  -- invalid_parameter_value
  end if;

  -- Gebruiker toevoegen met rol "gebruiker". Bestaat de gebruiker al,
  -- dan alleen de naam aanvullen — een bestaande rol blijft ongemoeid.
  insert into public.gebruikers (email, naam, rol)
  values (v_email, v_naam, 'gebruiker')
  on conflict (email) do update
    set naam = coalesce(excluded.naam, public.gebruikers.naam);

  -- Bijbehorende openstaande aanvraag op "approved" zetten.
  update public.aanvragen
    set status = 'approved'
    where email = v_email
      and status = 'pending';

  return jsonb_build_object('ok', true, 'email', v_email, 'rol', 'gebruiker');
end;
$$;

revoke all on function public.approve_aanvraag(text, text) from public;
grant execute on function public.approve_aanvraag(text, text) to authenticated;
