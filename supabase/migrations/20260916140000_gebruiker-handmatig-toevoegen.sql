-- =====================================================================
--  Migratie 20260916140000 — gebruiker handmatig toevoegen
--
--  Aanleiding
--  ----------
--  Een beheerder kon alleen toegang verlenen door een bestaande aanvraag
--  goed te keuren. Wie iemand rechtstreeks wil toelaten, moest die persoon
--  eerst het aanvraagformulier laten invullen. Deze migratie voegt een
--  tweede weg toe: voeg_gebruiker_toe(), aangeroepen vanuit het blok
--  "Gebruiker toevoegen" op /admin.html.
--
--  Wat er verandert
--  ----------------
--  1. Nieuw: controleer_toegang() — de rolcontrole, de toegangspauze en de
--     accountlimieten op één plek. invite_gebruiker() had die regels zelf
--     staan; die worden hier uit gehaald en vervangen door een aanroep.
--     Zo kunnen goedkeuren en handmatig toevoegen niet uit elkaar lopen.
--  2. Gewijzigd: invite_gebruiker() gebruikt de gedeelde controle. Gedrag
--     blijft gelijk: zelfde controles, zelfde volgorde, zelfde foutmeldingen.
--  3. Nieuw: voeg_gebruiker_toe() — maakt een gebruiker aan op basis van
--     opgegeven gegevens in plaats van een aanvraag.
--
--  Geen tabelwijziging, geen data-wijziging, geen RLS-wijziging. Alleen
--  functies. Veilig om opnieuw te draaien.
--
--  De invite-mail verandert niet: admin.html roept ná deze RPC dezelfde
--  Edge Function "invite-gebruiker" aan, die alleen een e-mailadres nodig
--  heeft en niet weet of er een aanvraag aan voorafging. Die functie hoeft
--  dus niet opnieuw gedeployd te worden.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
--  controleer_toegang() — gedeelde poortwachter
--
--  Roept een exception op zodra iets niet mag. Geeft niets terug: wie hem
--  zonder fout doorkomt, mag verder.
--
--  Bewust NIET uitvoerbaar voor anon/authenticated: hij wordt alleen
--  aangeroepen vanuit de twee SECURITY DEFINER functies hieronder, die met
--  de rechten van de eigenaar draaien.
-- ---------------------------------------------------------------------
create or replace function public.controleer_toegang(
  p_email      text,
  p_categorie  text,
  p_huisnummer text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vanaf   text;
  v_bestaat boolean;
begin
  -- 1. Alleen beheerders/owners.
  --
  --    Let op de coalesce. huidige_rol() geeft NULL terug voor iemand met een
  --    geldige inlogsessie die niet in public.gebruikers staat, en in SQL is
  --    "NULL not in ('beheerder','owner')" niet waar maar NULL. Zonder deze
  --    coalesce sloeg de controle dan over en kwam zo iemand er gewoon door.
  --    Dat gat zat in de vorige versie van invite_gebruiker en is hiermee
  --    voor beide functies dicht.
  if coalesce(public.huidige_rol(), '') not in ('beheerder', 'owner') then
    raise exception 'Geen beheerdersrechten'
      using errcode = '42501';  -- insufficient_privilege
  end if;

  -- 2. Toegangspauze (testfase): zolang vandaag vóór 'toegang_vanaf' ligt,
  --    wordt er geen toegang verleend. Aanvragen blijven wel binnenkomen.
  select waarde into v_vanaf
  from public.app_instellingen
  where sleutel = 'toegang_vanaf';

  if v_vanaf is not null and v_vanaf <> '' and current_date < v_vanaf::date then
    raise exception 'Toegang verlenen is gepauzeerd tot % (testfase).', v_vanaf
      using errcode = 'P0001';
  end if;

  if p_email is null or p_email = '' then
    raise exception 'E-mailadres ontbreekt'
      using errcode = '22023';  -- invalid_parameter_value
  end if;

  -- 3. Accountlimieten — alleen voor een NIEUW account. Bestaat de gebruiker
  --    al, dan is dit een bijwerking en gelden de limieten niet opnieuw.
  select exists(select 1 from public.gebruikers where email = p_email)
    into v_bestaat;

  if v_bestaat then
    return;
  end if;

  if p_categorie = 'lsw' then
    if (select count(*) from public.gebruikers where categorie = 'lsw') >= 2 then
      raise exception 'Maximum van 2 LSW-accounts is al bereikt.' using errcode = 'P0001';
    end if;

  elsif p_categorie = 'swb' then
    if (select count(*) from public.gebruikers where categorie = 'swb') >= 2 then
      raise exception 'Maximum van 2 SWB-accounts is al bereikt.' using errcode = 'P0001';
    end if;

  elsif p_categorie = 'dienstverlener' then
    if (select count(*) from public.gebruikers where categorie = 'dienstverlener') >= 1 then
      raise exception 'Er is al een dienstverlener-account (maximum 1).' using errcode = 'P0001';
    end if;

  elsif p_categorie = 'bewoner' then
    if p_huisnummer is null or p_huisnummer = '' then
      raise exception 'Huisnummer ontbreekt voor deze bewoner.' using errcode = '22023';
    end if;
    if (select count(*) from public.gebruikers
          where categorie = 'bewoner' and huisnummer = p_huisnummer) >= 2 then
      raise exception 'Voor huisnummer % bestaan al 2 accounts (maximum 2).', p_huisnummer
        using errcode = 'P0001';
    end if;
  end if;
end;
$$;

revoke all on function public.controleer_toegang(text, text, text) from public, anon, authenticated;


-- ---------------------------------------------------------------------
--  invite_gebruiker(p_email) — ongewijzigd gedrag, gedeelde controle
--
--  Keurt een bestaande aanvraag goed. Naam, categorie en huisnummer komen
--  uit de meest recente aanvraag van dat e-mailadres.
-- ---------------------------------------------------------------------
create or replace function public.invite_gebruiker(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email      text := lower(trim(p_email));
  v_naam       text;
  v_categorie  text;
  v_huisnummer text;
begin
  -- Naam, categorie en huisnummer uit de meest recente aanvraag halen.
  select naam, categorie, huisnummer
    into v_naam, v_categorie, v_huisnummer
  from public.aanvragen
  where lower(email) = v_email
  order by created_at desc
  limit 1;

  -- Rol, pauze en accountlimieten (zie controleer_toegang).
  perform public.controleer_toegang(v_email, v_categorie, v_huisnummer);

  -- Gebruiker toevoegen met rol "gebruiker". Bestaat de gebruiker al, dan
  -- alleen ontbrekende velden aanvullen — een bestaande rol blijft ongemoeid.
  insert into public.gebruikers (email, naam, rol, categorie, huisnummer)
  values (v_email, nullif(trim(v_naam), ''), 'gebruiker', v_categorie, v_huisnummer)
  on conflict (email) do update
    set naam       = coalesce(excluded.naam, public.gebruikers.naam),
        categorie  = coalesce(public.gebruikers.categorie, excluded.categorie),
        huisnummer = coalesce(public.gebruikers.huisnummer, excluded.huisnummer);

  -- Bijbehorende openstaande aanvraag op "approved" zetten.
  update public.aanvragen
    set status = 'approved'
    where lower(email) = v_email
      and status = 'pending';

  return jsonb_build_object('ok', true, 'email', v_email, 'rol', 'gebruiker',
                            'categorie', v_categorie, 'huisnummer', v_huisnummer);
end;
$$;

revoke all on function public.invite_gebruiker(text) from public;
grant execute on function public.invite_gebruiker(text) to authenticated;


-- ---------------------------------------------------------------------
--  voeg_gebruiker_toe() — toegang verlenen zonder aanvraag
--
--  Voor het geval een beheerder iemand rechtstreeks wil toelaten. Dezelfde
--  controles als bij goedkeuren, maar de gegevens komen uit het formulier
--  in plaats van uit een aanvraag.
--
--  Bestaat de gebruiker al, dan een duidelijke fout in plaats van stilletjes
--  bijwerken: wie een bestaand account wil wijzigen doet dat bewust, niet
--  per ongeluk via het toevoegformulier.
--
--  Staat er nog een openstaande aanvraag van dit e-mailadres, dan wordt die
--  meteen op "approved" gezet. Anders blijft er een aanvraag hangen voor
--  iemand die al toegang heeft.
-- ---------------------------------------------------------------------
create or replace function public.voeg_gebruiker_toe(
  p_email      text,
  p_naam       text default null,
  p_categorie  text default null,
  p_huisnummer text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email      text := lower(trim(coalesce(p_email, '')));
  v_naam       text := nullif(trim(coalesce(p_naam, '')), '');
  v_categorie  text := nullif(trim(coalesce(p_categorie, '')), '');
  v_huisnummer text := nullif(trim(coalesce(p_huisnummer, '')), '');
begin
  -- Invoer valideren vóór de gedeelde controle, zodat de melding over de
  -- invoer gaat en niet over een limiet.
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Geen geldig e-mailadres: %', p_email
      using errcode = '22023';
  end if;

  if v_categorie is null or v_categorie not in ('bewoner', 'lsw', 'swb', 'dienstverlener') then
    raise exception 'Kies een geldig type: bewoner, lsw, swb of dienstverlener.'
      using errcode = '22023';
  end if;

  if v_categorie = 'bewoner' then
    if v_huisnummer is null
       or v_huisnummer !~ '^[0-9]{3}$'
       or v_huisnummer::int not between 1 and 326 then
      raise exception 'Vul een geldig huisnummer in (001 t/m 326).'
        using errcode = '22023';
    end if;
  else
    -- Huisnummer hoort alleen bij bewoners.
    v_huisnummer := null;
  end if;

  if exists (select 1 from public.gebruikers where email = v_email) then
    raise exception 'Er bestaat al een account voor %.', v_email
      using errcode = 'P0001';
  end if;

  -- Rol, pauze en accountlimieten (zie controleer_toegang).
  perform public.controleer_toegang(v_email, v_categorie, v_huisnummer);

  insert into public.gebruikers (email, naam, rol, categorie, huisnummer)
  values (v_email, v_naam, 'gebruiker', v_categorie, v_huisnummer);

  -- Eventuele openstaande aanvraag van dit adres meteen afhandelen.
  update public.aanvragen
    set status = 'approved'
    where lower(email) = v_email
      and status = 'pending';

  return jsonb_build_object('ok', true, 'email', v_email, 'rol', 'gebruiker',
                            'categorie', v_categorie, 'huisnummer', v_huisnummer);
end;
$$;

revoke all on function public.voeg_gebruiker_toe(text, text, text, text) from public, anon;
grant execute on function public.voeg_gebruiker_toe(text, text, text, text) to authenticated;

commit;
