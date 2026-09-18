# Beheerdersnotities — Kerndossiers De Stille Wille

Praktische uitleg van de werkstroom voor beheerders. Voor het redactionele
beleid (wat wel/niet op de site mag), zie `REDACTIE.md`.

## 1. Hoe bewoners toegang krijgen
- Bewoners loggen in met een **inloglink per e-mail** (magic link) — geen wachtwoorden.
- Toegang hangt aan twee lijsten: het Supabase-account (**`auth.users`**,
  waar de inloglink aan hangt) en de autorisatielijst (**`gebruikers`**).
  Beide worden in één handeling gevuld — zie paragraaf 6.
- Drie rollen: **gebruiker** (lezen), **beheerder** (beheer), **owner** (volledige rechten).
- Beheer gebeurt op **/admin.html** (alleen zichtbaar voor beheerder/owner).

## 2. Nieuwsbrief / e-mailupdates — hoe het werkt
**Doel:** bewoners op de hoogte houden zodra een dossier is bijgewerkt.

- Schrijven én versturen gebeurt **in het beheerpaneel zelf**, onder
  **"Nieuwsbrief"** op `/admin.html`. Er is geen externe maildienst meer waar
  je apart moet inloggen.
- Wie de nieuwsbrief ontvangt, staat in één kolom in de database:
  `gebruikers.nieuwsbrief`. Elke bewoner zet die zelf aan of uit met de
  schakelaar **"E-mailupdates"** op zijn **accountpagina** (`/account.html`),
  of via de **afmeldlink onderaan elke nieuwsbrief**.
- Standaard staat het **aan** (opt-out): iedereen ontvangt updates, tenzij hij
  zich afmeldt.
- Boven het opstelscherm zie je voor hoeveel bewoners het aan staat. Onder het
  opstelscherm staat de lijst met eerder verzonden nieuwsbrieven.

### De nieuwsbrief versturen (dit doe jij als beheerder)
1. Ga naar `/admin.html`, blok **Nieuwsbrief**.
2. Vul een **onderwerp** in en schrijf de **tekst**. Platte tekst volstaat: een
   lege regel begint een nieuwe alinea en links die met `https://` beginnen
   worden vanzelf klikbaar.
3. Klik **"Stuur testmail naar mij"**. Die gaat alleen naar je eigen
   e-mailadres, wordt niet vastgelegd en bereikt geen enkele bewoner.
4. Ziet de testmail er goed uit, klik dan **"Versturen"**. Je krijgt eerst een
   bevestigingsvraag met het **aantal ontvangers** erbij.
5. Na afloop verschijnt de verzending in de lijst eronder, met datum,
   onderwerp en aantal ontvangers.

> Houd updates kort en feitelijk, zonder oordeel (zie `REDACTIE.md`).

## 3. Belangrijke aandachtspunten
- **Afmelden werkt meteen.** De afmeldlink onderaan de mail zet dezelfde
  schakelaar uit als die op de accountpagina. Er is dus geen verschil meer
  tussen "afgemeld in de mail" en "afgemeld op de site".
- **Nieuwe bewoners** staan bij goedkeuring automatisch op **aan** (opt-out).
- **Verzendlimiet.** De mail loopt via Resend. Er gaan maximaal 100 mails per
  aanroep en het beheerpaneel wacht tussen de porties, zodat de limiet van het
  Resend-account niet wordt overschreden. Het dagelijkse maximum hangt af van
  je Resend-abonnement; dat zie je in het Resend-dashboard.

## 4. Technische sleutels (niet delen)
- De verzending gebruikt in Supabase twee geheimen: **`RESEND_API_KEY`** en
  **`NIEUWSBRIEF_SECRET`**.
  - `RESEND_API_KEY` komt uit het Resend-dashboard.
  - `NIEUWSBRIEF_SECRET` is een zelfgekozen lange tekenreeks die de
    afmeldlinks ondertekent. Zonder dat geheim kan niemand een afmeldlink
    namaken en dus ook niemand anders afmelden.
- Die staan in Supabase → Edge Functions → Manage secrets. **Nooit** in
  e-mails, documenten of de website zetten.
- De verzending loopt via de Edge Function **`nieuwsbrief-versturen`**, het
  afmelden via **`nieuwsbrief-afmelden`**.

## 5. Andere beheertaken (op /admin.html)
- **Aanvragen** — nieuwe toegangsverzoeken goed-/afkeuren.
- **Gebruikers** — rollen bekijken/wijzigen.
- **Reacties** — reacties van bewoners beheren.
- **Correctieverzoeken** — verzoeken tot correctie van dossiers afhandelen.

## 6. Toegang verlenen — uitsluitend via /admin.html
Toegang hangt aan **twee** lijsten en die moeten allebei kloppen:

- **`auth.users`** — het Supabase-account. Hier hangt de inloglink aan. Staat
  een adres hier niet, dan krijgt die persoon op `/login.html` geen
  toegangslink: die pagina maakt bewust geen nieuwe accounts aan en in
  Supabase staan signups uit.
- **`public.gebruikers`** — de autorisatielijst van de site. Staat een adres
  hier niet, dan wordt de bezoeker na het inloggen meteen weer uitgelogd met
  de melding "Dit account heeft geen toegang, vraag toegang aan".

Er is daarom nog maar **één manier** om iemand toe te laten, en die vult
allebei de lijsten in één handeling:

1. **Goedkeuren** bij een aanvraag in het blok **Aanvragen**, of
2. het blok **Gebruiker toevoegen** als iemand geen aanvraag heeft ingediend.

Beide knoppen roepen dezelfde Edge Function **`invite-gebruiker`** aan. Die
zet de rij in `gebruikers` (met de controles uit `controleer_toegang`: rol,
toegangspauze, accountlimieten per type) én maakt het Supabase-account aan
met een uitnodiging per e-mail. Lukt het tweede deel niet, dan zegt het
beheerpaneel dat er met zoveel woorden bij.

> **Nooit meer rechtstreeks in de database.** Een rij in `gebruikers` zetten
> via de SQL Editor lijkt te werken maar levert iemand op die niet kan
> inloggen. Het oude script `supabase/sql/bulk-authoriseer.sql` ging van die
> onjuiste aanname uit en is daarom verwijderd. Wil je controleren of de twee
> lijsten nog gelijk lopen, draai dan de workflow **Toegang diagnose**
> (Actions → Toegang diagnose → Run workflow); die toont aantallen per groep.

> **Toegangspauze (`app_instellingen.toegang_vanaf`).** Zolang die datum in de
> toekomst ligt, weigeren zowel Goedkeuren als Gebruiker toevoegen. Aanvragen
> blijven wel binnenkomen.
