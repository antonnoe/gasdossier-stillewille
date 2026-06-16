# Kennisbank — route `/kennisbank`

Een zelfstandige, statische contentlaag die de geborgde corpus over Landgoed
De Stille Wille ontsluit. Sluit aan op de bestaande huisstijl (`/tokens.css` +
`/components.css`) en hangt **bewust niet** aan `dossiers.js`/`chrome.js`, zodat
de bestaande site ongemoeid blijft.

## Wat hier staat

| Bestand | Rol |
|---|---|
| `INDEX.md` | Master-index over de corpus (toegangspunt, mens + agent) |
| `Inventarisatie-*.md`, `inventarisatie-*.md` | De getagde corpusbestanden — elk met **YAML front-matter** volgens het schema in `Inventarisatie-4-...` §A.3 |
| `corpus.json` | Gegenereerde manifest (door `build.mjs`) — de overzichtspagina leest deze in |
| `index.html` + `kennisbank.js` | Overzichtspagina: filterbaar op rubriek, partij en betrouwbaarheid |
| `document.html` + `document.js` | Detailpagina per document: gerenderde markdown + metadata, kernonderwerpen en verificatiepunten |
| `kennisbank.css` | Component-CSS bovenop de design-tokens |
| `vendor/marked.min.js` | Lokaal gevendorde markdown-renderer (geen CDN-afhankelijkheid) |
| `build.mjs` | Manifestgenerator: leest de front-matter → `corpus.json` |
| `_seed-frontmatter.mjs` | Eenmalige seeding van de front-matter (provenance/documentatie) |

## Werkwijze bij een wijziging

1. Pas een corpusbestand aan (of voeg er één toe **met** front-matter volgens
   het schema).
2. Draai `node build.mjs` in deze map → `corpus.json` wordt herschreven.
3. Commit zowel het `.md`-bestand als `corpus.json`.

Geen build-stap in Vercel nodig: `corpus.json` is een gecommit artefact en de
pagina's zijn plat statisch.

## Het schema (kort)

Front-matter per document (zie `Inventarisatie-4-...` §A.3 voor het volledige
sjabloon en de waardenlijsten):

- `rubriek_primair` / `rubriek_secundair` — uit de 11 hoofdrubrieken (§A.1)
- `partij` — LSW · SWB · SWW · Bewonersraad · Klankbordgroep · gemeente · bewonersgroep · derde
- `betrouwbaarheid` — **GROEN** (primair/officieel) · **GEEL** (afgeleid/standpunt) · **ORANJE** (onbevestigd/ruis)
- `brontype`, `status`, `datum`, `bron`, `bron_url`, `tags`, `kernonderwerpen`, `verificatiepunten`

## Aansluiting voor een latere zoeklaag + AI-agent

De laag is hier al op voorbereid; de zoek-/agentlaag zelf is **nog niet** gebouwd:

- **`corpus.json`** is een platte, machineleesbare index (metadata + excerpt per
  document) — direct bruikbaar als retrieval-bron of om in een index te laden.
- De **filterstaat staat in de URL** (`?rubriek=…&partij=…&betrouwbaarheid=…&q=…`),
  dus een agent kan een gefilterde view samenstellen en delen.
- `kennisbank.js` scheidt de **filterlaag** (`applyFilters()`) van de renderlaag,
  en exposeert `window.SW_KENNISBANK` (manifest + actieve staat + resultaten).
  De detailpagina exposeert `window.SW_KENNISBANK_DOC`. Dit zijn de hooks waarop
  een zoek-/agentlaag kan worden aangesloten zonder de UI te herschrijven.
