-- =====================================================================
--  Tabel: inlog_fouten
--
--  Elke mislukte inlogpoging laat hier een regel achter. Zonder dit
--  logboek is een bewoner die vastloopt onzichtbaar: hij mailt of belt,
--  of hij geeft het op. Nu is achteraf te zien wát er misging.
--
--  Soorten (login.html en auth-callback.html schrijven deze waarden):
--    mail-versturen-mislukt  — signInWithOtp gaf een fout
--    geen-account            — adres heeft nog geen Supabase-account
--    link-ongeldig           — foutmelding in de hash of querystring
--    link-ander-apparaat     — PKCE-code zonder verifier in deze browser
--    geen-sessie             — callback zonder bruikbare sessie
--    code-fout               — overgetypte code klopt niet of is verlopen
--    niet-op-lijst           — wel een account, niet op public.gebruikers
--    toegang-controle-fout   — de controle op gebruikers gaf een fout
--
--  Iedereen mag schrijven (ook niet-ingelogd: juist dán loopt het mis),
--  lezen mag alleen een beheerder of de owner. Omdat anon mag invoegen,
--  begrenzen check-constraints de lengte van elk veld en de lijst met
--  toegestane soorten; dat houdt de tabel klein als iemand hem volgooit.
-- =====================================================================
create table if not exists public.inlog_fouten (
  id         uuid primary key default gen_random_uuid(),
  tijd       timestamptz not null default now(),
  email      text,
  soort      text not null,
  detail     text,
  user_agent text
);

alter table public.inlog_fouten drop constraint if exists inlog_fouten_soort_chk;
alter table public.inlog_fouten add constraint inlog_fouten_soort_chk
  check (soort in ('mail-versturen-mislukt', 'geen-account', 'link-ongeldig',
                   'link-ander-apparaat', 'geen-sessie', 'code-fout',
                   'niet-op-lijst', 'toegang-controle-fout'));

alter table public.inlog_fouten drop constraint if exists inlog_fouten_lengtes_chk;
alter table public.inlog_fouten add constraint inlog_fouten_lengtes_chk
  check (char_length(coalesce(email, ''))      <= 320
     and char_length(coalesce(detail, ''))     <= 500
     and char_length(coalesce(user_agent, '')) <= 400);

create index if not exists inlog_fouten_tijd_idx on public.inlog_fouten (tijd desc);

alter table public.inlog_fouten enable row level security;

grant insert on public.inlog_fouten to anon, authenticated;
grant select on public.inlog_fouten to authenticated;
revoke update, delete on public.inlog_fouten from anon, authenticated;

drop policy if exists "inlog_fouten_insert_iedereen" on public.inlog_fouten;
drop policy if exists "inlog_fouten_select_beheer"   on public.inlog_fouten;

-- Schrijven: iedereen, ingelogd of niet. Wie vastloopt bij het inloggen is
-- per definitie nog niet ingelogd.
create policy "inlog_fouten_insert_iedereen"
  on public.inlog_fouten
  for insert
  to anon, authenticated
  with check (true);

-- Lezen: alleen beheerders/owners.
create policy "inlog_fouten_select_beheer"
  on public.inlog_fouten
  for select
  to authenticated
  using (public.huidige_rol() in ('beheerder', 'owner'));
