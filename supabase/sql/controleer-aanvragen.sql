-- =====================================================================
--  supabase/sql/controleer-aanvragen.sql
--
--  Leesbare controle op public.aanvragen. Wijzigt niets: de enige
--  schrijfacties staan in transacties die met ROLLBACK eindigen, zodat er
--  geen testaanvraag in het beheerpaneel achterblijft.
--
--  Draai dit na een migratie, via de workflow "Supabase migratie" of in de
--  SQL Editor. De uitvoer bevat bewust geen namen of e-mailadressen:
--  workflow-logs zijn zichtbaar voor iedereen met repository-toegang.
-- =====================================================================

\echo ''
\echo '=== 1. Kolommen van public.aanvragen ==='
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'aanvragen'
order by ordinal_position;

\echo ''
\echo '=== 1b. Kolommen van public.gebruikers (ter vergelijking) ==='
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'gebruikers'
order by ordinal_position;

\echo ''
\echo '=== 2. Kolommen die admin.html/aanvragen.html gebruiken maar ontbreken ==='
select v.kolom as ontbrekende_kolom
from (values ('id'),('naam'),('email'),('reden'),('status'),('created_at'),
             ('categorie'),('huisnummer'),('telefoon'),
             ('uitgenodigd_door'),('gewenste_duur')) as v(kolom)
where not exists (
  select 1 from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'aanvragen'
    and c.column_name = v.kolom
);

\echo ''
\echo '=== 3. Tabel-grants op public.aanvragen ==='
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'aanvragen'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

\echo ''
\echo '=== 3b. Kolom-grants (moet leeg zijn: anders zijn nieuwe kolommen onzichtbaar) ==='
select a.attname as kolom, a.attacl::text as kolom_rechten
from pg_attribute a
where a.attrelid = 'public.aanvragen'::regclass
  and a.attnum > 0 and not a.attisdropped
  and a.attacl is not null;

\echo ''
\echo '=== 4. RLS-status en policies op public.aanvragen ==='
select relrowsecurity as rls_aan, relforcerowsecurity as rls_geforceerd
from pg_class where oid = 'public.aanvragen'::regclass;

select policyname, cmd, roles::text, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'aanvragen'
order by policyname;

\echo ''
\echo '=== 5. Bestaande aanvragen (zonder persoonsgegevens) ==='
select id, status, categorie, huisnummer, created_at,
       (telefoon is not null)         as heeft_telefoon,
       (uitgenodigd_door is not null) as heeft_uitnodiger,
       (gewenste_duur is not null)    as heeft_duur
from public.aanvragen
order by created_at desc;

select count(*) as totaal,
       count(*) filter (where status = 'pending')  as openstaand,
       count(*) filter (where status = 'approved') as goedgekeurd,
       count(*) filter (where status = 'rejected') as afgewezen
from public.aanvragen;

\echo ''
\echo '=== 5b. Bestaande rijen die de huisnummer-check zouden schenden (hoort leeg) ==='
select id, huisnummer
from public.aanvragen
where huisnummer is not null
  and not (huisnummer ~ '^[0-9]{3}$' and huisnummer::int between 1 and 326);

\echo ''
\echo '=== 6. Leestest als beheerder (exact de select van admin.html, via RLS) ==='
-- Altijd precies één rij, ook als er (nog) geen beheerder is: \gset zou
-- anders op een lege uitvoer stuklopen.
select coalesce(
         (select email from public.gebruikers
          where rol in ('beheerder', 'owner')
          order by (rol = 'owner') desc, email
          limit 1),
         'geen-beheerder-gevonden@example.invalid') as beheerder \gset

begin;
  select set_config('request.jwt.claims',
                    json_build_object('email', :'beheerder', 'role', 'authenticated')::text,
                    true) is not null as claims_gezet;
  set local role authenticated;

  -- Exact de kolomlijst uit admin.html. Alleen het aantal wordt getoond;
  -- de rijen zelf bevatten persoonsgegevens en horen niet in een log.
  select count(*) as leesbaar_voor_beheerder,
         count(*) filter (where status = 'pending') as openstaand_leesbaar
  from (
    select id, naam, email, status, categorie, huisnummer,
           telefoon, uitgenodigd_door, gewenste_duur
    from public.aanvragen
  ) t;
rollback;

\echo ''
\echo '=== 6b. Tegenproef: een gewone gebruiker mag NIETS zien (moet 0 zijn) ==='
begin;
  select set_config('request.jwt.claims',
                    '{"email":"niet-bestaand@example.invalid","role":"authenticated"}',
                    true) is not null as claims_gezet;
  set local role authenticated;
  select count(*) as leesbaar_voor_gewone_gebruiker from public.aanvragen;
rollback;

\echo ''
\echo '=== 7. Indientest via het formulier (als anon), daarna ROLLBACK ==='
begin;
  -- Geen JWT: precies de situatie van een niet-ingelogde bezoeker.
  select set_config('request.jwt.claims', null, true) as jwt_claims;
  set local role anon;

  -- 7a. Dienstverlener: mét telefoonnummer (alle derde-partij-velden gevuld).
  insert into public.aanvragen
    (naam, email, reden, categorie, huisnummer, telefoon, uitgenodigd_door, gewenste_duur, status)
  values
    ('CI migratietest', 'ci-migratietest@example.invalid', null, 'dienstverlener',
     null, '06-12345678', 'CI-controle', '2 weken', 'pending');

  -- 7b. Bewoner: zonder telefoonnummer (de velden gaan als NULL mee, net als
  --     in aanvragen.html).
  insert into public.aanvragen
    (naam, email, reden, categorie, huisnummer, telefoon, uitgenodigd_door, gewenste_duur, status)
  values
    ('CI migratietest', 'ci-migratietest@example.invalid', 'controle', 'bewoner',
     '042', null, null, null, 'pending');

  -- 7c. Tegenproef: het formulier mag geen aanvraag indienen die meteen
  --     goedgekeurd is. De insert-policy staat alleen status 'pending' toe.
  savepoint voor_tegenproef;
  do $$
  begin
    insert into public.aanvragen (naam, email, categorie, status)
    values ('CI migratietest', 'ci-migratietest@example.invalid', 'bewoner', 'approved');
    raise exception 'TEGENPROEF MISLUKT: anon kon status approved wegschrijven.';
  exception
    when insufficient_privilege then
      raise notice 'Tegenproef OK: insert met status approved wordt door RLS geweigerd.';
  end
  $$;
  rollback to savepoint voor_tegenproef;

  reset role;
  select count(*) as testrijen_binnen_transactie
  from public.aanvragen where email = 'ci-migratietest@example.invalid';
rollback;

\echo ''
\echo '=== 8. Na ROLLBACK: geen testrij achtergebleven (moet 0 zijn) ==='
select count(*) as testrijen_na_rollback
from public.aanvragen where email = 'ci-migratietest@example.invalid';

select count(*) as totaal_na_test,
       count(*) filter (where status = 'pending') as openstaand_na_test
from public.aanvragen;
