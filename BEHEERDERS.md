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

## 6. Bestaande bewoners eenmalig uitnodigen (bulk-invite)
Soms staan er al adressen in de tabel **`gebruikers`** (bijv. handmatig via SQL
toegevoegd) die nog nooit een inloglink hebben ontvangen. Met de **bulk-invite**
verstuur je in één keer een invite-mail naar iedereen die nog géén Supabase
Auth-account heeft. Adressen die al een account hebben worden overgeslagen — je
kunt dit dus veilig opnieuw uitvoeren, er gaan nooit dubbele invites uit.

### Stap 1 — Edge Function éénmalig publiceren (Supabase-dashboard)
Dit hoeft maar één keer; daarna kun je de knop steeds gebruiken. **Geen lokale
CLI nodig.**
1. Open het **Supabase-dashboard** → project → **Edge Functions**.
2. Klik **Create a new function** (of **Deploy a new function**).
3. Naam: **`bulk-invite`** (exact zo).
4. Plak de volledige inhoud van `supabase/functions/bulk-invite/index.ts`
   (uit deze repository) in de editor en klik **Deploy**.
5. Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` en `SUPABASE_ANON_KEY`
   zijn standaard al aanwezig — je hoeft niets extra in te stellen.

### Stap 2 — Uitvoeren via /admin.html (de knop)
1. Log in op **/admin.html** als beheerder of owner.
2. Ga naar het blok **Gebruikers → Bulk-uitnodigen**.
3. Klik eerst **Controleren**: je ziet hoeveel adressen nog een invite nodig
   hebben en hoeveel er worden overgeslagen — er wordt dan nóg niets verstuurd.
4. Klopt het? Klik **Invites versturen**. Na afloop verschijnt een overzicht:
   *zoveel verstuurd, zoveel overgeslagen* (en eventueel welke mislukten).

> **Let op — e-mail-rate-limit.** Supabase' ingebouwde mailserver verstuurt maar
> een paar mails per uur. Voor een grotere lijst moet er een eigen SMTP-server
> ingesteld zijn (Dashboard → **Authentication → Emails / SMTP Settings**),
> anders lopen de meeste invites op een rate-limit-fout vast. De knop kan zonder
> bezwaar later opnieuw worden gebruikt: wie al een invite (account) heeft, wordt
> overgeslagen.

### Alternatief — direct vanuit het Supabase-dashboard testen
Je kunt de functie ook in het dashboard aanroepen (Edge Functions → `bulk-invite`
→ tab **Invoke/Test**), maar dan moet je zelf een `Authorization: Bearer <jwt>`
van een ingelogde beheerder meegeven. De knop op **/admin.html** doet dat
automatisch en is daarom de makkelijkste weg.
