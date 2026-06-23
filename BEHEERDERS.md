# Beheerdersnotities — Kerndossiers De Stille Wille

Praktische uitleg van de werkstroom voor beheerders. Voor het redactionele
beleid (wat wel/niet op de site mag), zie `REDACTIE.md`.

## 1. Hoe bewoners toegang krijgen
- Bewoners loggen in met een **inloglink per e-mail** (magic link) — geen wachtwoorden.
- Alleen geregistreerde adressen in de tabel **`gebruikers`** krijgen toegang.
- Drie rollen: **gebruiker** (lezen), **beheerder** (beheer), **owner** (volledige rechten).
- Beheer gebeurt op **/admin.html** (alleen zichtbaar voor beheerder/owner).

## 2. Nieuwsbrief / e-mailupdates — hoe het werkt
**Doel:** bewoners op de hoogte houden zodra een dossier is bijgewerkt.

- De **mailinglijst en het versturen** lopen volledig via **Laposta** (AVG-proof,
  met wettelijke afmeldlink en statistieken).
- Elke bewoner regelt zijn aanmelding zelf met de schakelaar
  **"E-mailupdates: Aan/Uit"** op zijn **accountpagina** (`/account.html`).
  - **Aan** → bewoner wordt automatisch aan de Laposta-lijst toegevoegd.
  - **Uit** → bewoner wordt automatisch afgemeld.
- Standaard staat het **aan** (opt-out): iedereen ontvangt updates, tenzij hij
  zich afmeldt.
- In het beheerpaneel zie je onder **"Nieuwsbrief"** voor hoeveel bewoners het
  aan staat.

### De nieuwsbrief versturen (dit doe jij als beheerder)
1. Log in bij **Laposta** (menu: **Relaties / Campagnes / Automations / Resultaten**).
2. Maak onder **Campagnes** een nieuwe campagne aan, gericht op de bewonerslijst.
3. Schrijf een **korte, feitelijke** update (bijv. "Dossier Bovengronds is
   bijgewerkt") met eventueel een link naar het dossier.
4. Verstuur of plan de campagne. Laposta voegt zelf de afmeldlink toe.
5. Resultaten (geopend, geklikt) zie je onder **Resultaten**.

> Let op: in de wébsite zit géén verzendknop — schrijven en versturen gebeurt
> altíjd in Laposta. De website regelt alleen aan-/afmelden.

## 3. Belangrijke aandachtspunten
- **Afmelden via de mail:** meldt iemand zich af via de afmeldlink in een
  Laposta-mail, dan staat de schakelaar op zijn accountpagina mogelijk nog op
  "aan". (Optioneel kan dit later automatisch synchroon worden gemaakt via een
  Laposta-webhook.)
- **Nieuwe bewoners:** worden bij **goedkeuring** van hun aanvraag automatisch
  op de Laposta-lijst gezet (opt-out). Handmatig toegevoegde accounts (via SQL)
  of bestaande adressen kun je eenmalig in Laposta importeren.
- **Toon en inhoud:** houd updates kort en feitelijk, zonder oordeel
  (zie `REDACTIE.md`).

## 4. Technische sleutels (niet delen)
- De koppeling gebruikt in Supabase twee geheimen: **`LAPOSTA_API_KEY`** en
  **`LAPOSTA_LIST_ID`**.
- Die staan veilig in Supabase → Edge Functions → Manage secrets. **Nooit** in
  e-mails, documenten of de website zetten.
- De synchronisatie loopt via de Edge Function **`laposta-sync`**.

## 5. Andere beheertaken (op /admin.html)
- **Aanvragen** — nieuwe toegangsverzoeken goed-/afkeuren.
- **Gebruikers** — rollen bekijken/wijzigen.
- **Reacties** — reacties van bewoners beheren.
- **Correctieverzoeken** — verzoeken tot correctie van dossiers afhandelen.

## 6. Adressen eenmalig autoriseren (zonder invite-mail)
Toegang in dit systeem werkt via de tabel **`gebruikers`**: wie daar in staat,
kan inloggen met de magic-link op `/login.html`. Er is géén invite-mail nodig —
het volstaat om het adres in die tabel te zetten.

Om in één keer een lijst adressen te autoriseren staat er een kant-en-klaar
SQL-script in de repository: **`supabase/sql/bulk-authoriseer.sql`**.

### Uitvoeren (Supabase-dashboard, geen CLI)
1. Open het **Supabase-dashboard** → project → **SQL Editor**.
2. Open `supabase/sql/bulk-authoriseer.sql` uit deze repository en plak de
   inhoud in de editor (pas de e-mailadressen aan naar je eigen lijst).
3. Klik **Run**. De adressen worden met rol `gebruiker` toegevoegd; bestaande
   adressen blijven ongemoeid (`on conflict (email) do nothing`).
4. De `select` onderaan toont meteen welke adressen nu in de tabel staan.

> **Toegangspauze (`app_instellingen.toegang_vanaf`).** Die datum geldt alleen
> voor de **Goedkeuren-knop** op /admin.html (de RPC `invite_gebruiker`). Een
> directe insert zoals hierboven gaat daarbuiten om: de adressen zijn meteen
> geautoriseerd, ongeacht die datum.
