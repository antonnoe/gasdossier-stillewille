-- =====================================================================
--  Migratie 20260916120000 — ontbrekende kolommen op public.aanvragen
--
--  Aanleiding
--  ----------
--  Het blok "Aanvragen" op /admin.html laadde niet en gaf:
--      column aanvragen.telefoon does not exist
--
--  admin.html vraagt op:
--      id, naam, email, status, categorie, huisnummer,
--      telefoon, uitgenodigd_door, gewenste_duur
--  aanvragen.html schrijft diezelfde velden weg bij het indienen.
--
--  De kolommen stonden wél in supabase/schema.sql en in
--  supabase/sql/rls-policies.sql, maar die scripts zijn nooit (volledig)
--  op de live database gedraaid. Er was tot nu toe geen migratiemap en
--  geen manier om SQL vanuit de repository uit te voeren; daarom liepen
--  code en database uiteen.
--
--  Deze migratie is puur additief:
--    - alleen `add column if not exists`, alle kolommen nullable
--    - geen default, geen update, geen enkele bestaande rij wordt geraakt
--    - veilig om opnieuw te draaien
--
--  De check op huisnummer wordt bewust als NOT VALID toegevoegd: hij geldt
--  vanaf nu voor nieuwe en gewijzigde rijen, maar bestaande rijen worden
--  niet gecontroleerd en dus ook niet geblokkeerd. Zo kan deze migratie
--  niet stuklopen op historische data. Wil je hem alsnog over de hele
--  tabel laten gelden, draai dan later los:
--      alter table public.aanvragen validate constraint aanvragen_huisnummer_chk;
--
--  RLS hoeft niet mee te veranderen: de policies op public.aanvragen
--  (zie supabase/sql/rls-policies.sql) werken op rijniveau en de grants
--  staan op tabelniveau, niet per kolom. Nieuwe kolommen vallen daar
--  automatisch onder — beheerders lezen ze, het publieke formulier mag
--  ze vullen.
-- =====================================================================

begin;

-- Herkomst van de aanvraag.
--   categorie:  'bewoner' | 'lsw' | 'swb' | 'dienstverlener'
--   huisnummer: 3 cijfers, alleen voor bewoners (NULL anders).
alter table public.aanvragen add column if not exists categorie        text;
alter table public.aanvragen add column if not exists huisnummer       text;

-- Controlevelden voor derden/dienstverleners: hiermee kan een beheerder
-- een aanvrager natrekken vóór er toegang wordt verleend.
alter table public.aanvragen add column if not exists telefoon         text;
alter table public.aanvragen add column if not exists uitgenodigd_door text;
alter table public.aanvragen add column if not exists gewenste_duur    text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.aanvragen'::regclass
      and conname  = 'aanvragen_huisnummer_chk'
  ) then
    alter table public.aanvragen
      add constraint aanvragen_huisnummer_chk
      check (huisnummer is null
             or (huisnummer ~ '^[0-9]{3}$' and huisnummer::int between 1 and 326))
      not valid;
  end if;
end
$$;

commit;
