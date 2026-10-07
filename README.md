# gasdossier-stillewille

Kerndossiers Landgoed De Stille Wille: statische dossierpagina's over gas, erfpacht, bovengrondse infrastructuur en andere onderwerpen, met daarachter Supabase-login (inloglink per mail) en een beheeromgeving voor toegang.

## Structuur

```
/
├── *.html            # dossierpagina's, hulppagina's (login, account, admin) en bronnen
├── tokens.css        # ontwerpvariabelen (kleuren, lettertypen)
├── components.css    # gedeelde componenten (callouts, tabellen, pager, kaarten)
├── dossiers.js       # register van alle dossiers en secties
├── chrome.js         # rendert navigatie, kicker en pager uit dossiers.js
├── footer.js         # gedeelde footer
├── sw.js             # service worker (network-first)
├── supabase-config.js# publieke Supabase-configuratie voor de pagina's
├── middleware.js     # toegangscontrole voor de pagina's
├── feed.xml          # RSS-feed met update-mededelingen
├── vercel.json       # redirects en cron
├── api/              # Vercel-functions (keep-alive)
├── kennisbank/       # inventarisaties van brondocumenten (markdown)
├── downloads/        # PDF- en Word-bestanden die op de site worden aangeboden
├── supabase/         # schema, RLS-policies, migraties, edge functions, mailtemplates
├── .github/          # workflows: backup, keep-alive, migratie, live controle, toegang
├── BEHEERDERS.md     # handleiding voor beheerders
└── REDACTIE.md       # redactionele afspraken
```

## Hoe de dossierpagina's zijn opgebouwd

Elke pagina laadt `tokens.css` en `components.css` voor de opmaak en sluit af met drie scripts: `dossiers.js`, `chrome.js` en `footer.js`.

- `dossiers.js` is de enige bron voor welke dossiers en secties bestaan. Per dossier staat er een slug, titel, categorie, status en een lijst secties, met per sectie de bestandsnaam van de pagina.
- `chrome.js` leest dat register en bouwt daaruit de navigatie, de kicker boven de titel en, op pagina's met `data-sw-pager`, de pager met vorige en volgende. De huidige pagina wordt herkend aan `<body data-slug="...">`. Hoofdstukken van het gasdossier gebruiken de slug `gas`.
- `footer.js` voegt de gedeelde footer toe.
- Hoofdstukpagina's van het gasdossier (`gas-historie.html`, `gas-juridisch.html`, `gas-kosten.html`, `gas-toekomst.html`) hebben een handgeschreven pager onderaan; `gas.html` is het overzicht met een kaart per hoofdstuk.

## Een nieuwe pagina toevoegen

1. Maak het HTML-bestand in de root, naar het voorbeeld van een bestaand hoofdstuk (bijvoorbeeld `gas-kosten.html`), met `noindex, nofollow` en dezelfde stylesheets en scripts.
2. Registreer de pagina als sectie in `dossiers.js`. Daarmee volgen navigatie, pager en de zoekindex van `zoeken.html` vanzelf; die laatste leest de paginalijst uit het register.
3. Is het een hoofdstuk van het gasdossier: voeg een kaart toe op `gas.html` en pas de handgeschreven pager van het vorige hoofdstuk aan.
4. Staan er bronnen of uitspraken in: voeg ze toe aan `bronnen.html` in de bestaande opmaak, en het verificatieregister als er claims met cijfers bijkomen.
5. Wil je een update melden: voeg een `<item>` toe aan `feed.xml` (uitleg staat bovenin dat bestand).
6. `sw.js` heeft geen precache-lijst en vraagt geen registratie.
7. Wijzigt een bestaande URL: zet een redirect in `vercel.json`.

## Hosting

Gehost via Vercel. Automatische deploy bij elke push naar `main`.

- Vercel-project: `kerndossiers-stillewille`
- Vercel-URL: `https://kerndossiers-stillewille.vercel.app` (zo staat de
  redirect-URL ook in `login.html`)
- Eventueel later: custom domein via TransIP

## Updates

Bij een nieuwe versie van het dossier of de voorbeeldbrief:

1. Upload het nieuwe docx-bestand naar de repo (vervangt het oude).
2. Pas in `index.html` de versievermelding aan in de footer (regel onderaan).
3. Pas eventueel de bestandsgrootte in de downloadknoppen aan.
4. Commit en push — Vercel deployt automatisch.

## Supabase — wakker houden

Het Supabase-project (`pmnquozexgxhpbpuergj`) draait op het gratis plan en
pauzeert automatisch na 7 dagen zonder activiteit. Staat het op pauze, dan
mislukt de magic-link login voor iedereen. Twee onafhankelijke maatregelen
houden het wakker:

1. **`/api/keep-alive`** — Vercel-cron, dagelijks 04:00 UTC (zie `vercel.json`).
   Doet één leesquery op de tabel `gebruikers` en raakt daarmee de database
   zelf. Schrijft niets.
2. **`.github/workflows/supabase-keepalive.yml`** — GitHub Action, elke 3
   dagen. Pingt de Auth-API. Dient als achtervang.

Allebei, omdat ze op verschillende manieren stukgaan: GitHub schakelt
geplande workflows uit als de repository 60 dagen geen commit krijgt, een
Vercel-cron niet.

### Env vars in Vercel (Project Settings → Environment Variables)

| Naam | Verplicht | Waar te vinden |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | ja | Supabase-dashboard → Project Settings → API → `service_role`. **Geheim** — nooit in client-side code. |
| `CRON_SECRET` | nee, wel aan te raden | Zelf verzinnen (lange willekeurige tekenreeks). Staat die gezet, dan weigert `/api/keep-alive` elk verzoek zonder de juiste `Authorization`-header; Vercel stuurt die bij cron-runs vanzelf mee. |
| `SUPABASE_URL` | nee | Alleen nodig als het project ooit verhuist; anders valt de function terug op de vaste project-URL. |

Controleren of het werkt: Vercel-dashboard → het project → **Logs**, of open
`/api/keep-alive` handmatig (alleen zonder `CRON_SECRET`). Een geslaagde run
geeft `{"ok":true,"table":"gebruikers","timestamp":"…"}`; een mislukte run
geeft status 500 met de foutmelding, zodat het opvalt.

## Backups

Het gratis Supabase-plan maakt **geen** backups. De workflow
`.github/workflows/supabase-backup.yml` draait daarom elke maandag om 03:00
UTC (en handmatig via Actions → Supabase backup → **Run workflow**) en
exporteert de inhoud van de database als JSON: één bestand per tabel uit
`public`, plus `auth-users.json` met de accounts en `manifest.json` met de
aantallen. Het resultaat komt als **workflow-artifact** onder de run te staan
en blijft **90 dagen** bewaard.

De export loopt via de API met het secret **`SUPABASE_SERVICE_ROLE_KEY`**,
niet via `pg_dump`. Dat is een bewuste keuze: de oude opzet had een directe
databaseverbinding nodig (`SUPABASE_DB_URL`) en die is er in de praktijk
nooit gekomen, waardoor er maandenlang geen enkele backup is gemaakt. Een
backup die op één secret minder leunt, is er een die daadwerkelijk draait.

> Het artifact bevat persoonsgegevens (e-mailadressen van bewoners). Alleen
> wie toegang heeft tot deze repository kan het downloaden. Bewaar een
> gedownloade kopie navenant.

### Wat er niet in de backup zit

De **structuur** van de database: tabellen, functies en RLS-policies. Die
staat in de repository zelf, in `supabase/schema.sql`,
`supabase/sql/rls-policies.sql` en `supabase/migrations/`. Een leeg project
bouw je op met die bestanden en zet je daarna vol met de JSON uit het
artifact.

### Schema in de repository

`supabase/schema.sql` bevat de tabelstructuur, zodat de opbouw ook zonder
dashboard-toegang reproduceerbaar is. Let op de kop van dat bestand: het is
gereconstrueerd uit de repository en niet uit de live database gedumpt.
Vervang het door de `schema.sql` uit het eerste geslaagde backup-artifact.

Een leeg project opbouwen gaat in deze volgorde:

1. `supabase/schema.sql` — tabellen
2. `supabase/sql/rls-policies.sql` — RLS-policies, grants en functies
3. `supabase/migrations/*.sql` — op volgorde van bestandsnaam

Gebruikers zet je daarna niet met SQL in de database, maar via
**/admin.html** (Goedkeuren of Gebruiker toevoegen). Alleen die weg maakt
naast de rij in `gebruikers` ook het Supabase-account aan waar de inloglink
aan hangt; zie `BEHEERDERS.md`, paragraaf 6.

## Repository-secrets (Settings → Secrets and variables → Actions)

| Naam | Waarvoor | Waar te vinden |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | workflows "Supabase backup", "Toegang herstellen" en "Live controle" | Project Settings → API → `service_role` |
| `SUPABASE_DB_URL` | alleen nog voor "Supabase migratie" en "Toegang diagnose" | Project Settings → Database → Connection string, variant **Session pooler**, URI. De gebruikersnaam moet `postgres.pmnquozexgxhpbpuergj` zijn, niet `postgres` |
| `SUPABASE_ACCESS_TOKEN` | workflow "Edge Functions deployen" | Supabase-dashboard → Account → Access Tokens |

Elke workflow stopt meteen met een duidelijke melding als zijn secret
ontbreekt. De backup leunt bewust alleen op `SUPABASE_SERVICE_ROLE_KEY`;
zonder `SUPABASE_DB_URL` blijft hij gewoon draaien.

## Indexering

De pagina staat op `noindex, nofollow` zodat hij niet via Google vindbaar wordt. Deelbaar alleen via directe URL.

## Eigenaarschap

Opgesteld namens gasverbruikende bewoners van Landgoed De Stille Wille. Mei 2026.
