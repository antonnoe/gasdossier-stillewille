---
titel: "Site-inventarisatie — www.stillewille.nl (LSW/SWB)"
bron: "stillewille.nl"
bron_url: "https://www.stillewille.nl/"
bestandsnaam: ""
auteur: ""
datum: "2026-06-16"
brontype: "webpagina"
partij:
  - "LSW"
  - "SWB"
rubriek_primair: "Stakeholders & organisatie"
rubriek_secundair:
  - "Communicatie & nieuwsbrieven"
  - "Governance & besluitvorming"
status: "definitief"
betrouwbaarheid: "GEEL"
tags:
  - "site-inventarisatie"
  - "Joomla"
  - "YOOtheme"
  - "structuur"
  - "documenten"
kernonderwerpen:
  - "Structuur + documenten/verslagen/nieuwsbrieven-lijsten van de officiële landgoedsite"
  - "Technisch profiel: Joomla + YOOtheme Pro; generator-meta geobfusceerd"
  - "Niet gedekt: alles achter de login (incl. aangekondigde \"Mijn SW\"-omgeving)"
verificatiepunten:
  - "Mogelijke toegankelijke directory-index op /images/bestanden/documenten/ — te verifiëren"
---
# Inventarisatie — www.stillewille.nl

**Datum inventarisatie:** 16 juni 2026
**Scope:** volledig publiek toegankelijke deel van de officiële landgoedsite
**Methode:** handmatige crawl via hoofdmenu, Info & Archief en het archief; dieper liggende subpagina's nagelopen
**Niet gedekt:** alles achter de login (`/inloggen`), waaronder de eigenaars-/bewonerspagina en de aangekondigde "Mijn SW"-omgeving (was op de crawldatum niet live)

> Let op het onderscheid tussen drie verschillende sites die in dit dossier voorkomen:
> - **www.stillewille.nl** — deze site; officieel, beheerd door exploitant SWB / eigenaar LSW
> - **stillewillewonen.nl** — site van de bewonersvereniging SWW (wordt sinds jan. '26 geïntegreerd in stillewille.nl)
> - **kerndossiers-stillewille.vercel.app** — eigen dossiersite (Communities Abroad)

---

## 1. Technisch profiel

| Aspect | Bevinding |
|---|---|
| CMS | Joomla (afgeleid uit URL-patronen `?view=reset/remind`, `Itemid`/`catid`, `/component/content/article/`) |
| Template / pagebuilder | YOOtheme Pro (asset-paden `/media/yootheme/cache/…`) |
| Generator-meta | Ingesteld op **"MYOB"** — niet-standaard; Joomla zet hier normaliter "Joomla! - Open Source Content Management". Lijkt bewust geobfusceerd (security-through-obscurity). |
| Auteurs-meta | Wisselend: "Rachel Walraven" (meeste pagina's), "Peter Aerts" (Klankbordgroep) |
| Inlog | Joomla-native loginformulier op `/inloggen` (+ `?view=reset`, `?view=remind`) |
| Aangekondigd | "Mijn SW"-omgeving om zaken digitaal zelf te regelen ("vernieuwde website binnenkort online") |
| Contactformulier | Aanwezig op `/contact` met verplichte AVG-akkoordcheckbox + captcha |
| E-mailbescherming | Alle e-mailadressen via JavaScript-spambotbescherming verborgen |
| Mogelijke hygiënekwestie | In de documentenmap staat een `index.html` in de bestandslijst — duidt mogelijk op een toegankelijke directory-index op `/images/bestanden/documenten/` |

---

## 2. Organisatie & partijen (zoals de site ze presenteert)

**Stille Wille Brabant B.V. (SWB) — exploitant**
- Verantwoordelijk voor dagelijks beheer en onderhoud
- Directie: Roel Teunissen en Wil van Loon
- Team: Wil van Loon (Manager Landgoed, ma–do), Ruud van der Sanden (onderhoud, 4 dgn/wk), Moniek Hagemeier (administratie/receptie, 2 dgn/wk), Frank van Kollenburg (onderhoud, 12 u/wk)
- Adres: De Stille Wille 1, 5091 EB OWM · 013-5131722

**Landgoed De Stille Wille B.V. (LSW) — grondeigenaar**
- Bestuurder/aandeelhouder: **Oostervelden Projecten B.V.** (familiebeleggingsvennootschap; cultureel erfgoed, woningbeleggingen, projectontwikkeling)
- Directeur LSW: Faruk Kinran
- Adres: Brinkweg 3, 6991 JN Rheden · 026-3636058
- Verkoop/grondzaken via makelaar Van de Meerendonk Makelaars BV (Oirschot), Marco Vingerhoets

**Stille Wille Wonen (SWW) — bewonersvereniging**
- Opgericht 2023 uit fusie van Bestwil en VHSW; enige bewonersvereniging
- Eigen site stillewillewonen.nl — wordt geïntegreerd in stillewille.nl (voorbereiding gestart jan. '26)

**Bewonersraad — overlegorgaan**
- Overleg tussen SWB, LSW en SWW
- Frequentie: maandelijks SWB–SWW; minimaal tweemaandelijks met LSW erbij
- Vanaf maart '26 voorzitterschap bij een SWW-bestuurslid
- Behandelt o.a. exploitatiebegroting, fondsenbeheer, MJOP, projecten, zonnepark "Kattenbergsesteeg", ecologische verbindingszone (EVZ)

**Klankbordgroep — onafhankelijk, 7 bewoners**
- Leden: Monique Schippers, Sylvia Riemens, Sander van Kesteren, Ivo Diepstraten, Hugo van Daal, Marco Beks, Koos van Kampen
- Kernopdracht: bewoners raadplegen over voorgestelde overgang van huidige structuur (SWB onder LSW, bewoners adviserend) naar een **Exploitatievereniging (EV)** met medezeggenschap/stemrecht voor alle bewoners
- Heeft taken overgenomen van de opgeheven Commissie Toekomst Landgoed (CTL)

**Ad-Vi VVE Beheer B.V. (Veldhoven) — financieel beheer**
- Sinds 1 januari 2025: financiële administratie, eigenarenadministratie, incasso (exploitatie, water, gas)
- 040-2535573

**Dorpsondersteuner**
- Marjan Katuin (bewoonster), vanuit team WIJZER / LEV-groep; tweewekelijks spreekuur

---

## 3. Volledige paginastructuur (sitemap)

### Hoofdmenu

**Over Stille Wille** *(menukop zonder eigen pagina)*
- **Het landgoed** — `/over-de-stille-wille/het-landgoed` *(ouderpagina)*
  - Actueel — `/over-de-stille-wille/het-landgoed/actueel`
  - Toekomstvisie tot 2035 — `/over-de-stille-wille/het-landgoed/toekomstvisie-tot-2035`
  - Geschiedenis — `/over-de-stille-wille/het-landgoed/geschiedenis`
  - Historie grenspaal 'Beeksbergsken' — `/over-de-stille-wille/het-landgoed/grenspaal-beeksbergsken`
- Beheerder/Exploitant — `/over-de-stille-wille/beheerder-exploitant`
- (Grond) eigenaar — `/over-de-stille-wille/grond-eigenaar`
- Bewonersvereniging — `/over-de-stille-wille/bewonersvereniging`
- Bewonersraad — `/over-de-stille-wille/bewonersraad`
- Klankbordgroep — `/over-de-stille-wille/klankbordgroep`
- Dorpsondersteuner — `/over-de-stille-wille/dorpsondersteuner`
- **Projecten** — `/over-de-stille-wille/projecten` *(ouderpagina, zie §3a)*
- *(extra)* Impressie / fotogalerij — `/over-de-stille-wille/impressie`

**Aanbod** — `/woningaanbod` *(woningaanbod, zie §5)*

**Wonen** *(menukop zonder eigen pagina)*
- **Faciliteiten** — `/wonen/faciliteiten` *(ouderpagina, zie §3b)*
- Omgeving — `/wonen/omgeving`
- Informatie over wonen — `/wonen/informatie-over-wonen`
- **Aanvragen & wijzigen** — `/wonen/aanvragen-wijzigen` *(ouderpagina, zie §3c)*

**Info & Archief** — `/informatie` *(documentenhub, zie §4)*
- Archief — `/informatie/archief`
- Projectarchief: Onderhoud energienet landgoed — `/informatie/projectarchief/stroomvoorziening`

**Contact** — `/contact`

### Footer / overig
- Calamiteiten — `/calamiteiten`
- Privacyverklaring — `/privacyverklaring`
- Disclaimer — `/disclaimer`
- In-/uitloggen — `/inloggen`
- Mededelingen — `/mededelingen/…` *(nieuws-/mededelingenmodule, zie §4)*

### §3a — Projecten (12 lopende projecten)
| Project | URL |
|---|---|
| Afvalinzameling | `/over-de-stille-wille/projecten/afvalinzameling` |
| Bos & Vijver "Kleine bos" | `/over-de-stille-wille/projecten/kleine-bos-en-vijver` |
| Buurthuis Stille Wille | `/over-de-stille-wille/projecten/buurthuis` |
| Energie Zelfvoorzienend (PEZ) | `/over-de-stille-wille/projecten/energie-zelfvoorzienend` |
| Gasleidingnetwerk \| Gasvoorziening | `/over-de-stille-wille/projecten/gasvoorziening` |
| Meerjarenonderhoudsplan – MJOP | `/over-de-stille-wille/projecten/mjop` |
| Moderniseren/verduurzamen Straatverlichting | `/over-de-stille-wille/projecten/straatverlichting` |
| Natuurbeheer \| Groenvisie | `/over-de-stille-wille/projecten/natuurbeheer` |
| Nieuwe entree landgoed (door LSW) | `/over-de-stille-wille/projecten/nieuw-entreegebouw-landgoed` |
| Renovatie Recreatiegebied | `/over-de-stille-wille/projecten/recreatiegebied` |
| Waterhuishouding | `/over-de-stille-wille/projecten/waterhuishouding` |
| Wegennet | `/over-de-stille-wille/projecten/wegennet` |

### §3b — Faciliteiten (10 subpagina's)
| Faciliteit | URL |
|---|---|
| Sport- en spelmogelijkheden | `/wonen/faciliteiten/sport-en-spel` |
| Recreatiegebied | `/wonen/faciliteiten/recreatiegebied` |
| Tennisbanen | `/wonen/faciliteiten/tennisbaan-mulitveld` |
| Multiveld | `/wonen/faciliteiten/multiveld` |
| Zwembad | `/wonen/faciliteiten/zwembad` |
| Jeu-de-boulesbaan | `/wonen/faciliteiten/jeu-de-boulebaan` |
| Wandelbos en Kleine Bos | `/wonen/faciliteiten/wandelbos-en-kleine-bos` |
| Afvalinzameling | `/wonen/faciliteiten/overige-faciliteiten` |
| Postservice | `/wonen/faciliteiten/pakketservice` |
| Glasvezelnetwerk (sinds 2016) | `/wonen/faciliteiten/glasvezelnetwerk` |

### §3c — Aanvragen & wijzigen (4 online formulieren)
| Formulier | URL |
|---|---|
| Slagboomdruppel/kenteken aanvragen of blokkeren | `/kenteken-en-slagboomdruppel-aanvragen-blokkeren` |
| Kapvergunning aanvragen | `/aanvragen-kapvergunning` |
| Wijziging doorgeven (e-mail/telefoon) | `/wijziging-doorgeven` |
| Meterstand doorgeven | `/meterstanden-doorgeven` |

---

## 4. Documenten & archief

De site limiteert het "actuele" aanbod (nieuwsbrieven 12, bewonersraadverslagen en mededelingen 6); ouder materiaal verschuift naar het archief.

### 4.1 Actuele documenten (`/informatie#docs`)
- [Beheerovereenkomst](https://www.stillewille.nl/images/bestanden/documenten/Beheersovereenkomst.pdf) — *loopt t/m 2028*
- [Exploitatieovereenkomst](https://www.stillewille.nl/images/bestanden/documenten/Exploitatieovereenkomst.pdf)
- [Uitleg Begroting en Fondsen – 2023](https://www.stillewille.nl/images/bestanden/documenten/20231019_Artikel_begroting_en_fondsen.pdf)
- [Verblijf- en Gebruiksreglement](https://www.stillewille.nl/images/bestanden/documenten/Gebruiksreglement_Landgoed_Stille_Wille.pdf)
- [Afvalkalender 2026](https://www.stillewille.nl/images/bestanden/documenten/Afvalkalender_SW_2026.pdf)
- [Beeldkwaliteitsplan](https://www.stillewille.nl/images/bestanden/documenten/Beeldkwaliteitsplan.pdf)
- [Brochure "Door de bomen het bos weer zien"](https://www.stillewille.nl/images/bestanden/documenten/Folder_groenvisie.pdf)
- [Groenvisie HAS](https://www.stillewille.nl/images/bestanden/documenten/Stille_Wille_Groenvisie_HAS_compressed.pdf)
- [Plattegrond met SW-nummers](https://www.stillewille.nl/images/bestanden/documenten/Kaart_met_sw_nummers.pdf)
- [Calamiteitenkaart landgoed (2025)](https://www.stillewille.nl/images/bestanden/documenten/20251009_Calamiteitenkaart_landgoed.pdf)
- [Concept inrichten Commissies (okt '25)](https://www.stillewille.nl/images/bestanden/documenten/20251113_Overzicht_Commissies_SWB.pdf)
- [Voorstellen Klankbordgroepleden](https://www.stillewille.nl/images/bestanden/documenten/20251215_Leden_van_de_klankbordgroep_stellen_zich_voor.pdf)
- [Taken & Bevoegdheden Bewonersraad (wordt herzien)](https://www.stillewille.nl/images/bestanden/documenten/Taken_en_bevoegdheden_Bewonersraad.pdf)
- [Algemeen reglement recreatieve voorzieningen](https://www.stillewille.nl/images/bestanden/documenten/Algemeen_reglement_recreatieve_voorzieningen_.pdf)
- [Brief financieel beheer Ad-Vi VVE Beheer (apr '25)](https://www.stillewille.nl/images/bestanden/documenten/Introductie_AD-Vi_VVE_Beheer.pdf)
- [Overzicht heffingen water/riool (feb '26)](https://www.stillewille.nl/images/bestanden/documenten/20260210_Overzicht_water-_en_rioolheffing.pdf)
- [Informatie over dubbelbestemming landgoed (mrt '26)](https://www.stillewille.nl/images/bestanden/documenten/20260318_Informatie_over_dubbestemming_landgoed.pdf)
- [Bestemmingsplan De Stille Wille (feb 2018)](https://www.stillewille.nl/images/bestanden/documenten/t_NL.IMRO.0823.DESTILLEWILLE2016-VAS1.pdf)
- [Bijlagen bij bestemmingsplan (feb 2018)](https://www.stillewille.nl/images/bestanden/documenten/De_Stille_Wille-_Bijlagen_bij_toelichting.pdf)
- [Gemeentelijk overzicht traject bestemmingsplan](https://www.stillewille.nl/images/bestanden/documenten/2018-Gemeentelijk-overzicht-bestemmingsplan.pdf)

### 4.2 Actuele bewonersraadverslagen (`/informatie#bewonersraad`)
- [BR-verslag 16 mrt '26](https://www.stillewille.nl/images/bestanden/documenten/2026-03_Bewonersraadvergadering_2026-03_definitief.pdf)
- [BR-verslag 2 feb '26](https://www.stillewille.nl/images/bestanden/verslagen/2026-02-02_Verslag_Bewonersraadvergadering_en_toelichting_herkomst_resultaat.pdf)
- [BR-verslag 6 jan '26](https://www.stillewille.nl/images/bestanden/verslagen/20260316_Bewonersraad_26_jan_26.pdf)
- [BR-verslag 28 nov '25](https://www.stillewille.nl/images/bestanden/verslagen/2025-11-28_Verslag_Bewonersraadvergadering_MJ_def_8-12.pdf)
- [Bijlage bij BR-verslag 28 nov '25](https://www.stillewille.nl/images/bestanden/verslagen/2025-12-2_Vervolgoverleg_SWW_en_SWB.pdf)
- [BR-verslag 25 okt '25](https://www.stillewille.nl/images/bestanden/verslagen/20250111_BR-verslag_van_25_okt_25.pdf)

### 4.3 Actuele nieuwsbrieven (`/informatie#nieuwsbrieven`)
- [Tussendoortje mei '26](https://www.stillewille.nl/images/Nieuwsbrief_mei_2026_tussendoortje.pdf)
- [Nieuwsbrief april '26](https://www.stillewille.nl/images/Nieuwsbrief_april_2026.pdf)
- [Tussendoortje april '26](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/Nieuwsbrief_april_2026_tussendoortje.pdf)
- [Nieuwsbrief maart '26](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/20260319_Stille_Wille_Nieuwsbrief_maart_2026.pdf)
- [Nieuwsbrief februari '26](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/20260203_Stille_Wille_Nieuwsbrief_februari_26.pdf)
- [Nieuwsbrief december '25](https://www.stillewille.nl/images/bestanden/documenten/20251212_Stille_Wille_Nieuwsbrief_dec_25.pdf)
- [Tussendoortje november '25](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/20251104_Stille_Wille_Tussendoortje__November_25.pdf)
- [Nieuwsbrief oktober '25](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/2025_Stille_WIlle_Nieuwsbrief_oktober_25.pdf)
- [Nieuwsbrief september '25 (met rectificatie)](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/20250913_Stille_Wille_Nieuwsbrief_sep_25.pdf)
- [Nieuwsbrief augustus '25](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/25-03-stille-wille-nieuwsbrief-augustus.pdf)
- [Nieuwsbrief april '25 (25-2)](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/25-02_stille-wille-nieuwbrief.pdf)
- [Extra editie (25-1-1)](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/25-01-1_extra-editie-stille-wille-nieuwsbrief.pdf)

### 4.4 Actuele mededelingen (`/informatie#mededelingen`)
- [Vernieuwde website binnenkort online](https://www.stillewille.nl/mededelingen/vernieuwde-website-binnenkort-online)
- [Zomerfeest – zaterdag 22 augustus](https://www.stillewille.nl/mededelingen/stille-wille-zomerfeest-zaterdag-22-augustus-a-s)
- [Mogelijk tijdelijke stroomuitval werkzaamheden Enexis](https://www.stillewille.nl/mededelingen/mogelijke-stroomuitval-vanwege-werkzaamheden-enexis)
- [Storing elektrakast Dennenlaan](https://www.stillewille.nl/mededelingen/storing-elektrakast-dennenlaan)
- [Thuisbatterij of buurtbatterij?](https://www.stillewille.nl/mededelingen/thuisbattterij-of-buurtbatterij-wat-past-bij-stille-wille)
- [Extract uit BR-verslag okt '25](https://www.stillewille.nl/mededelingen/extract-uit-br-verslag-okt-25)

### 4.5 Archief — documenten (`/informatie/archief`)
- [Resultaten enquête modernisering straatverlichting (2020-12-17)](https://www.stillewille.nl/images/bestanden/documenten/2020-12-17_Resultaten_enquête_modernisering_straatverlichting_SW.pdf)
- [Update wateroverlast (2024-01-03)](https://www.stillewille.nl/images/bestanden/documenten/2024-01-03_Update_wateroverlast.pdf)
- [Door de bomen het bos weer zien (2016)](https://www.stillewille.nl/images/bestanden/documenten/20160300_Door_de_bomen_het_bos_weer_zien.pdf)
- [Bermenbeleid Stille Wille 2024](https://www.stillewille.nl/images/bestanden/documenten/20240515_Bermenbeleid_Stille_Wille_2024.pdf)
- [Vacature landgoedbeheerder SWB (mrt '25)](https://www.stillewille.nl/images/bestanden/documenten/20250312_Vacature_landgoedbeheerder_Stille_Wille_Brabant.pdf)
- [CTL-presentatie informatiebijeenkomst (mrt '25)](https://www.stillewille.nl/images/bestanden/documenten/20250313_CTL-Presentatie_Informatiebijeenkomst.pdf)
- [CTL-verslag informatiebijeenkomst (mrt '25)](https://www.stillewille.nl/images/bestanden/documenten/20250321_CTL-Verslag_Informatiebijeenkomst.pdf)
- [Vragen & Antwoorden t.b.v. Commissie Toekomst Landgoed (apr '25)](https://www.stillewille.nl/images/bestanden/documenten/20250407_Vragen_en_Antwoorden_t.b.v._Commissie_Toekomst_Landgoed.pdf)
- [Beeldkwaliteit Landgoed Stille Wille](https://www.stillewille.nl/images/bestanden/documenten/BEELDKWALITEIT_LANDGOED_STILLE_WILLE.pdf)
- [Begroting PvA Werkgroep B en V](https://www.stillewille.nl/images/bestanden/documenten/Begroting_PvA_Werkgroep_B_en_V.pdf)
- [Extract Nieuwsbrief 2-2024 vernieuwde straatverlichting](https://www.stillewille.nl/images/bestanden/documenten/Extract_uit_Nieuwsbrief_2_-_2024_Vernieuwe_straatverlichting.pdf)
- [Extract Stille Wille Nieuwsbrief 1](https://www.stillewille.nl/images/bestanden/documenten/Extract_uit_Stille_Wille_Nieuwsbrief_1.pdf)
- [Extract Stille Wille Nieuwsbrief 2-2024](https://www.stillewille.nl/images/bestanden/documenten/Extract_uit_Stille_Wille_Nieuwsbrief_2_2024.pdf)
- [Plattegrond straatverlichting](https://www.stillewille.nl/images/bestanden/documenten/Plattegrond_Straatverlichting.pdf)
- [Plattegrond Stille Wille 2022](https://www.stillewille.nl/images/bestanden/documenten/plattegrond-stille-wille-2022.pdf)
- [Verblijf- en Gebruiksreglement – uitgave 10-06-2020](https://www.stillewille.nl/images/bestanden/documenten/Verblijf-_en_Gebruiksreglement_Landgoed_Stille_Wille_-_Uitgave_10-06-2020.pdf)
- [Werkzaamheden onverharde wegen](https://www.stillewille.nl/images/bestanden/documenten/Werkzaamheden_onverharde_wegen.pdf)

*(Het archief herhaalt daarnaast diverse actuele documenten — Beheersovereenkomst, Exploitatieovereenkomst, Beeldkwaliteitsplan, Calamiteitenkaart, Afvalkalender, bestemmingsplan + bijlagen, Groenvisie HAS, Overzicht Commissies, water-/rioolheffing, dubbelbestemming, Ad-Vi-brief, klankbordgroep-voorstellen.)*

### 4.6 Archief — projecten
- [Onderhoud energienet landgoed (stroomvoorziening)](https://www.stillewille.nl/informatie/projectarchief/stroomvoorziening)

### 4.7 Archief — bewonersraadverslagen (10)
- [26-01-2024 (ondertekend)](https://www.stillewille.nl/images/bestanden/verslagen/2024-01-26_ondertekend_verslag_bewonersraad_vergadering_26-1-2024.pdf)
- [18-03-2024 (ondertekend, SWB + SWW)](https://www.stillewille.nl/images/bestanden/verslagen/2024-03-18_Ondertekende_notulen_Bewonersraadvergadering_18-03-2024_SWB_en_SWW.pdf)
- [09-04-2024](https://www.stillewille.nl/images/bestanden/verslagen/2024-04-09_Notulen_BR_verg._AS_003.pdf)
- [05-11-2024](https://www.stillewille.nl/images/bestanden/verslagen/2024-11-29-verslag-br-2024-11-05.pdf)
- [28-11-2025](https://www.stillewille.nl/images/bestanden/verslagen/2025-11-28_Verslag_Bewonersraadvergadering_MJ_def_8-12.pdf)
- [Vervolgoverleg SWW–SWB (02-12-2025)](https://www.stillewille.nl/images/bestanden/verslagen/2025-12-2_Vervolgoverleg_SWW_en_SWB.pdf)
- [02-02-2026 (+ toelichting herkomst resultaat)](https://www.stillewille.nl/images/bestanden/verslagen/2026-02-02_Verslag_Bewonersraadvergadering_en_toelichting_herkomst_resultaat.pdf)
- [22-08-2024](https://www.stillewille.nl/images/bestanden/verslagen/20240830_Verslag_Bewonersraad_22_aug_2024.pdf)
- [25-10-2025](https://www.stillewille.nl/images/bestanden/verslagen/20250111_BR-verslag_van_25_okt_25.pdf)
- [10-03-2025](https://www.stillewille.nl/images/bestanden/verslagen/20250407_Notulen_Bewonersraad_10-03-2025.pdf)

### 4.8 Archief — nieuwsbrieven (chronologisch, ~37)
Map `/images/bestanden/nieuwsbrieven/`. Reeks loopt van mei 2023 t/m april 2026, met veel "extra edities":
2023: [05](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/23-05-stille-wille-nieuwsbrief.pdf) · [06](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/23-06-stille-wille-nieuwsbrief.pdf) · [07](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/23-07-stille-wille-nieuwsbrief.pdf) · [08-1](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/23-08-1-stille-wille-nieuwsbrief.pdf) · [08](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/23-08-stille-wille-nieuwsbrief.pdf) · [09](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/23-09-stille-wille-nieuwsbrief.pdf) · [10](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/23-10-stille-wille-nieuwsbrief.pdf) · [11](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/23-11-stille-wille-nieuwsbrief.pdf) · [12](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/23-12-stille-wille-nieuwsbrief.pdf)
2024: [01](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/24-01-stille-wille-nieuwsbrief.pdf) · [02-1 t/m 02-4 extra](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/24-02-1-extra-editie-stille-wille-nieuwsbrief.pdf) · [02](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/24-02-Stille-Wille-Nieuwsbrief.pdf) · [03-1 t/m 03-4 extra](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/24-03-1-extra-editie-stille-wille-nieuwsbrief.pdf) · [03](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/24-03-stille-wille-nieuwsbrief.pdf) · [04-1 extra](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/24-04-1_extra-editie-stille-wille-nieuwsbrief.pdf) · [04](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/24-04-stille-wille-nieuwsbrief.pdf) · [Sinterklaaseditie](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/24-05-01_Sinterklaaseditie.pdf) · [05](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/24-05-stille-wille-nieuwsbrief.pdf) · [06](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/24-06-stille-wille-nieuwsbrief.pdf)
2025: [01-1 extra](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/25-01-1_extra-editie-stille-wille-nieuwsbrief.pdf) · [01](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/25-01_stille-wille-nieuwsbrief.pdf) · [02](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/25-02_stille-wille-nieuwbrief.pdf) · [augustus](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/25-03-stille-wille-nieuwsbrief-augustus.pdf) · [oktober](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/2025_Stille_WIlle_Nieuwsbrief_oktober_25.pdf) · [sep (12-09)](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/20250912_Stille_Wille_Nieuwsbrief_sep_25.pdf) · [sep (13-09)](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/20250913_Stille_Wille_Nieuwsbrief_sep_25.pdf) · [Tussendoortje nov](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/20251104_Stille_Wille_Tussendoortje__November_25.pdf)
2026: [februari](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/20260203_Stille_Wille_Nieuwsbrief_februari_26.pdf) · [maart](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/20260319_Stille_Wille_Nieuwsbrief_maart_2026.pdf) · [Tussendoortje april](https://www.stillewille.nl/images/bestanden/nieuwsbrieven/Nieuwsbrief_april_2026_tussendoortje.pdf)

### 4.9 Archief — mededelingen (35)
- [Klankbordgroep update februari '26](https://www.stillewille.nl/mededelingen/update-klankbordgroep-februari-26)
- [Wijziging grof vuil inleveren](https://www.stillewille.nl/mededelingen/wijziging-grof-vuil-inleveren)
- [Informatie Gasleidingnetwerk \| Gasvoorziening](https://www.stillewille.nl/mededelingen/gasleidingnetwerk-gasvoorziening)
- [Terugblik jaarlijkse controle brandblusser](https://www.stillewille.nl/mededelingen/terugblik-jaarlijkse-controle-brandblusser)
- [Herhaling controle brandblussers 18 okt + demonstratie](https://www.stillewille.nl/mededelingen/herhaling-jaarlijkse-controle-brandblusser-18-okotber-a-s)
- [Toelichting aanblijven bestuur SWW](https://www.stillewille.nl/mededelingen/toelichting-aanblijven-bestuur-sww)
- [Jaarlijkse controle brandblusser 20 september](https://www.stillewille.nl/mededelingen/jaarlijkse-controle-brandblusser)
- [Impressie – fotogalerij van het landgoed](https://www.stillewille.nl/mededelingen/impressie-fotogalerij-van-het-landgoed)
- [Wegwerkzaamheden Bremlaan → grote P-plaats gereed](https://www.stillewille.nl/mededelingen/wegwerkzaamheden-wegennet)
- [Toespraak Zomerfeest (Wil van Loon)](https://www.stillewille.nl/mededelingen/toespraak-manager-wil-van-loon-tijdens-stille-wille-zomerfeest)
- [Aankondiging nieuwe Manager Landgoed](https://www.stillewille.nl/mededelingen/aankondiging-nieuwe-manager-landgoed)
- [Update renovatie/verduurzamen straatverlichting](https://www.stillewille.nl/mededelingen/renovatie-verduurzamen-straatverlichting)
- [Gebruik recreatieve voorzieningen](https://www.stillewille.nl/mededelingen/gebruik-recreatieve-voorzieningen)
- [Projecten in uitvoering/voorbereiding/planning](https://www.stillewille.nl/mededelingen/meer-weten-over-werk-in-uitvoering-planning-of-voorbereiding)
- [Nieuwe vijver en kronkelpad Kleine Bos](https://www.stillewille.nl/mededelingen/een-prachtige-nieuwe-vijver-en-kronkelpad-in-het-kleine-bos)
- [LET OP: werkzaamheden vijver Vijverlaan](https://www.stillewille.nl/mededelingen/aanpak-vijver-vijverlaan-kleine-bos)
- [Verbeteringen vijver Kleine Bos](https://www.stillewille.nl/mededelingen/verbeteringen-voor-de-vijver-in-het-kleine-bos)
- [Nieuwe grondprijzen (per 1 juni '25)](https://www.stillewille.nl/mededelingen/aanpassing-grondprijzen-per-1-juni-25)
- [Digitaal aanvragen of wijzigingen doorgeven](https://www.stillewille.nl/mededelingen/digitaal-iets-aanvragen-of-wijzigingen-doorgeven)
- [De bruine rat op het landgoed](https://www.stillewille.nl/mededelingen/de-bruine-rat-bezoekt-ook-het-landgoed)
- [Openingstijden receptie (pensioenfeest Rianne IJpelaar 31 jan)](https://www.stillewille.nl/mededelingen/pensioenfeest-rianne-ijpelaar-31-januari-a-s)
- [Openingstijden receptie januari '25](https://www.stillewille.nl/mededelingen/openingstijden-en-bereikbaarheid-receptie)
- [Zonneparken zoekgebied Oirschot-West](https://www.stillewille.nl/mededelingen/zonneparken-in-zoekgebied-oirschot-west)
- [Jaarlijkse controle brandblusser gemist?](https://www.stillewille.nl/mededelingen/jaarlijkse-controle-brandblusser-gemist)
- [Stand van zaken diverse projecten](https://www.stillewille.nl/mededelingen/stand-van-zaken-diverse-projecten)
- [Overzicht water- en rioolheffing](https://www.stillewille.nl/mededelingen/overzicht-water-en-rioolheffing)
- [Rectificatie Nieuwsbrief 4-2024](https://www.stillewille.nl/mededelingen/rectificatie-stille-wille-nieuwsbrief-2024-4)
- [Evaluatie renovatie tennisbanen e.o.](https://www.stillewille.nl/mededelingen/evaluatie-tennisbaan-multiveld)
- [Checklist controle brandblusser](https://www.stillewille.nl/mededelingen/checklist-brandblusser-t-b-v-de-jaarlijkse-controle)
- [Plattegrond kritieke locaties wateroverlast](https://www.stillewille.nl/mededelingen/plattegrond-aanpak-locaties-wateroverlast)
- [Nieuwsbrieven teruglezen](https://www.stillewille.nl/mededelingen/nieuwsbrieven-inclusief-extra-edities-teruglezen)
- [Tennisinformatie 2024-01](https://www.stillewille.nl/mededelingen/240703-tennisinformatie-01)
- [Vernieuwde website Landgoed De Stille Wille](https://www.stillewille.nl/mededelingen/beste-bewoners-van-het-landgoed)
- [Start dunning Wandelbos](https://www.stillewille.nl/mededelingen/informatie-inzake-start-dunning-wandelbos)
- [Scheiden afval (papier/plastic)](https://www.stillewille.nl/mededelingen/mededeling-m-b-t-sorteren-papier-en-plastic)

---

## 5. Woningaanbod (`/woningaanbod`)

Dynamische lijst; op de crawldatum 14 woningen, elk met eigen detailpagina (`/woningaanbod/…`).

| SW-nr | Vraagprijs | Grondvorm | Status |
|---|---|---|---|
| 271 | € 575.000 k.k. | eigendom | beschikbaar |
| 202 | € 450.000 k.k. | eigendom | beschikbaar |
| 303 | volgt | — | beschikbaar |
| 224 | € 430.000 k.k. | erfpacht | beschikbaar |
| 51 | € 685.000 k.k. | eigendom | beschikbaar |
| 209 | € 450.000 k.k. | eeuwigdurende pacht | beschikbaar |
| 49 | € 325.000 k.k. | erfpacht | verkocht o.v. |
| 26 | € 525.000 k.k. | erfpacht | verkocht o.v. |
| 306 | € 525.000 k.k. | eigendom | verkocht o.v. |
| 116 | € 585.000 k.k. | eigendom | verkocht o.v. |
| 323 | € 435.000 k.k. | erfpacht | verkocht o.v. |
| 237 | € 449.000 k.k. | eigendom | verkocht o.v. |
| 82 | € 350.000 k.k. | erfpacht | verkocht o.v. |
| 4 | € 785.000 k.k. | eigendom | verkocht o.v. |

---

## 6. Externe links & verwijzingen

| Bestemming | Context |
|---|---|
| stillewillewonen.nl | Bewonersvereniging SWW (incl. `/vereniging/agenda/`, commissie Sociaal, enquête-PDF) |
| vandemeerendonkmakelaars.nl | Makelaar grond/woningverkoop |
| wijzer-oirschot.nl, levgroep.nl | Dorpsondersteuner / zorg & welzijn |
| hartslagnu.nl | AED-netwerk / First Respondergroep |
| oirschot.nl | Gemeente (AED, speelvoorzieningen) |
| visitoirschot.nl, visitbrabant.com | Toerisme/omgeving |
| Diverse natuur-/cultuurlinks | Op pagina Omgeving (Kampina, Landgoed Baest, DAF-museum, e.d.) |

---

## 7. Observaties (dossier-relevant)

Feitelijk, ter beoordeling — geen conclusies:

1. **Eigenaarschap & zeggenschap zijn expliciet beschreven.** De site stelt onomwonden dat SWB onder LSW valt en dat bewoners momenteel "slechts een adviserende rol" hebben (pagina Klankbordgroep). De voorgestelde overgang naar een Exploitatievereniging (EV) wordt openlijk als lopend traject gepresenteerd. Dit raakt direct de kern van het governance-dossier.

2. **De Klankbordgroep is een formeel, op de officiële site erkend kanaal** (onafhankelijk, 7 leden, taken overgenomen van de opgeheven CTL). Relevant als gespreks-/toetsingspartij.

3. **Financieel beheer is sinds 1-1-2025 uitbesteed aan Ad-Vi VVE Beheer B.V.** (incasso exploitatie/water/gas). De jaarrekening wordt door een door de Bewonersraad benoemde registeraccountant opgemaakt; inzage loopt via de receptie (niet online).

4. **Beheerovereenkomst loopt t/m 2028**; er wordt gewerkt aan een nieuw MJOP en een nieuwe beheerovereenkomst voor de periode daarna. Een natuurlijk ijkpunt voor het dossier.

5. **Gasdossier:** er is zowel een projectpagina ("Gasleidingnetwerk | Gasvoorziening", met vermelding van **Benegas** en gesprekken met initiatiefnemende bewoners) als een mededeling, plus een gearchiveerde projectpagina "Onderhoud energienet landgoed". Bruikbaar als officiële tegenhanger naast eigen bronnen.

6. **De SWW-site wordt geabsorbeerd in deze site** (besluit Bewonersraad, voorbereiding jan. '26). Op termijn verschuift bewonersverenigingscontent dus naar stillewille.nl — beheerd door SWB/LSW. Aandachtspunt voor archivering van de huidige SWW-content vóór migratie.

7. **Volledigheid van de bronvastlegging:** het bestemmingsplan (2018, definitief goedgekeurd 29 mei 2019) + bijlagen + gemeentelijk traject, de Beheer- en Exploitatieovereenkomst, het Beeldkwaliteitsplan en het document Begroting & Fondsen staan publiek. Geschikt als primaire brondocumenten.

8. **Technische kanttekeningen:** generator-meta geobfusceerd ("MYOB"); mogelijk open directory-index op de documentenmap; alle inhoudelijke financiën (jaarrekening) staan níét online maar lopen via receptie-inzage.

---

*Einde inventarisatie. Login-beschermde inhoud en de toekomstige "Mijn SW"-omgeving vallen buiten deze opname.*
