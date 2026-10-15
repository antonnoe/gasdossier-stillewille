-- =====================================================================
--  supabase/sql/controleer-inlogfouten.sql
--
--  Wat ging er de afgelopen dagen mis bij het inloggen? Leest het logboek
--  public.inlog_fouten.
--
--  Wijzigt niets. De kolom email wordt bewust NIET getoond, en uit het
--  detailveld wordt elk e-mailadres weggepoetst: workflow-logs zijn
--  leesbaar voor iedereen met repository-toegang.
-- =====================================================================

select soort,
       count(*)      as aantal,
       min(tijd)     as eerste,
       max(tijd)     as laatste
from public.inlog_fouten
where tijd > now() - interval '14 days'
group by soort
order by max(tijd) desc;

select tijd,
       soort,
       left(regexp_replace(coalesce(detail, ''),
                           '[^@[:space:]]+@[^@[:space:]]+',
                           '<adres>', 'g'), 140) as detail,
       left(coalesce(user_agent, ''), 110)       as browser
from public.inlog_fouten
where tijd > now() - interval '14 days'
order by tijd desc
limit 40;
