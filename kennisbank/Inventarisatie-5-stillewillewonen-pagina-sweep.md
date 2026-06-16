# Inventarisatie 5 — stillewillewonen.nl: pagina-sweep + nieuwsbrief-ontdubbeling

**Bron:** stillewillewonen.nl (live opgehaald via web_fetch, juni 2026).
**Datum bewerking:** 16 juni 2026
**Schema:** volgens het rubricering-/front-matter-schema uit *Inventarisatie 4* (blok B).
**Reikwijdte:** dit bestand rondt de inventarisatie van stillewillewonen.nl af. Fase B = resterende statische pagina's; fase C = de Actueel-nieuwsstroom; fase D = ontdubbeling van de nieuwsbrieven t.o.v. stillewille.nl (deel 6).

---

## FASE B — Resterende statische pagina's

### B.1 Inhoudelijke pagina's (uitgelezen)

```yaml
---
titel: "Commissie Natuur en Park"
bron: "stillewillewonen.nl"
bron_url: "https://stillewillewonen.nl/commissies/natuur-en-park/"
datum: "2025-02-16"
brontype: "webpagina"
partij: ["SWW"]
rubriek_primair: "Natuur, bomen & groen"
rubriek_secundair: ["Wegen & infrastructuur", "Gas & energie", "Water & riolering"]
status: "definitief"
betrouwbaarheid: "GROEN"
tags: ["commissie", "ecologie", "infrastructuur", "groenplan", "beeldkwaliteitsplan"]
kernonderwerpen:
  - "Taken: ecologievisie (bos/bermen/woonomgeving); technische infra (wegen, verlichting, water, gas, riool); dossiers toetsen; input aan SWB"
  - "Documenten: Beeldkwaliteitsplan, Groenplan (HAS)"
  - "Vier werkgroepen: Infrastructuur, Ecologie, Bos en Vijver, Zonne-energie"
verificatiepunten: []
---
```
*Inhoud bevestigt de eerdere inventarisatie; geen nieuwe dossierfeiten.*

```yaml
---
titel: "Boskiosk"
bron: "stillewillewonen.nl"
bron_url: "https://stillewillewonen.nl/commissies/boskiosk/"
datum: "2025-02-16"
brontype: "webpagina"
partij: ["SWW"]
rubriek_primair: "Recreatie & voorzieningen"
rubriek_secundair: ["Stakeholders & organisatie"]
status: "definitief"
betrouwbaarheid: "GROEN"
tags: ["boskiosk", "ontmoetingsplek", "sociaal", "activiteiten"]
kernonderwerpen:
  - "Ontmoetingsplek voor/door bewoners ('warme woonkamer'); informatief, constructief, creatief, verbindend"
  - "Programma per kwartaal (bv. 'boskiosk 2024-4', PDF); aanmelden via info@stillewillewonen.nl"
verificatiepunten: []
---
```

```yaml
---
titel: "Veel gestelde vragen (lidmaatschap)"
bron: "stillewillewonen.nl"
bron_url: "https://stillewillewonen.nl/vereniging/veel-gestelde-vragen/"
datum: "2023-12-13"
brontype: "webpagina"
partij: ["SWW"]
rubriek_primair: "Stakeholders & organisatie"
rubriek_secundair: []
status: "definitief"
betrouwbaarheid: "GROEN"
tags: ["lidmaatschap", "contributie", "documenten-landgoed"]
kernonderwerpen:
  - "Lid worden via formulier + €20; op elk moment opzegbaar zonder opgaaf van reden"
  - "Lid kunnen worden: eigenaren/erfpachters met woning op het landgoed + hun partners"
verificatiepunten: []
---
```

```yaml
---
titel: "SWW van start"
bron: "stillewillewonen.nl"
bron_url: "https://stillewillewonen.nl/vereniging/sww-van-start/"
datum: "2023-10-22"
brontype: "webpagina"
partij: ["SWW"]
rubriek_primair: "Governance & besluitvorming"
rubriek_secundair: ["Stakeholders & organisatie"]
status: "definitief"
betrouwbaarheid: "GROEN"
tags: ["oprichting", "statuten", "huishoudelijk-reglement", "commissies"]
kernonderwerpen:
  - "Na oprichtingsvergadering 26-05-2023: statuten gepasseerd, HR aangepast, ingeschreven, Rabobank-rekening geopend"
  - "Taakverdeling bestuur; vijf commissies-in-wording gepresenteerd op 1 juli 2023"
verificatiepunten: []
---
```

```yaml
---
titel: "Werkgroep Ecologie — seizoensnieuwsbrief"
bron: "stillewillewonen.nl"
bron_url: "https://stillewillewonen.nl/commissies/natuur-en-park/werkgroep-ecologie/"
auteur: "Koos van Kampen / redactie Lilian Suyskens"
datum: "2024-08-29"
brontype: "nieuwsbrief"
partij: ["SWW"]
rubriek_primair: "Natuur, bomen & groen"
rubriek_secundair: []
status: "definitief"
betrouwbaarheid: "GEEL"
tags: ["werkgroep-ecologie", "seizoensnieuwsbrief", "tuin", "natuurwandeling"]
kernonderwerpen:
  - "De 'werkgroep'-subpagina is feitelijk een nieuwsbericht, geen standaardpagina"
  - "Linkt naar Seizoensnieuwsbrief nr. 1 (sept. 2024, PDF): bollenactie, herfsttips, natuurwandeling"
verificatiepunten: []
---
```

### B.2 Boilerplate / doorverwijspagina's (op metaniveau geborgd)

Deze pagina's bevatten geen zelfstandige dossierinhoud; de unieke informatie staat al elders (homepage, FAQ) of het betreft een doorverwijzing naar een PDF/besloten kanaal. Geborgd als referentie:

| Pagina | URL | Aard / inhoud | Rubriek |
|---|---|---|---|
| Privacyverklaring SWW | `/privacyverklaring-stille-wille-wonen/` | wettelijke privacyverklaring (boilerplate) | Stakeholders & organisatie |
| Contact | `/contact/` | contactformulier; info@stillewillewonen.nl | Stakeholders & organisatie |
| Lid worden | `/lid-worden/` | aanmeldformulier + €20 (zie FAQ) | Stakeholders & organisatie |
| Colofon | `/colofon/` | colofon (boilerplate) | Communicatie & nieuwsbrieven |
| Werk mee aan onze website | `/werk-mee-aan-onze-website/` | oproep foto's/berichten → communicatie@stillewillewonen.nl | Communicatie & nieuwsbrieven |
| Forum-introductie | `/forum-introductie/` | intro besloten bbPress-forum (forum zelf buiten bereik) | Communicatie & nieuwsbrieven |
| Werkgroep Bos en Vijver | `/werkgroep-bos-en-vijver/` | nieuws/doorverwijzing; Plan van Aanpak-PDF reeds in archief | Natuur, bomen & groen |
| Werkgroep Zonne-energie | `/werkgroep-zonne-energie/` | nieuws/doorverwijzing; zonnepark-verslagen reeds in archief | Gas & energie |
| Feestcommissie | onder `/commissies/sociaal/` | werkgroep Sociaal (zomerfeest, nieuwjaarsborrel) | Recreatie & voorzieningen |
| Agenda | `/vereniging/agenda/` | ingesloten Google-agenda (geen tekstinhoud) | Communicatie & nieuwsbrieven |

> **Structuurnoot (homepage):** de voorpagina bevestigt de "Wat vind ik waar?"-driedeling — **stillewillewonen.nl** (openbaar, bewoners), **Facebook-groep livingtogether** (besloten, dagelijks), **stillewille.nl** (LSW/SWB). Dit is exact de scheiding die in de borging relevant is: het bewonersperspectief staat op de SWW-site, die in stillewille.nl wordt opgenomen.

---

## FASE C — Actueel-nieuwsstroom

### C.1 Dossierrelevante berichten (uitgelezen)

```yaml
---
titel: "Klankbordgroep stelt zich voor"
bron: "stillewillewonen.nl"
bron_url: "https://stillewillewonen.nl/2025/11/klankbord-groep-stelt-zich-voor/"
auteur: "Ruud Rademaker"
datum: "2025-11-19"
brontype: "standpunt/opinie"
partij: ["bewonersgroep", "Klankbordgroep"]
rubriek_primair: "Stakeholders & organisatie"
rubriek_secundair: ["Governance & besluitvorming"]
status: "definitief"
betrouwbaarheid: "GROEN"
tags: ["klankbordgroep", "toekomst-landgoed", "exploitatievereniging", "inspraak", "ALV-2025-11-20"]
kernonderwerpen:
  - "Onafhankelijke groep bewoners (grondeigenaren én pachters, leden én niet-leden), presenteert zich op de ALV van 20-11-2025"
  - "Drie focuspunten: eerlijke/toekomstbestendige exploitatie; behoud + versterking van materiële en immateriële waarde; prettige leefomgeving"
  - "Leden o.a.: Sander van Kesteren, Ivo Diepstraten, Hugo van Daal (PDF mogelijk meer leden); contact klankbordgroepsw@kpnmail.nl"
  - "Werkwijze: groepsbijeenkomsten met ruimte voor ieders inbreng; ook individueel benaderbaar"
verificatiepunten:
  - "Volledige ledenlijst Klankbordgroep (PDF was afgekapt) — aanvullen indien gewenst"
  - "Sander van Kesteren is óók SWW-vertegenwoordiger (BR 06-01-2026, deel 2b) — overlap stakeholders"
---
```

**Dossierwaarde.** De Klankbordgroep is de **constructieve tegenhanger** van de kritische "Adviesgroep onderzoek Toekomst Landgoed" (Risico's-notitie, Koos van Kampen): twee onafhankelijke bewonersgroepen met een verschillende houding tegenover het EV-/Toekomst-voorstel. Samen tekenen ze het stakeholderveld rond de exploitatievereniging.

```yaml
---
titel: "Nieuwsflits van SWW en SWB"
bron: "stillewillewonen.nl"
bron_url: "https://stillewillewonen.nl/2025/10/nieuwsflits-van-sww-en-swb/"
auteur: "Ruud Rademaker"
datum: "2025-10-10"
brontype: "nieuwsbrief"
partij: ["SWW", "SWB"]
rubriek_primair: "Communicatie & nieuwsbrieven"
rubriek_secundair: ["Governance & besluitvorming"]
status: "definitief"
betrouwbaarheid: "GROEN"
tags: ["gezamenlijke-communicatie", "SWW-SWB", "convergentie"]
kernonderwerpen:
  - "SWW en SWB gaan voortaan gezamenlijk communiceren; de flits wordt voortaan door SWB verstuurd"
  - "Vroege markering van de samenvoeging van de communicatiekanalen (volledige flits op /nieuwsflits_swwswb_001)"
verificatiepunten: []
---
```

**Dossierwaarde.** Dit bericht (okt 2025) markeert de **start van de gezamenlijke SWW-SWB-communicatie** — precies de convergentie die het borgen van de zelfstandige SWW-site urgent maakt.

### C.2 Geïndexeerde lijst — recente berichten (Actueel, pagina 1)

Operationeel/aankondigend van aard, geen zelfstandige dossierwaarde; geborgd als index (datum · titel · URL):

| Datum | Titel | URL |
|---|---|---|
| 22-04-2026 | Houtpellets bestellen voor de winter | `/2026/04/houtpellets-bestellen-voor-de-winter/` |
| 10-04-2026 | Informatie isoleren & (ver)bouwen (11 apr) | `/2026/04/zaterdag-11-april-1000-1400-informatie-isoleren-verbouwen/` |
| 14-01-2026 | Stille Wille SPRINGt open! | `/2026/01/stille-wille-springt-open/` |
| 11-12-2025 | Oliebollen bestellen | `/2025/12/oliebollen-bestellen-3/` |
| 03-12-2025 | Make it to Christmas | `/2025/12/make-it-to-christmas/` |
| 21-11-2025 | Klankbordgroep start: zij zoeken nieuwe leden | `/2025/11/klankbord-groep-start-zij-zoeken-nieuwe-leden/` |
| 31-10-2025 | Save the date | `/2025/10/save-the-date/` |
| 26-10-2025 | Energiecafé oktober 2025 | `/2025/10/energiecafe-oktober-2025/` |

> De volledige Actueel-stroom telt **12 archiefpagina's** (`/vereniging/actueel/page/2/` t/m `/page/12/`), met overwegend operationele/evenementberichten uit 2023–2025; gekarakteriseerd in de eerdere inventarisatie (Inventarisatie 1, §4). Een volledige uitlezing per ouder bericht is optioneel (zie afsluiting).

---

## FASE D — Nieuwsbrief-ontdubbeling (SWW-archief ↔ stillewille.nl)

**Methode:** vergelijking op **periode + redactie + bestandsnaam** van de SWW-nieuwsbrievenrubriek (28 edities, mei 2023 – apr 2025; Inventarisatie 1, §3.5) met de stillewille.nl-edities (12 edities, mrt 2025 – mei 2026; deel 6). De **communicatie-omslag** is hierbij de sleutel: t/m april 2025 maakt de **SWW-redactie** de nieuwsbrieven (primair op stillewillewonen.nl); vanaf augustus 2025 schrijft **Wil van Loon (SWB)** ze (primair op stillewille.nl).

| Segment | Periode | Aantal | Primaire host | Dubbel? |
|---|---|---|---|---|
| **SWW-redactie-serie** (incl. Specials/extra's) | mei 2023 – feb 2025 | ~26 | stillewillewonen.nl | **Uniek** — niet op stillewille.nl (die begint pas mrt 2025) |
| Overlapzone | mrt–apr 2025 | 2 | beide | **Waarschijnlijk dubbel**: "Toekomst Landgoed"-extra (mrt 2025) en Paasnieuwsbrief (apr 2025) — SWW-redactie-edities die óók in deel 6 staan |
| **Wil-van-Loon/SWB-serie** | aug 2025 – mei 2026 | 8–9 | stillewille.nl | Reeds gedekt in **deel 6**; niet in SWW-archief (dat eindigt apr 2025) |

**Conclusie (betrouwbaarheid GEEL — metaniveau, inhoud nog niet per editie vergeleken):**

- De **volledige SWW-redactie-nieuwsbrievenserie (mei 2023 – apr 2025)** is **uniek bewonerscontent** dat **niet** op stillewille.nl staat → **hoogste borgingsprioriteit**. Het betreft o.a.: 2023 (mei t/m dec), 2024 (feb/mrt/mei/sep/nov/dec + Specials: Rianne IJpelaar, Sinterklaas, en de "extra's" over Enexis, renovatie tennisbanen en recreatiegebied), 2025 (feb, apr).
- De **overlap is minimaal** (vermoedelijk 2 edities, mrt + apr 2025).
- De **Wil-van-Loon-edities zijn al geborgd** in deel 6.

> **Aanbeveling:** voor volledige borging de ~26 unieke SWW-nieuwsbrief-PDF's (uit `/archief/nieuwsbrieven/`) nog inhoudelijk uitlezen en taggen. Dit is een aparte, omvangrijke deelstap; nu als prioriteit gemarkeerd, niet uitgevoerd.

---

## Afsluiting — dekkingsstatus stillewillewonen.nl

**Volledig verwerkt:** sitestructuur (homepage + menu's, exacte URL's), alle commissie-/verenigingspagina's, de dossierkritische Toekomst-stukken (Risico's — zie Inventarisatie 4; Klankbordgroep), de gezamenlijke SWW-SWB-communicatie, de statische pagina's (inhoudelijk of op metaniveau), en de recente Actueel-stroom.

**Bewust niet uitgelezen (buiten bereik / besloten):** het besloten Forum (bbPress) en de besloten Facebook-groep livingtogether.

**Optionele verdieping (afzonderlijke, omvangrijke stappen — niet uitgevoerd):**
1. De ~26 **unieke SWW-nieuwsbrief-PDF's** (mei 2023 – apr 2025) inhoudelijk uitlezen en taggen — hoogste borgingsprioriteit.
2. De oudere **Actueel-berichten** (pagina's 2–12, 2023–2025) per stuk uitlezen — lage dossierwaarde.
3. **Mensen op de Stille Wille** (11 bewonersinterviews) — lage dossierwaarde.
4. De **Klankbordgroep-ledenlijst** compleet maken (de PDF was afgekapt).

Met deze afsluiting is het inhoudelijke dossier van **beide** Stille Wille-sites geborgd; resteren uitsluitend bovenstaande optionele verdiepingen en het reeds bekende, niet-toegankelijke besloten materiaal.
