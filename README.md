# gasdossier-stillewille

Statische landingspagina met downloadbare documenten over de gasnaheffing 2024-2025 op Landgoed De Stille Wille.

## Structuur

```
/
├── index.html                              # de pagina zelf
├── Dossier_V2.2.docx                       # juridisch dossier
├── Bezwaarbrief_Template_Bewoners.docx     # invulbare voorbeeldbrief
└── README.md                               # dit bestand
```

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
exporteert de database met de Supabase CLI naar drie bestanden:
`schema.sql`, `data.sql` en `roles.sql`, inclusief het `auth`-schema met de
accounts. Het resultaat komt als **workflow-artifact** onder de run te staan
en blijft **90 dagen** bewaard.

> Het artifact bevat persoonsgegevens (e-mailadressen van bewoners). Alleen
> wie toegang heeft tot deze repository kan het downloaden. Bewaar een
> gedownloade kopie navenant.

### Het benodigde secret: `SUPABASE_DB_URL`

Zonder dit secret stopt de workflow meteen met een duidelijke melding.

Waar Anton de waarde haalt:

1. Open het **Supabase-dashboard** → project `pmnquozexgxhpbpuergj`.
2. Ga naar **Project Settings** → **Database** → **Connection string**.
3. Kies de **URI**-variant en vul het database-wachtwoord in op de plek van
   `[YOUR-PASSWORD]`. Wachtwoord kwijt? Op dezelfde pagina staat
   **Reset database password**.
4. Zet die volledige `postgresql://…`-string in GitHub: repository →
   **Settings** → **Secrets and variables** → **Actions** → **New repository
   secret**, naam exact `SUPABASE_DB_URL`.
5. Draai daarna één keer **Run workflow** om te controleren dat het werkt.

### Schema in de repository

`supabase/schema.sql` bevat de tabelstructuur, zodat de opbouw ook zonder
dashboard-toegang reproduceerbaar is. Let op de kop van dat bestand: het is
gereconstrueerd uit de repository en niet uit de live database gedumpt.
Vervang het door de `schema.sql` uit het eerste geslaagde backup-artifact.

Een leeg project opbouwen gaat in deze volgorde:

1. `supabase/schema.sql` — tabellen
2. `supabase/sql/rls-policies.sql` — RLS-policies, grants en functies
3. `supabase/sql/bulk-authoriseer.sql` — optioneel, eigen adressenlijst

## Indexering

De pagina staat op `noindex, nofollow` zodat hij niet via Google vindbaar wordt. Deelbaar alleen via directe URL.

## Eigenaarschap

Opgesteld namens gasverbruikende bewoners van Landgoed De Stille Wille. Mei 2026.
