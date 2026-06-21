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
--  RPC: invite_gebruiker(p_email)
--
--  Keurt een toegangsaanvraag goed. Wordt vanuit admin.html aangeroepen
--  via supabase.rpc('invite_gebruiker', { p_email }). De daadwerkelijke
--  invite-mail wordt daarná verstuurd door de Edge Function
--  "invite-gebruiker" (die de service-role sleutel nodig heeft).
--
--  SECURITY DEFINER: draait met de rechten van de eigenaar en omzeilt zo
--  RLS om in "gebruikers" te schrijven en de aanvraag bij te werken.
--  Daarom controleert de functie éérst zelf of de aanroeper beheerder of
--  owner is — anders een fout.
--
--  De naam wordt uit de bijbehorende aanvraag gehaald, zodat de aanroeper
--  alleen het e-mailadres hoeft mee te geven.
-- =====================================================================

-- Oude functie opruimen (vervangen door invite_gebruiker).
drop function if exists public.approve_aanvraag(text, text);

create or replace function public.invite_gebruiker(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_naam  text;
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

  -- Naam uit de meest recente aanvraag van dit e-mailadres halen.
  select naam into v_naam
  from public.aanvragen
  where lower(email) = v_email
  order by created_at desc
  limit 1;

  -- Gebruiker toevoegen met rol "gebruiker". Bestaat de gebruiker al,
  -- dan alleen de naam aanvullen — een bestaande rol blijft ongemoeid.
  insert into public.gebruikers (email, naam, rol)
  values (v_email, nullif(trim(v_naam), ''), 'gebruiker')
  on conflict (email) do update
    set naam = coalesce(excluded.naam, public.gebruikers.naam);

  -- Bijbehorende openstaande aanvraag op "approved" zetten.
  update public.aanvragen
    set status = 'approved'
    where lower(email) = v_email
      and status = 'pending';

  return jsonb_build_object('ok', true, 'email', v_email, 'rol', 'gebruiker');
end;
$$;

revoke all on function public.invite_gebruiker(text) from public;
grant execute on function public.invite_gebruiker(text) to authenticated;


-- =====================================================================
--  Tabel: reacties
--
--  Reacties op de dossierpagina's. Geen moderatie — direct zichtbaar.
--  De dossierpagina's zitten achter de login (Edge Middleware), dus alleen
--  ingelogde (authenticated) gebruikers kunnen lezen en plaatsen.
-- =====================================================================
create table if not exists public.reacties (
  id         uuid primary key default gen_random_uuid(),
  naam       text,
  email      text,
  bericht    text not null,
  pagina     text not null,
  aangemaakt timestamptz not null default now()
);

alter table public.reacties enable row level security;

grant select, insert on public.reacties to authenticated;
grant delete           on public.reacties to authenticated;

drop policy if exists "reacties_select_ingelogd" on public.reacties;
drop policy if exists "reacties_insert_ingelogd" on public.reacties;
drop policy if exists "reacties_delete_beheer"   on public.reacties;

-- Lezen: alle ingelogde gebruikers.
create policy "reacties_select_ingelogd"
  on public.reacties
  for select
  to authenticated
  using (true);

-- Plaatsen: alle ingelogde gebruikers.
create policy "reacties_insert_ingelogd"
  on public.reacties
  for insert
  to authenticated
  with check (true);

-- Verwijderen: alleen beheerders/owners.
create policy "reacties_delete_beheer"
  on public.reacties
  for delete
  to authenticated
  using (public.huidige_rol() in ('beheerder', 'owner'));


-- =====================================================================
--  Tabel: correctieverzoeken
--
--  Verzoeken van bezoekers om onjuiste informatie of ontbrekende bronnen
--  te corrigeren. Geen login vereist — indienen én lezen mag publiek
--  (anon), verwijderen alleen door beheerders/owners.
-- =====================================================================
create table if not exists public.correctieverzoeken (
  id         uuid primary key default gen_random_uuid(),
  dossier    text,
  bericht    text not null,
  naam       text,
  aangemaakt timestamptz not null default now()
);

alter table public.correctieverzoeken enable row level security;

grant select, insert on public.correctieverzoeken to anon, authenticated;
grant delete           on public.correctieverzoeken to authenticated;

drop policy if exists "correctie_select_publiek" on public.correctieverzoeken;
drop policy if exists "correctie_insert_publiek" on public.correctieverzoeken;
drop policy if exists "correctie_delete_beheer"  on public.correctieverzoeken;

-- Lezen: iedereen (ook niet-ingelogd).
create policy "correctie_select_publiek"
  on public.correctieverzoeken
  for select
  to anon, authenticated
  using (true);

-- Indienen: iedereen (ook niet-ingelogd).
create policy "correctie_insert_publiek"
  on public.correctieverzoeken
  for insert
  to anon, authenticated
  with check (true);

-- Verwijderen: alleen beheerders/owners.
create policy "correctie_delete_beheer"
  on public.correctieverzoeken
  for delete
  to authenticated
  using (public.huidige_rol() in ('beheerder', 'owner'));
