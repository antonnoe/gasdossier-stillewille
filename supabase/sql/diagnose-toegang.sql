-- =====================================================================
--  supabase/sql/diagnose-toegang.sql
--
--  Vergelijkt de twee lijsten waar toegang aan hangt:
--    auth.users        — de Supabase-accounts (hier hangt de magic link aan)
--    public.gebruikers — de autorisatielijst van de site
--
--  Wie alleen in `gebruikers` staat, krijgt op /login.html geen toegangslink
--  (shouldCreateUser: false + signups uit). Wie alleen in `auth.users` staat,
--  komt wél langs middleware.js en kan de dossierpagina's lezen.
--
--  Wijzigt niets. De uitvoer op stdout bevat bewust GEEN e-mailadressen:
--  workflow-logs zijn leesbaar voor iedereen met repository-toegang. De
--  adressen zelf gaan via \copy naar out/*.csv en worden door de workflow
--  "Toegang diagnose" als artifact opgeslagen (retentie 1 dag).
-- =====================================================================

\pset pager off

\echo ''
\echo '=== 1. Aantallen per groep (geen adressen) ==='
select
  (select count(*) from public.gebruikers)                       as gebruikers_totaal,
  (select count(*) from auth.users where email is not null)      as auth_totaal,
  (select count(*) from public.gebruikers g
     where exists (select 1 from auth.users u
                    where lower(u.email) = lower(g.email)))       as in_beide,
  (select count(*) from public.gebruikers g
     where not exists (select 1 from auth.users u
                        where lower(u.email) = lower(g.email)))   as alleen_in_gebruikers,
  (select count(*) from auth.users u
     where u.email is not null
       and not exists (select 1 from public.gebruikers g
                        where lower(g.email) = lower(u.email)))   as alleen_in_auth;

\echo ''
\echo '=== 2. Status van de aanvrager waarover het gaat (zonder adres) ==='
select
  (select count(*) from auth.users
     where lower(email) = 'wil@stillewille.nl')          as staat_in_auth,
  (select count(*) from public.gebruikers
     where lower(email) = 'wil@stillewille.nl')          as staat_in_gebruikers,
  (select max(last_sign_in_at) from auth.users
     where lower(email) = 'wil@stillewille.nl')          as last_sign_in,
  (select count(*) from public.aanvragen
     where lower(email) = 'wil@stillewille.nl'
       and status = 'pending')                           as openstaande_aanvragen,
  (select string_agg(distinct status, ',') from public.aanvragen
     where lower(email) = 'wil@stillewille.nl')          as aanvraagstatussen;

\echo ''
\echo '=== 3. Nooit ingelogd, wel een auth-account (aantal) ==='
select count(*) as auth_zonder_login
from auth.users
where email is not null and last_sign_in_at is null;

-- ---------------------------------------------------------------------
--  Detail met adressen -> bestanden, niet naar het log.
-- ---------------------------------------------------------------------
\copy (select lower(g.email) as email, g.naam, g.rol, g.categorie, g.huisnummer, u.created_at as auth_aangemaakt, u.email_confirmed_at, u.last_sign_in_at from public.gebruikers g join auth.users u on lower(u.email) = lower(g.email) order by 1) to 'out/1-in-beide.csv' with csv header

\copy (select lower(g.email) as email, g.naam, g.rol, g.categorie, g.huisnummer, g.created_at from public.gebruikers g where not exists (select 1 from auth.users u where lower(u.email) = lower(g.email)) order by 1) to 'out/2-alleen-in-gebruikers.csv' with csv header

\copy (select lower(u.email) as email, u.created_at, u.invited_at, u.email_confirmed_at, u.last_sign_in_at from auth.users u where u.email is not null and not exists (select 1 from public.gebruikers g where lower(g.email) = lower(u.email)) order by 1) to 'out/3-alleen-in-auth.csv' with csv header

\copy (select id, lower(email) as email, naam, status, categorie, huisnummer, created_at from public.aanvragen order by created_at desc) to 'out/4-aanvragen.csv' with csv header

\echo ''
\echo '=== Klaar. Adressen staan in out/*.csv (artifact), niet in dit log. ==='
