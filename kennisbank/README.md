# Kennisbank — route `/kennisbank`

Een zelfstandige, statische **bewoners-voorkant** op de geborgde corpus over
Landgoed De Stille Wille. Onderwerp-gedreven en jargonvrij: een bewoner zonder
voorkennis vindt zijn weg via herkenbare onderwerpen of een zoekveld. Sluit aan
op de bestaande huisstijl (`/tokens.css` + `/components.css`) en hangt **bewust
niet** aan `dossiers.js`/`chrome.js`, zodat de bestaande site ongemoeid blijft.

## Pagina's

| Route | Rol |
|---|---|
| `index.html` + `home.js` | **Landing**: "Kies een onderwerp" — de 11 rubrieken als tegels in gewone taal + een zoekveld |
| `onderwerp.html` + `onderwerp.js` | **Onderwerp**: neutrale beschrijving + de onderliggende stukken met begrijpelijke titels. Voor "Wie is wie" ook een partijen-glossarium |
| `document.html` + `document.js` | **Stuk**: gerenderde markdown in gewone taal; herkomst (stoplicht, tags, verificatiepunten) staat subtiel ingeklapt onder "Over deze bron" |

## Data & build

| Bestand | Rol |
|---|---|
| `Inventarisatie-*.md`, `inventarisatie-*.md` | De corpusbestanden — **bron-van-waarheid, niet gewijzigd**. Dragen YAML front-matter (schema `Inventarisatie-4` §A.3) |
| `display.mjs` | De **weergavelaag**: bewonerslabels per onderwerp, begrijpelijke titel + neutrale duiding per stuk, partijen-glossarium en de onderwerp-mapping (gegrond in INDEX.md §3). Wijzigt de corpus niet |
| `build.mjs` | Voegt front-matter + `display.mjs` samen tot `corpus.json` |
| `corpus.json` | Gegenereerde manifest die de pagina's inlezen |
| `vendor/marked.min.js` | Lokaal gevendorde markdown-renderer (geen CDN) |
| `_seed-frontmatter.mjs` | Eenmalige seeding van de front-matter (provenance) |

### Werkwijze bij een wijziging

1. Inhoud bijwerken? Pas het `.md`-bestand aan (bron-van-waarheid).
2. Weergave bijwerken (bewonerslabel, begrijpelijke titel, duiding, onderwerp-
   koppeling)? Pas `display.mjs` aan — **de corpusbestanden blijven ongemoeid**.
3. Draai `node build.mjs` → `corpus.json` wordt herschreven. Commit het mee.

Geen build-stap in Vercel nodig: `corpus.json` is een gecommit artefact en de
pagina's zijn plat statisch.

## Twee lagen, bewust gescheiden

- **Bewoners-voorkant** (zichtbaar): onderwerpen, begrijpelijke titels, neutrale
  duiding. Geen redactioneel stoplicht of productie-tags in het eerste beeld.
- **Redactie-/agentlaag** (in de data): het betrouwbaarheids-stoplicht
  (GROEN/GEEL/ORANJE), `tags`, `kernonderwerpen` en `verificatiepunten` blijven
  volledig in `corpus.json`. Op de detailpagina staat het stoplicht hooguit
  subtiel onder "Over deze bron".

## Aansluiting voor de latere vraag-antwoord-agent (nog niet gebouwd)

- `corpus.json` is een platte, machineleesbare index (incl. weergavelaag én de
  redactionele weegvelden) — direct bruikbaar als retrieval-bron.
- De zoeklaag is losgekoppeld van de weergave: `window.SW_KENNISBANK.zoek(term)`
  op de landing kan worden vervangen door een semantische zoek-/agentlaag.
- Hooks: `window.SW_KENNISBANK` (landing), `window.SW_KENNISBANK_ONDERWERP`
  (onderwerp), `window.SW_KENNISBANK_DOC` (stuk). Diep-links via `?q=` en
  `?onderwerp=`.
