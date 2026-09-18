-- =====================================================================
--  supabase/schema.sql — tabelstructuur van het Supabase-project
--  pmnquozexgxhpbpuergj (schema `public`).
--
--  HERKOMST
--  ---------------------------------------------------------------
--  Dit bestand is op 16-09-2026 uitgelezen uit de live database zelf,
--  via information_schema.columns en pg_constraint. Het beschrijft dus
--  wat er werkelijk staat, niet wat de code veronderstelt.
--
--  Daarvóór was het een reconstructie, en dat ging drie keer mis:
--    - de kolommen telefoon/uitgenodigd_door/gewenste_duur op
--      aanvragen stonden hier wel maar niet in de database, waardoor
--      het beheerpaneel "column aanvragen.telefoon does not exist" gaf;
--    - gebruikers heeft een id-kolom en noemt zijn tijdstempel
--      "aangemaakt", niet "created_at";
--    - de functie set_nieuwsbrief bestond hier wel en in de database niet.
--
--  Houd dit bestand daarom bij vanuit de database, niet vanuit de code.
--  Wijzigingen aan een bestaande database lopen via supabase/migrations/.
--
--  Het `auth`-schema staat hier bewust niet in: dat beheert Supabase
--  zelf. Het zit wél in de backup-workflow, omdat daar de accounts
--  in staan.
--
--  Dit bestand bevat alléén tabellen. Functies, RLS-policies en grants
--  staan in supabase/sql/rls-policies.sql; draai dat script ná dit
--  bestand.
--
--  Volgorde bij het opbouwen van een leeg project:
--    1. supabase/schema.sql        (dit bestand)
--    2. supabase/sql/rls-policies.sql
--    3. supabase/migrations/*.sql  (op datum)
--    4. gebruikers toevoegen via /admin.html (nooit rechtstreeks in SQL:
--       zie BEHEERDERS.md, paragraaf 6)
--
--  Veilig om opnieuw te draaien: alles staat als
--  `create table if not exists` / `add column if not exists`.
-- =====================================================================

create extension if not exists pgcrypto;


-- ---------------------------------------------------------------------
--  gebruikers — wie mag inloggen, en met welke rol.
--
--  Let op: de primaire sleutel is `id`, niet `email`. `email` is uniek,
--  en dat is waar de code op stuurt (invite_gebruiker gebruikt
--  `on conflict (email)`).
-- ---------------------------------------------------------------------
create table if not exists public.gebruikers (
  id          uuid    not null default gen_random_uuid(),
  email       text    not null,
  naam        text,
  rol         text    not null default 'gebruiker',
  aangemaakt  timestamptz default now(),
  nieuwsbrief boolean not null default true,   -- e-mailupdates, opt-out
  laposta_id  text,                            -- niet meer in gebruik, zie onder
  categorie   text,                            -- 'bewoner'|'lsw'|'swb'|'dienstverlener'
  huisnummer  text,                            -- 3 cijfers, alleen bewoners
  constraint gebruikers_pkey      primary key (id),
  constraint gebruikers_email_key unique (email)
);

-- De Laposta-koppeling is verwijderd; de nieuwsbrief loopt nu via de Edge
-- Function "nieuwsbrief-versturen". laposta_id blijft bewust staan, omdat
-- weggooien data vernietigt en niets oplost. Wil je hem alsnog kwijt:
--   alter table public.gebruikers drop column laposta_id;

-- NB: in de live database staat GEEN check op `rol`. De code gaat uit van
-- 'gebruiker' | 'beheerder' | 'owner'. Wil je dat afdwingen:
--   alter table public.gebruikers add constraint gebruikers_rol_chk
--     check (rol in ('gebruiker', 'beheerder', 'owner')) not valid;


-- ---------------------------------------------------------------------
--  aanvragen — toegangsverzoeken via /aanvragen.html.
-- ---------------------------------------------------------------------
create table if not exists public.aanvragen (
  id               uuid not null default gen_random_uuid(),
  naam             text not null,
  email            text not null,
  reden            text,
  status           text default 'pending',      -- 'pending'|'approved'|'rejected'
  created_at       timestamptz default now(),
  categorie        text,                        -- zie gebruikers.categorie
  huisnummer       text,
  telefoon         text,                        -- controlevelden voor derden
  uitgenodigd_door text,
  gewenste_duur    text,
  constraint aanvragen_pkey primary key (id)
);

alter table public.aanvragen add column if not exists categorie        text;
alter table public.aanvragen add column if not exists huisnummer       text;
alter table public.aanvragen add column if not exists telefoon         text;
alter table public.aanvragen add column if not exists uitgenodigd_door text;
alter table public.aanvragen add column if not exists gewenste_duur    text;

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.aanvragen'::regclass
                   and conname  = 'aanvragen_huisnummer_chk') then
    alter table public.aanvragen add constraint aanvragen_huisnummer_chk
      check (huisnummer is null
             or (huisnummer ~ '^[0-9]{3}$' and huisnummer::int between 1 and 326));
  end if;
end
$$;

-- NB: in de live database staat GEEN check op `status`. De RLS-policy
-- "aanvragen_insert_publiek" eist wel status = 'pending' bij het indienen,
-- dus via het formulier komt er niets anders binnen. Wil je het afdwingen:
--   alter table public.aanvragen add constraint aanvragen_status_chk
--     check (status in ('pending', 'approved', 'rejected')) not valid;


-- ---------------------------------------------------------------------
--  app_instellingen — eenvoudige sleutel/waarde-instellingen.
--  Gebruikt voor o.a. de "toegangspauze" (sleutel 'toegang_vanaf').
-- ---------------------------------------------------------------------
create table if not exists public.app_instellingen (
  sleutel text not null,
  waarde  text,
  constraint app_instellingen_pkey primary key (sleutel)
);


-- ---------------------------------------------------------------------
--  reacties — reacties van bewoners op de dossierpagina's.
--  Geen moderatie vooraf; de pagina's zitten achter de login.
-- ---------------------------------------------------------------------
create table if not exists public.reacties (
  id         uuid not null default gen_random_uuid(),
  naam       text,
  email      text,
  bericht    text not null,
  pagina     text not null,
  aangemaakt timestamptz not null default now(),
  constraint reacties_pkey primary key (id)
);


-- ---------------------------------------------------------------------
--  correctieverzoeken — verzoeken om onjuiste informatie of ontbrekende
--  bronnen te corrigeren, met antwoord van de redactie.
-- ---------------------------------------------------------------------
create table if not exists public.correctieverzoeken (
  id            uuid not null default gen_random_uuid(),
  dossier       text,
  bericht       text not null,
  naam          text,
  aangemaakt    timestamptz not null default now(),
  antwoord      text,          -- reactie van de redactie (beheerder/owner)
  beantwoord_op timestamptz,   -- wanneer het antwoord is gegeven
  constraint correctieverzoeken_pkey primary key (id)
);

alter table public.correctieverzoeken add column if not exists antwoord      text;
alter table public.correctieverzoeken add column if not exists beantwoord_op timestamptz;


-- ---------------------------------------------------------------------
--  peiling — draagvlakpeiling, twee stellingen op schaal 1–5.
--  Eén stem per gebruiker (unique op email).
-- ---------------------------------------------------------------------
create table if not exists public.peiling (
  id         uuid not null default gen_random_uuid(),
  email      text not null,
  stelling1  int  not null,
  stelling2  int  not null,
  aangemaakt timestamptz not null default now(),
  constraint peiling_pkey            primary key (id),
  constraint peiling_email_key       unique (email),
  constraint peiling_stelling1_check check (stelling1 >= 1 and stelling1 <= 5),
  constraint peiling_stelling2_check check (stelling2 >= 1 and stelling2 <= 5)
);


-- ---------------------------------------------------------------------
--  nieuwsbrieven — logboek van verzonden nieuwsbrieven.
--  Aangemaakt door supabase/migrations/20260916160000_nieuwsbrieven.sql.
--  Rijen worden uitsluitend geschreven door de Edge Function
--  "nieuwsbrief-versturen" met de service-role sleutel.
-- ---------------------------------------------------------------------
create table if not exists public.nieuwsbrieven (
  id                uuid not null default gen_random_uuid(),
  onderwerp         text not null,
  tekst             text not null,
  aantal_ontvangers int  not null default 0,
  aantal_mislukt    int  not null default 0,
  verzonden_door    text,
  verzonden_op      timestamptz not null default now(),
  constraint nieuwsbrieven_pkey primary key (id)
);

create index if not exists nieuwsbrieven_verzonden_op_idx
  on public.nieuwsbrieven (verzonden_op desc);


-- =====================================================================
--  Volgende stap: supabase/sql/rls-policies.sql voor de RLS-policies,
--  grants en de functies huidige_rol(), invite_gebruiker(),
--  set_nieuwsbrief() en peiling_resultaat().
--
--  Zonder dat script staat RLS uit en zijn de tabellen onbeschermd.
-- =====================================================================
