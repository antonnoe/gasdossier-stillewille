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
--  Tabel: app_instellingen  (eenvoudige sleutel/waarde-instellingen)
--
--  Gebruikt voor o.a. de "toegangspauze": zolang current_date < waarde van
--  'toegang_vanaf' verleent invite_gebruiker geen toegang (testfase).
--  Pauze opheffen of datum wijzigen = één rij bijwerken; geen code aanpassen.
-- =====================================================================
create table if not exists public.app_instellingen (
  sleutel text primary key,
  waarde  text
);

alter table public.app_instellingen enable row level security;

grant select                 on public.app_instellingen to authenticated;
grant insert, update, delete on public.app_instellingen to authenticated;

drop policy if exists "instellingen_select_ingelogd" on public.app_instellingen;
drop policy if exists "instellingen_wijzig_beheer"   on public.app_instellingen;

-- Lezen: alle ingelogde gebruikers (zodat het beheerpaneel de pauze toont).
create policy "instellingen_select_ingelogd"
  on public.app_instellingen
  for select
  to authenticated
  using (true);

-- Wijzigen: alleen beheerders/owners.
create policy "instellingen_wijzig_beheer"
  on public.app_instellingen
  for all
  to authenticated
  using      (public.huidige_rol() in ('beheerder', 'owner'))
  with check (public.huidige_rol() in ('beheerder', 'owner'));

-- Standaard: toegang verlenen gepauzeerd tot deze datum (pas aan of verwijder
-- de rij om de pauze op te heffen).
insert into public.app_instellingen (sleutel, waarde)
values ('toegang_vanaf', '2026-07-13')
on conflict (sleutel) do nothing;


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
  v_vanaf text;
begin
  -- Alleen beheerders/owners mogen goedkeuren.
  if public.huidige_rol() not in ('beheerder', 'owner') then
    raise exception 'Geen beheerdersrechten'
      using errcode = '42501';  -- insufficient_privilege
  end if;

  -- Toegangspauze (testfase): zolang vandaag vóór 'toegang_vanaf' ligt, wordt
  -- er geen toegang verleend. Aanvragen blijven gewoon binnenkomen.
  select waarde into v_vanaf
  from public.app_instellingen
  where sleutel = 'toegang_vanaf';

  if v_vanaf is not null and v_vanaf <> '' and current_date < v_vanaf::date then
    raise exception 'Toegang verlenen is gepauzeerd tot % (testfase).', v_vanaf
      using errcode = 'P0001';
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
--  E-mailupdates: aan-/afmelden (kolom + RPC)
--
--  Gebruikers ontvangen standaard updates (opt-out). Zij kunnen zich op de
--  accountpagina aan-/afmelden. Dat gebeurt via een SECURITY DEFINER functie
--  die UITSLUITEND de nieuwsbrief-vlag van de eigen rij zet — zo kan niemand
--  via deze weg z'n eigen rol of andermans gegevens wijzigen.
-- =====================================================================
alter table public.gebruikers add column if not exists nieuwsbrief boolean not null default true;
alter table public.gebruikers add column if not exists laposta_id text;

create or replace function public.set_nieuwsbrief(p_aan boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.gebruikers
    set nieuwsbrief = coalesce(p_aan, true)
    where email = (auth.jwt() ->> 'email');
  return coalesce(p_aan, true);
end;
$$;

revoke all on function public.set_nieuwsbrief(boolean) from public;
grant execute on function public.set_nieuwsbrief(boolean) to authenticated;


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
--  te corrigeren. De hele site zit achter de login, dus indienen én lezen
--  is voorbehouden aan ingelogde (authenticated) gebruikers; verwijderen
--  alleen door beheerders/owners.
-- =====================================================================
create table if not exists public.correctieverzoeken (
  id           uuid primary key default gen_random_uuid(),
  dossier      text,
  bericht      text not null,
  naam         text,
  antwoord     text,           -- reactie van de redactie (beheerder/owner)
  beantwoord_op timestamptz,   -- wanneer het antwoord is gegeven
  aangemaakt   timestamptz not null default now()
);

-- Voor bestaande installaties: kolommen alsnog toevoegen.
alter table public.correctieverzoeken add column if not exists antwoord text;
alter table public.correctieverzoeken add column if not exists beantwoord_op timestamptz;

alter table public.correctieverzoeken enable row level security;

grant select, insert on public.correctieverzoeken to authenticated;
grant update, delete on public.correctieverzoeken to authenticated;

-- Eventuele eerder verleende anon-rechten intrekken (de tabel zit achter login).
revoke select, insert on public.correctieverzoeken from anon;

-- Oude (publieke) policies opruimen, plus de huidige namen.
drop policy if exists "correctie_select_publiek"  on public.correctieverzoeken;
drop policy if exists "correctie_insert_publiek"  on public.correctieverzoeken;
drop policy if exists "correctie_select_ingelogd" on public.correctieverzoeken;
drop policy if exists "correctie_insert_ingelogd" on public.correctieverzoeken;
drop policy if exists "correctie_update_beheer"   on public.correctieverzoeken;
drop policy if exists "correctie_delete_beheer"   on public.correctieverzoeken;

-- Lezen: alle ingelogde gebruikers.
create policy "correctie_select_ingelogd"
  on public.correctieverzoeken
  for select
  to authenticated
  using (true);

-- Indienen: alle ingelogde gebruikers.
create policy "correctie_insert_ingelogd"
  on public.correctieverzoeken
  for insert
  to authenticated
  with check (true);

-- Beantwoorden (update): alleen beheerders/owners.
create policy "correctie_update_beheer"
  on public.correctieverzoeken
  for update
  to authenticated
  using      (public.huidige_rol() in ('beheerder', 'owner'))
  with check (public.huidige_rol() in ('beheerder', 'owner'));

-- Verwijderen: alleen beheerders/owners.
create policy "correctie_delete_beheer"
  on public.correctieverzoeken
  for delete
  to authenticated
  using (public.huidige_rol() in ('beheerder', 'owner'));


-- =====================================================================
--  Tabel: peiling
--
--  Draagvlak-peiling onder bewoners (twee stellingen, schaal 1–5). Eén stem
--  per gebruiker: dat wordt afgedwongen met een UNIQUE op email plus een
--  insert-policy die alleen de eigen rij toestaat. Om de privacy te bewaken
--  mogen gewone gebruikers alléén hun eigen rij lezen; beheerders/owners
--  zien alles. De geaggregeerde uitslag (gemiddelden + aantal) loopt via de
--  SECURITY DEFINER functie peiling_resultaat(), zodat niemand andermans
--  e-mailadres of losse score hoeft te kunnen lezen.
-- =====================================================================
create table if not exists public.peiling (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  stelling1  int  not null check (stelling1 between 1 and 5),
  stelling2  int  not null check (stelling2 between 1 and 5),
  aangemaakt timestamptz not null default now()
);

alter table public.peiling enable row level security;

grant select, insert on public.peiling to authenticated;

drop policy if exists "peiling_select_eigen_of_beheer" on public.peiling;
drop policy if exists "peiling_insert_eigen"           on public.peiling;

-- Lezen: eigen rij, of beheerder/owner.
create policy "peiling_select_eigen_of_beheer"
  on public.peiling
  for select
  to authenticated
  using (email = (auth.jwt() ->> 'email') or public.huidige_rol() in ('beheerder', 'owner'));

-- Invullen: alleen de eigen rij, met geldige waarden (1–5). De UNIQUE op
-- email zorgt dat een tweede stem wordt geweigerd.
create policy "peiling_insert_eigen"
  on public.peiling
  for insert
  to authenticated
  with check (
    email = (auth.jwt() ->> 'email')
    and stelling1 between 1 and 5
    and stelling2 between 1 and 5
  );

-- Geaggregeerde uitslag voor de hoofdpagina en het beheerpaneel.
create or replace function public.peiling_resultaat()
returns table (gemiddelde1 numeric, gemiddelde2 numeric, aantal bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    round(avg(stelling1)::numeric, 1),
    round(avg(stelling2)::numeric, 1),
    count(*)
  from public.peiling;
$$;

revoke all on function public.peiling_resultaat() from public;
grant execute on function public.peiling_resultaat() to authenticated;
