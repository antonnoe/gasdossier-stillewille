-- =====================================================================
--  Migratie 20260916160000 — logboek van verzonden nieuwsbrieven
--
--  Hoort bij het opstelscherm "Nieuwsbrief" op /admin.html en de Edge
--  Function "nieuwsbrief-versturen". Elke echte verzending legt hier één
--  rij vast, zodat in het beheerpaneel te zien is wat er wanneer naar
--  hoeveel mensen is gegaan. Testmails worden NIET vastgelegd.
--
--  De rijen worden geschreven door de Edge Function met de service-role
--  sleutel, die RLS omzeilt. Daarom is er bewust geen insert-policy: langs
--  de gewone weg kan niemand een verzending verzinnen.
--
--  Puur additief: nieuwe tabel, geen bestaande tabel of rij wordt geraakt.
--  Veilig om opnieuw te draaien.
-- =====================================================================

begin;

create table if not exists public.nieuwsbrieven (
  id               uuid primary key default gen_random_uuid(),
  onderwerp        text not null,
  tekst            text not null,
  aantal_ontvangers int  not null default 0,
  aantal_mislukt   int  not null default 0,
  verzonden_door   text,
  verzonden_op     timestamptz not null default now()
);

create index if not exists nieuwsbrieven_verzonden_op_idx
  on public.nieuwsbrieven (verzonden_op desc);

alter table public.nieuwsbrieven enable row level security;

grant select on public.nieuwsbrieven to authenticated;

drop policy if exists "nieuwsbrieven_select_beheer" on public.nieuwsbrieven;

-- Lezen: alleen beheerders/owners, voor de lijst onder het opstelscherm.
-- coalesce, want huidige_rol() geeft NULL voor wie niet in gebruikers staat.
create policy "nieuwsbrieven_select_beheer"
  on public.nieuwsbrieven
  for select
  to authenticated
  using (coalesce(public.huidige_rol(), '') in ('beheerder', 'owner'));

commit;
