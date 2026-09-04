-- =====================================================================
--  supabase/schema.sql — tabelstructuur van het Supabase-project
--  pmnquozexgxhpbpuergj (schema `public`).
--
--  ⚠️ TODO — HERKOMST VAN DIT BESTAND, LEES DIT EERST
--  ---------------------------------------------------------------
--  Dit bestand is NIET met `supabase db dump` uit de live database
--  gehaald. Daar zijn database-credentials voor nodig en die staan
--  (terecht) niet in de repository. Het is gereconstrueerd uit de
--  bronnen die hier wél staan:
--
--    - supabase/sql/rls-policies.sql   (DDL, deels in commentaar)
--    - supabase/sql/bulk-authoriseer.sql
--    - de kolommen die admin.html, account.html, index.html,
--      chrome.js en de Edge Functions daadwerkelijk opvragen
--
--  Daardoor kunnen kleine afwijkingen bestaan ten opzichte van de
--  echte database: kolommen die ooit los in de SQL Editor zijn
--  toegevoegd, indexen, triggers en exacte default-waarden zijn hier
--  niet met zekerheid vast te stellen.
--
--  Vervang dit bestand zodra er één echte dump is:
--    1. Draai de workflow "Supabase backup" handmatig
--       (Actions -> Supabase backup -> Run workflow).
--    2. Download het artifact en pak `schema.sql` eruit.
--    3. Zet die inhoud hier neer, of lokaal:
--         supabase db dump --db-url "<connection string>" \
--           --schema public -f supabase/schema.sql
--
--  Het `auth`-schema staat hier bewust niet in: dat beheert Supabase
--  zelf. Het zit wél in de backup-workflow, omdat daar de accounts
--  in staan.
--
--  Dit bestand bevat alléén tabellen. Functies, RLS-policies en
--  grants staan in supabase/sql/rls-policies.sql; draai dat script
--  ná dit bestand. Ze zijn bewust niet gedupliceerd, zodat er maar
--  één bron van waarheid is.
--
--  Volgorde bij het opbouwen van een leeg project:
--    1. supabase/schema.sql        (dit bestand)
--    2. supabase/sql/rls-policies.sql
--    3. supabase/sql/bulk-authoriseer.sql   (optioneel, eigen adressen)
--
--  Veilig om opnieuw te draaien: alles staat als
--  `create table if not exists` / `add column if not exists`.
-- =====================================================================

-- gen_random_uuid() komt uit pgcrypto; op Supabase standaard aanwezig.
create extension if not exists pgcrypto;


-- ---------------------------------------------------------------------
--  gebruikers — wie mag inloggen, en met welke rol.
--
--  Toegang tot de site werkt via deze tabel: wie hier staat, kan
--  inloggen met de magic link op /login.html (zie BEHEERDERS.md §6).
-- ---------------------------------------------------------------------
create table if not exists public.gebruikers (
  email      text primary key,
  naam       text,
  rol        text not null default 'gebruiker'
               check (rol in ('gebruiker', 'beheerder', 'owner')),
  created_at timestamptz not null default now()
);

-- Herkomst van het account, overgenomen uit de aanvraag bij goedkeuring.
--   categorie:  'bewoner' | 'lsw' | 'swb' | 'dienstverlener'
--   huisnummer: 3 cijfers, alleen voor bewoners.
alter table public.gebruikers add column if not exists categorie   text;
alter table public.gebruikers add column if not exists huisnummer  text;

-- E-mailupdates via Laposta (opt-out: standaard aan).
alter table public.gebruikers add column if not exists nieuwsbrief boolean not null default true;
alter table public.gebruikers add column if not exists laposta_id  text;


-- ---------------------------------------------------------------------
--  aanvragen — toegangsverzoeken via /aanvragen.html.
-- ---------------------------------------------------------------------
create table if not exists public.aanvragen (
  id         uuid primary key default gen_random_uuid(),
  naam       text not null,
  email      text not null,
  reden      text,
  status     text not null default 'pending'
               check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Extra velden bij de aanmelding. telefoon/uitgenodigd_door/gewenste_duur
-- dienen om derden (dienstverleners) te controleren vóór toegang.
alter table public.aanvragen add column if not exists categorie        text;
alter table public.aanvragen add column if not exists huisnummer       text;
alter table public.aanvragen add column if not exists telefoon         text;
alter table public.aanvragen add column if not exists uitgenodigd_door text;
alter table public.aanvragen add column if not exists gewenste_duur    text;

alter table public.aanvragen drop constraint if exists aanvragen_huisnummer_chk;
alter table public.aanvragen add constraint aanvragen_huisnummer_chk
  check (huisnummer is null or (huisnummer ~ '^[0-9]{3}$' and huisnummer::int between 1 and 326));


-- ---------------------------------------------------------------------
--  app_instellingen — eenvoudige sleutel/waarde-instellingen.
--
--  Gebruikt voor o.a. de "toegangspauze" (sleutel 'toegang_vanaf'):
--  zolang current_date vóór die datum ligt, verleent de RPC
--  invite_gebruiker geen toegang.
-- ---------------------------------------------------------------------
create table if not exists public.app_instellingen (
  sleutel text primary key,
  waarde  text
);


-- ---------------------------------------------------------------------
--  reacties — reacties van bewoners op de dossierpagina's.
--  Geen moderatie vooraf; de pagina's zitten achter de login.
-- ---------------------------------------------------------------------
create table if not exists public.reacties (
  id         uuid primary key default gen_random_uuid(),
  naam       text,
  email      text,
  bericht    text not null,
  pagina     text not null,
  aangemaakt timestamptz not null default now()
);


-- ---------------------------------------------------------------------
--  correctieverzoeken — verzoeken om onjuiste informatie of
--  ontbrekende bronnen te corrigeren, met antwoord van de redactie.
-- ---------------------------------------------------------------------
create table if not exists public.correctieverzoeken (
  id            uuid primary key default gen_random_uuid(),
  dossier       text,
  bericht       text not null,
  naam          text,
  antwoord      text,          -- reactie van de redactie (beheerder/owner)
  beantwoord_op timestamptz,   -- wanneer het antwoord is gegeven
  aangemaakt    timestamptz not null default now()
);

alter table public.correctieverzoeken add column if not exists antwoord      text;
alter table public.correctieverzoeken add column if not exists beantwoord_op timestamptz;


-- ---------------------------------------------------------------------
--  peiling — draagvlakpeiling, twee stellingen op schaal 1–5.
--  Eén stem per gebruiker (unique op email).
-- ---------------------------------------------------------------------
create table if not exists public.peiling (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  stelling1  int  not null check (stelling1 between 1 and 5),
  stelling2  int  not null check (stelling2 between 1 and 5),
  aangemaakt timestamptz not null default now()
);


-- =====================================================================
--  Volgende stap: draai supabase/sql/rls-policies.sql voor de
--  RLS-policies, grants en de functies huidige_rol(),
--  invite_gebruiker(), set_nieuwsbrief() en peiling_resultaat().
--
--  Zonder dat script staat RLS uit en zijn de tabellen onbeschermd.
-- =====================================================================
