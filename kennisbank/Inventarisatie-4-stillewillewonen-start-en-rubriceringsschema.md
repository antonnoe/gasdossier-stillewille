# Inventarisatie 4 — stillewillewonen.nl (start) + rubriceringsschema

**Bron:** stillewillewonen.nl (live opgehaald via web_fetch, juni 2026).
**Datum bewerking:** 16 juni 2026
**Status site:** **nog live** (laatste sitewijziging 3 juni 2025; footer © 2026). De borgingswindow staat dus nog open — relevant, want de site wordt op termijn in stillewille.nl opgenomen.
**Doel van dit bestand:** (1) het rubricering-/tagschema vastleggen dat de doorzoekbare omgeving en de Haiku-agent voedt (blok B), en (2) de eerste getagde entry opleveren als werkend voorbeeld. De rest van de pagina-sweep (blok A) volgt zodra het schema akkoord is.

---

## A. Rubriceringsschema (voorstel blok B)

### A.1 Hoofdrubrieken (één per document als *primair*, meerdere als *secundair* toegestaan)

1. Governance & besluitvorming
2. Financiën & fondsen
3. Gas & energie
4. Natuur, bomen & groen
5. Water & riolering
6. Wegen & infrastructuur
7. Regels & handhaving
8. Recreatie & voorzieningen
9. Wonen & bestemmingsplan
10. Communicatie & nieuwsbrieven
11. Stakeholders & organisatie

### A.2 Facetten (vaste waardenlijsten)

- **brontype:** overeenkomst · statuten · reglement · notulen · begroting · jaarrekening · nieuwsbrief · enquête · bestemmingsplan · brief · standpunt/opinie · webpagina · kaart/beeld
- **partij:** LSW · SWB · SWW · Bewonersraad · Klankbordgroep · gemeente · bewonersgroep · derde
- **status:** definitief · concept · scan
- **betrouwbaarheid (verkeerslicht):**
  - **GROEN** = primaire/officiële bron (wettekst, notariële akte, .gouv-/KvK-gegeven, ondertekend contract, vastgestelde notulen);
  - **GEEL** = afgeleid/toelichtend of standpunt (samenvatting, opinie, concept met verifieerbare claims);
  - **ORANJE** = onbevestigd/ruis (matige OCR, losse bewering, niet te herleiden bron).

### A.3 Front-matter-sjabloon (YAML, per markdown-bestand)

```yaml
---
titel: ""
bron: "stillewillewonen.nl"        # of stillewille.nl
bron_url: ""
bestandsnaam: ""                   # indien PDF/docx
auteur: ""                         # indien vermeld
datum: ""                          # YYYY-MM-DD of periode
brontype: ""                       # uit A.2
partij: []                         # uit A.2 (mag meerdere)
rubriek_primair: ""                # uit A.1
rubriek_secundair: []              # uit A.1
status: ""                         # definitief | concept | scan
betrouwbaarheid: ""                # GROEN | GEEL | ORANJE
tags: []                           # vrije, consistente trefwoorden
kernonderwerpen: []                # 3–6 bullets, voor agent-retrieval
verificatiepunten: []              # openstaande checks tegen primaire bron
---
```

> De agent kan hiermee filteren (rubriek/partij/periode/betrouwbaarheid), citeren (bron_url + datum) en per onderwerp rapporteren met de openstaande verificatiepunten erbij — in de feitelijke, niet-beschuldigende huisstijl.

---

## B. Eerste getagde entry (werkend voorbeeld)

### B.1 "Risico's nieuwe vereniging van perceeleigenaren"

```yaml
---
titel: "Risico's nieuwe vereniging van perceeleigenaren"
bron: "stillewillewonen.nl"
bron_url: "https://stillewillewonen.nl/2025/06/risicos-nieuwe-vereniging-van-perceeleigenaren/"
auteur: "Koos van Kampen — Adviesgroep onderzoek Toekomst Landgoed"
datum: "2025-06-03"
brontype: "standpunt/opinie"
partij: ["bewonersgroep"]
rubriek_primair: "Governance & besluitvorming"
rubriek_secundair: ["Financiën & fondsen", "Wonen & bestemmingsplan"]
status: "definitief"
betrouwbaarheid: "GEEL"
tags: ["exploitatievereniging", "EV", "erfpacht", "perceeleigenaren", "sociaal-plan-2028", "juridische-procedure", "adviesrecht", "polarisatie", "taxatie-landgoed"]
kernonderwerpen:
  - "Kritische tegenpositie op het CTL-voorstel (BV SWB → vereniging voor uitsluitend perceeleigenaren)"
  - "Veelheid aan verschillende exploitatieovereenkomsten (DJB vs. LSW) als 'drijfzand'"
  - "Lange-termijndoel LSW: verkoop landgoed aan een perceeleigenaren-vereniging"
  - "Juridische procedure rond erfpacht en het 'sociaal plan 2028'"
  - "Risico op polarisatie erfpachters vs. perceeleigenaren"
verificatiepunten:
  - "Erfpachtinkomsten LSW '~€900.000/jaar (geïndexeerd)' — bewering, primair te verifiëren"
  - "'Sociaal plan 2028' en uitsluiting van procederende bewoners — te verifiëren tegen LSW-communicatie/processtukken"
  - "Rechtbank-/gerechtshofuitspraken 2013/2014 — opzoeken op rechtspraak.nl (zie kruisverwijzing ALV 07-06-2024)"
---
```

**Samenvatting (geparafraseerd, feitelijk).** Een adviesgroep van bezorgde bewoners (contactpersoon Koos van Kampen) zet de risico's van het CTL-voorstel naast de kansen. Kernpunten:

- **Versnipperde contracten.** Sinds begin jaren 2000 bestaan veel verschillende exploitatieovereenkomsten; tussen de oude eigenaar (DJB) en LSW zitten grote verschillen. LSW nam ná 2021 in de overeenkomst op dat de Bewonersraad slechts **adviesrecht** over de exploitatiekosten heeft; daartegen is destijds in de Bewonersraad geprotesteerd, zonder resultaat. De groep acht de verschillen mogelijk juridisch niet houdbaar en bepleit **één overeenkomst voor alle bewoners** met echte medezeggenschap.
- **Verkoopdoel LSW.** Volgens de groep is erfpacht voor LSW een uitsterfconstructie en is het einddoel **overdracht/verkoop van het landgoed aan een vereniging van perceeleigenaren** op basis van een nieuwe taxatie. Genoemd worden de erfenis van achterstallig onderhoud (gas, water, riool, sloten, wegen, zwembad) en de vraag of er onder perceeleigenaren überhaupt behoefte is aan zo'n koop.
- **Erfpachtinkomsten.** De groep noemt LSW-erfpachtinkomsten van **~€900.000/jaar (geïndexeerd)** — als bewering opgenomen, primair te verifiëren.
- **Juridische procedure.** Na de overname trok LSW (zonder overgangstermijn) het DJB-aanbod in om tijdelijke erfpacht (tot eind 2028) om te zetten naar eeuwigdurend; een groep bewoners procedeert hierover. De groep stelt dat LSW procederende bewoners **uitsluit van het 'sociaal plan 2028'** (keuze tussen verkoop aan LSW of aankoop van de grond).
- **Polarisatie.** Zorg dat een vereniging voor uitsluitend perceeleigenaren oude tweedeling (erfpachters vs. eigenaren) heropent. Pleidooi voor kleine, gedragen stappen ("beter ten halve gekeerd…").

**Dossierwaarde.** Dit is de scherpste gedocumenteerde **tegenpositie** in het EV-/governancedossier en introduceert drie nieuwe sporen die in de eerdere delen ontbraken: het **~€900k erfpacht**-cijfer, het **'sociaal plan 2028'** met uitsluiting van procederende bewoners, en — samen met het ALV-verslag 07-06-2024 — de **rechterlijke uitspraken uit 2013/2014**. Twee onafhankelijke vermeldingen van die procedures maken het een harde lead voor verificatie op rechtspraak.nl.

> Bevat een tijdlijn-afbeelding van alle exploitatieovereenkomsten (`Afbeelding1.png`) — beeldmateriaal, nog niet als tekst ontsloten.

### B.2 Korte aanvullingen uit deze ronde

- **Commissie Natuur en Park** (`/commissies/natuur-en-park/`, gewijzigd 16-02-2025): taken (ecologievisie; technische infra wegen/verlichting/water/gas/riool; dossiers toetsen; input aan SWB), documenten (Beeldkwaliteitsplan, Groenplan), vier werkgroepen. Inhoudelijk reeds gedekt in de eerdere inventarisatie. *Betrouwbaarheid GROEN (officiële verenigingspagina).*
- **Werkgroep-subpagina's blijken doorverwijzingen.** "Werkgroep Ecologie" leidt naar een nieuwsbericht (29-08-2024, redactie Lilian Suyskens) met een **Seizoensnieuwsbrief nr. 1 (sept. 2024, PDF)**. De werkgroepen hebben dus geen zelfstandige inhoudspagina maar nieuws + losse PDF's — lage dossierprioriteit, wel mee te nemen voor volledige borging.

---

## C. Resterende scope op stillewillewonen.nl + gefaseerd plan

**Nog te sweepen (exacte lijst):**

- **Vereniging:** Veel gestelde vragen · SWW van start (volledige tekst) · Privacyverklaring SWW
- **Commissies/werkgroepen:** Boskiosk · Feestcommissie · Werkgroep Bos en Vijver · Werkgroep Zonne-energie · Werkgroep Ecologie (nieuws + seizoensnieuwsbrief-PDF) — overwegend dun/nieuwsdoorverwijzingen
- **Statisch/admin:** Contact · Lid worden · Colofon · Werk mee aan onze website · Forum-introductie (forum zelf besloten → buiten bereik)
- **Vereniging › Actueel:** de volledige nieuwsstroom (12 archiefpagina's, ~10 berichten elk)
- **Nieuwsbrief-ontdubbeling:** 28 SWW-nieuwsbrieven (mei '23 – apr '25) tegen de 12 stillewille.nl-edities (deel 6), op datum + bestandsnaam + inhoud
- **Mensen op de Stille Wille:** 11 bewonersinterviews (lage dossierwaarde)

**Voorgestelde fasering:**

- **Fase A (deze ronde):** structuur + governance/Toekomst-kern (Risico's) + schema — *hier.*
- **Fase B:** resterende statische pagina's (Vereniging, commissies, admin) — tag-klaar.
- **Fase C:** Actueel-nieuwsstroom — *default: dossier-relevante berichten volledig uitlezen, de rest als geïndexeerde lijst (datum + titel + URL)*. Zeg het als je álles volledig wilt.
- **Fase D:** nieuwsbrief-ontdubbeling.

Resultaat: per onderwerp gegroepeerde, getagde markdown — direct bruikbaar voor de doorzoekbare omgeving en de Haiku-agent.
