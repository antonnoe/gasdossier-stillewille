-- =====================================================================
--  bulk-authoriseer.sql — eenmalig adressen autoriseren
--
--  Zet een vaste lijst e-mailadressen rechtstreeks in de tabel
--  public.gebruikers, zodat zij toegang krijgen (kunnen inloggen via de
--  magic-link op /login.html). Er wordt GEEN invite-mail verstuurd.
--
--  Uitvoeren: Supabase-dashboard -> SQL Editor -> plak dit -> Run.
--  (Geen lokale CLI nodig.)
--
--  Veilig om opnieuw te draaien: bestaande adressen blijven ongemoeid
--  dankzij ON CONFLICT (email) DO NOTHING.
--
--  Rol 'gebruiker' = leestoegang (de standaardrol). categorie/huisnummer
--  laten we leeg; die zijn voor deze handmatige autorisatie niet nodig.
--
--  Let op: de "toegangspauze" (app_instellingen.toegang_vanaf) geldt ALLEEN
--  voor de Goedkeuren-knop in /admin.html (de RPC invite_gebruiker). Een
--  directe insert zoals hieronder gaat daarbuiten om: deze mensen zijn dus
--  meteen geautoriseerd, ongeacht die datum.
-- =====================================================================

insert into public.gebruikers (email, rol)
values
  ('eerk@eerk.nl',                'gebruiker'),
  ('dorothe@eerk.nl',            'gebruiker'),
  ('tonny.schoenmakers@gmail.com','gebruiker'),
  ('miriam.ochs@gmail.com',      'gebruiker'),
  ('mfranzen1958@hotmail.com',   'gebruiker'),
  ('ivo@lostboyscout.nl',        'gebruiker'),
  ('ansvanderstaak@gmail.com',   'gebruiker'),
  ('bram@bramperry.com',         'gebruiker'),
  ('koosvankampen@gmail.com',    'gebruiker'),
  ('hans@vanheesbeen.com',       'gebruiker'),
  ('lounonkes@outlook.com',      'gebruiker'),
  ('info@nederlanders.fr',       'gebruiker'),
  ('joostmichels@mail.com',      'gebruiker'),
  ('rickpbos@gmail.com',         'gebruiker'),
  ('paul.schoenmakers@trined.nl','gebruiker'),
  ('susan@vanheesbeen.com',      'gebruiker'),
  ('gerdragstra@gmail.com',      'gebruiker')
on conflict (email) do nothing;

-- Controle: laat zien welke van de adressen nu in de tabel staan.
select email, rol, categorie, huisnummer, created_at
from public.gebruikers
where email in (
  'eerk@eerk.nl','dorothe@eerk.nl','tonny.schoenmakers@gmail.com',
  'miriam.ochs@gmail.com','mfranzen1958@hotmail.com','ivo@lostboyscout.nl',
  'ansvanderstaak@gmail.com','bram@bramperry.com','koosvankampen@gmail.com',
  'hans@vanheesbeen.com','lounonkes@outlook.com','info@nederlanders.fr',
  'joostmichels@mail.com','rickpbos@gmail.com','paul.schoenmakers@trined.nl',
  'susan@vanheesbeen.com','gerdragstra@gmail.com'
)
order by email;
