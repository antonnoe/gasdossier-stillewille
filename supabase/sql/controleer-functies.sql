-- =====================================================================
--  supabase/sql/controleer-functies.sql
--
--  Welke functies en tabellen staan er werkelijk op de live database?
--  Bedoeld om te zien of de migraties uit supabase/migrations/ ook echt
--  zijn uitgevoerd. In de repository staan is niet hetzelfde als op het
--  project staan.
--
--  Wijzigt niets en drukt geen namen of e-mailadressen af.
-- =====================================================================

select 'functie' as soort,
       p.proname as naam,
       pg_get_function_identity_arguments(p.oid) as details
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
union all
select 'tabel', c.relname, ''
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1, 2;
