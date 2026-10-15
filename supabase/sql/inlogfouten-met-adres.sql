-- =====================================================================
--  supabase/sql/inlogfouten-met-adres.sql
--
--  LET OP: de uitvoer van dit script BEVAT E-MAILADRESSEN.
--
--  Gebruik het alleen als je moet weten wie er vastloopt, en verwijder
--  daarna het log van de workflow-run (Actions -> de run -> rechtsboven
--  het menu -> Delete logs). Voor de gewone controle is
--  controleer-inlogfouten.sql bedoeld; die toont alleen soorten en
--  aantallen.
--
--  Wijzigt niets.
-- =====================================================================

select tijd,
       soort,
       email,
       left(coalesce(detail, ''), 80) as detail
from public.inlog_fouten
where tijd > now() - interval '3 days'
  and email is not null
order by tijd desc
limit 40;
