/**
 * _seed-frontmatter.mjs — eenmalige seeding van YAML front-matter
 *
 * De corpusbestanden in deze map zijn getagd volgens het rubricerings-/
 * front-matter-schema uit `Inventarisatie-4-...` (§A.1 hoofdrubrieken,
 * §A.2 facetten, §A.3 YAML-sjabloon). Dit script schrijft die front-matter
 * één keer naar de kop van elk bestand (idempotent: bestanden die al met
 * `---` beginnen worden overgeslagen), zodat de corpus zelfbeschrijvend is
 * en `build.mjs` er de manifest (`corpus.json`) uit kan afleiden.
 *
 *   node _seed-frontmatter.mjs
 *
 * De front-matter is met de hand opgesteld op basis van de bestandskoppen
 * en de master-index (INDEX.md). Facetwaarden komen uit het schema.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Eenvoudige YAML-emit voor het platte schema (strings + string-arrays). */
function emit(obj) {
  const q = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      if (v.length === 0) { lines.push(`${k}: []`); continue; }
      lines.push(`${k}:`);
      for (const item of v) lines.push(`  - ${q(item)}`);
    } else {
      lines.push(`${k}: ${q(v)}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

// Volgorde van de velden = schema §A.3.
const FM = {
  'Inventarisatie-2-volledige-inhoud-per-onderwerp.md': {
    titel: 'Volledige inhoud per onderwerp — beide sites',
    bron: 'stillewillewonen.nl + stillewille.nl',
    bron_url: '',
    bestandsnaam: '',
    auteur: '',
    datum: '2026-06-16',
    brontype: 'webpagina',
    partij: ['SWW', 'SWB', 'LSW'],
    rubriek_primair: 'Governance & besluitvorming',
    rubriek_secundair: ['Financiën & fondsen', 'Communicatie & nieuwsbrieven', 'Stakeholders & organisatie', 'Gas & energie'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['site-inventarisatie', 'borging', 'integratie-2026', 'cross-onderwerp'],
    kernonderwerpen: [
      'Inhoudelijke borging van beide sites vóór de aangekondigde integratie (begin 2026)',
      'On-site tekst geordend op onderwerp i.p.v. menustructuur',
      'Bronnotatie per feit (SWW: / SW: + pad); ontbrekende gegevens expliciet benoemd',
    ],
    verificatiepunten: [
      'Fase 1 (on-site tekst) — ~90 PDF\'s SWW-archief en losse stillewille.nl-documenten nog niet verwerkt (zie §17)',
    ],
  },

  'Inventarisatie-3-documentinhoud-deel1-governance-financien.md': {
    titel: 'Documentinhoud deel 1 — Governance, Toekomst (EV), Financiën & Regels',
    bron: 'stillewillewonen.nl',
    bron_url: 'https://stillewillewonen.nl/',
    bestandsnaam: '',
    auteur: '',
    datum: '2025',
    brontype: 'overeenkomst',
    partij: ['SWW', 'SWB', 'LSW', 'Bewonersraad'],
    rubriek_primair: 'Governance & besluitvorming',
    rubriek_secundair: ['Financiën & fondsen', 'Wonen & bestemmingsplan', 'Regels & handhaving'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['exploitatievereniging', 'EV', 'statuten', 'huishoudelijk-reglement', 'exploitatieovereenkomst', 'fondsen', 'bestuursconflict'],
    kernonderwerpen: [
      'Juridische basis + verenigingsstructuur (statuten, HR v1.0)',
      'Toekomstvoorstel: omzetting BV SWB → Exploitatievereniging',
      'Besluitvormingsproces met het bestuursconflict (2025)',
      'Financiële structuur: exploitatie + fondsen',
    ],
    verificatiepunten: [
      'Grote scans bewust uitgesteld (zie §9 deel-2-lijst): Statuten, Verblijfs- en Gebruiksreglement, Beeldkwaliteitsplan, Groenplan, enquête',
    ],
  },

  'Inventarisatie-3-documentinhoud-deel2-stillewille-nl.md': {
    titel: 'Documentinhoud deel 2 — Documenten op stillewille.nl',
    bron: 'stillewille.nl',
    bron_url: 'https://www.stillewille.nl/',
    bestandsnaam: '',
    auteur: '',
    datum: '2025/2026',
    brontype: 'webpagina',
    partij: ['LSW', 'SWB'],
    rubriek_primair: 'Governance & besluitvorming',
    rubriek_secundair: ['Communicatie & nieuwsbrieven', 'Stakeholders & organisatie'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['stillewille.nl', 'bestuurscrisis-2025', 'continuiteit', 'pdfplumber'],
    kernonderwerpen: [
      'Nieuwere stukken (eind 2025 – maart 2026) die niet in het SWW-archief staan',
      'Dossiercontinuïteit ná de bestuurscrisis van juni 2025',
      'PDF-tekst via curl + pdfplumber; metadata ter controle van datums',
    ],
    verificatiepunten: [
      'Twee beeld-scans zonder tekstlaag doorgeschoven naar deel 2b (Beheersovereenkomst + BR-verslag jan \'26)',
    ],
  },

  'Inventarisatie-3-documentinhoud-deel2b-OCR-scans.md': {
    titel: 'Documentinhoud deel 2b — OCR van twee beeld-scans (Beheersovereenkomst + BR jan \'26)',
    bron: 'stillewille.nl',
    bron_url: 'https://www.stillewille.nl/',
    bestandsnaam: '20260316_Bewonersraad_26_jan_26.pdf',
    auteur: '',
    datum: '2024/2026',
    brontype: 'overeenkomst',
    partij: ['LSW', 'SWB'],
    rubriek_primair: 'Governance & besluitvorming',
    rubriek_secundair: ['Stakeholders & organisatie', 'Financiën & fondsen'],
    status: 'scan',
    betrouwbaarheid: 'ORANJE',
    tags: ['OCR', 'beheersovereenkomst', 'bewonersraad', 'tesseract', 'beeld-scan'],
    kernonderwerpen: [
      'OCR (tesseract 5.3.4, NL, 300 DPI) van twee documenten die alleen als beeld-scan bestonden',
      'Beheersovereenkomst (LSW-zijde ↔ SWB), PDF aangemaakt 05-10-2017',
      'Bewonersraadverslag januari 2026',
    ],
    verificatiepunten: [
      'OCR-voorbehoud: matige scan; eigennamen, KvK-nummers en bedragen tegen het origineel controleren bij publicatiewaardig gebruik',
    ],
  },

  'Inventarisatie-3-documentinhoud-deel3-SWW-notulenreeks.md': {
    titel: 'Documentinhoud deel 3 — SWW-notulenreeks 2023 → 2025',
    bron: 'stillewillewonen.nl',
    bron_url: 'https://stillewillewonen.nl/',
    bestandsnaam: '',
    auteur: '',
    datum: '2023/2025',
    brontype: 'notulen',
    partij: ['SWW', 'Bewonersraad', 'SWB', 'LSW'],
    rubriek_primair: 'Governance & besluitvorming',
    rubriek_secundair: ['Stakeholders & organisatie', 'Financiën & fondsen'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['notulen', 'ALV', 'bewonersraad', 'bestuurscrisis-2025', 'governance-tijdlijn'],
    kernonderwerpen: [
      'Bestuurlijke continuïteit van oprichting (2023) → BR-/ALV-jaar 2024 → bestuurscrisis (2025)',
      'Sluit aan op deel 1 (ALV 12-06-2025, Toekomst-stukken) en deel 2/2b (okt 2025 – maart 2026)',
    ],
    verificatiepunten: [],
  },

  'Inventarisatie-3-documentinhoud-deel3b-losse-eindjes.md': {
    titel: 'Documentinhoud deel 3b — Financiële stukken + Bewonersraad-jaar 2024',
    bron: 'stillewillewonen.nl',
    bron_url: 'https://stillewillewonen.nl/',
    bestandsnaam: '',
    auteur: '',
    datum: '2024',
    brontype: 'begroting',
    partij: ['SWW', 'SWB'],
    rubriek_primair: 'Financiën & fondsen',
    rubriek_secundair: ['Governance & besluitvorming'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['exploitatiebegroting', 'jaarrekening', 'bewonersraad-2024', 'kostenstructuur'],
    kernonderwerpen: [
      'Exploitatiebegroting SWB 2024 met volledige kostenstructuur',
      'Eigen financiën vereniging SWW (2023/2024)',
      'Nieuwe inhoud uit BR-verslagen 9 april, 16 juli en 30 september 2024',
    ],
    verificatiepunten: [
      'Twee stukken bleken technisch niet uitleesbaar (notitie in dit deel)',
    ],
  },

  'Inventarisatie-3-documentinhoud-deel4-reglementen-enquete.md': {
    titel: 'Documentinhoud deel 4 — Reglementen, plannen en de Bewonersenquête',
    bron: 'stillewille.nl + stillewillewonen.nl',
    bron_url: '',
    bestandsnaam: '',
    auteur: '',
    datum: '2023',
    brontype: 'reglement',
    partij: ['SWB', 'LSW', 'SWW'],
    rubriek_primair: 'Regels & handhaving',
    rubriek_secundair: ['Natuur, bomen & groen', 'Wonen & bestemmingsplan', 'Stakeholders & organisatie'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['verblijfsreglement', 'gebruiksreglement', 'bewonersenquete', 'groenvisie', 'bestemmingsplan', 'calamiteitenkaart'],
    kernonderwerpen: [
      'Bindende parkregels (Verblijf- en Gebruiksreglement)',
      'Bewonersenquête 2023 (sentiment-fundament)',
      'Groenvisie (bomen-/natuurfundament); bestemmingsplan + dubbelbestemmingsbrief; calamiteitenkaart',
    ],
    verificatiepunten: [],
  },

  'Inventarisatie-3-documentinhoud-deel5-bestemmingsplan-fondsen-BRmandaat.md': {
    titel: 'Documentinhoud deel 5 — Bestemmingsplan, fondsen en het Bewonersraad-mandaat',
    bron: 'stillewille.nl',
    bron_url: 'https://www.stillewille.nl/',
    bestandsnaam: '',
    auteur: '',
    datum: '2023',
    brontype: 'bestemmingsplan',
    partij: ['LSW', 'SWB', 'Bewonersraad', 'gemeente'],
    rubriek_primair: 'Wonen & bestemmingsplan',
    rubriek_secundair: ['Financiën & fondsen', 'Governance & besluitvorming'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['bestemmingsplan', 'planregels', 'fondsen', 'bewonersraad-mandaat', '5%-regel'],
    kernonderwerpen: [
      'Financieel fondsenartikel (okt 2023)',
      'Juridische planregels van het bestemmingsplan',
      'Taken/bevoegdheden van de Bewonersraad incl. de 5%-regel',
    ],
    verificatiepunten: [],
  },

  'Inventarisatie-3-documentinhoud-deel6-nieuwsbrieven.md': {
    titel: 'Documentinhoud deel 6 — Nieuwsbrieven en "Tussendoortjes" (stillewille.nl)',
    bron: 'stillewille.nl',
    bron_url: 'https://www.stillewille.nl/',
    bestandsnaam: '',
    auteur: 'Wil van Loon (SWB, vanaf aug 2025)',
    datum: '2025-01/2026-05',
    brontype: 'nieuwsbrief',
    partij: ['SWB', 'SWW'],
    rubriek_primair: 'Communicatie & nieuwsbrieven',
    rubriek_secundair: ['Governance & besluitvorming'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['nieuwsbrief', 'tussendoortjes', 'communicatie-omslag', 'ontdubbeling'],
    kernonderwerpen: [
      'Twaalf uitgaven (jan 2025 – mei 2026), overwegend operationeel/aankondigend',
      'Communicatie-omslag: SWW-redactie t/m apr 2025 → Wil van Loon (SWB) vanaf aug 2025',
      'Bestandsnamen vastgelegd voor ontdubbeling t.o.v. stillewillewonen.nl',
    ],
    verificatiepunten: [],
  },

  'Inventarisatie-4-stillewillewonen-start-en-rubriceringsschema.md': {
    titel: 'Rubriceringsschema + eerste getagde entry ("Risico\'s nieuwe vereniging")',
    bron: 'stillewillewonen.nl',
    bron_url: 'https://stillewillewonen.nl/',
    bestandsnaam: '',
    auteur: '',
    datum: '2025',
    brontype: 'standpunt/opinie',
    partij: ['SWW', 'bewonersgroep'],
    rubriek_primair: 'Governance & besluitvorming',
    rubriek_secundair: ['Financiën & fondsen', 'Wonen & bestemmingsplan'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['schema', 'rubricering', 'front-matter', 'tagging', 'EV', 'risicos-vereniging'],
    kernonderwerpen: [
      'Definieert het rubricering-/tagschema (hoofdrubrieken, facetten, YAML-front-matter)',
      'Voedt de doorzoekbare omgeving en de latere agent',
      'Eerste getagde entry als werkend voorbeeld: "Risico\'s nieuwe vereniging van perceeleigenaren"',
    ],
    verificatiepunten: [
      'Erfpachtinkomsten LSW "~€900.000/jaar" — bewering, primair te verifiëren',
      'Rechtbank-/gerechtshofuitspraken 2013/2014 — opzoeken op rechtspraak.nl',
    ],
  },

  'Inventarisatie-5-stillewillewonen-pagina-sweep.md': {
    titel: 'stillewillewonen.nl — pagina-sweep + nieuwsbrief-ontdubbeling',
    bron: 'stillewillewonen.nl',
    bron_url: 'https://stillewillewonen.nl/',
    bestandsnaam: '',
    auteur: '',
    datum: '2026-06-16',
    brontype: 'webpagina',
    partij: ['SWW'],
    rubriek_primair: 'Stakeholders & organisatie',
    rubriek_secundair: ['Communicatie & nieuwsbrieven', 'Natuur, bomen & groen', 'Recreatie & voorzieningen'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['pagina-sweep', 'commissies', 'werkgroepen', 'klankbordgroep', 'ontdubbeling'],
    kernonderwerpen: [
      'Fase B: resterende statische pagina\'s (Vereniging, commissies, admin)',
      'Fase C: de Actueel-nieuwsstroom',
      'Fase D: ontdubbeling van de nieuwsbrieven t.o.v. stillewille.nl (deel 6)',
    ],
    verificatiepunten: [],
  },

  'Inventarisatie-6-SWW-nieuwsbrieven-2023.md': {
    titel: 'SWW-nieuwsbrieven 2023 (tranche 1)',
    bron: 'stillewillewonen.nl',
    bron_url: 'https://stillewillewonen.nl/archief/nieuwsbrieven/',
    bestandsnaam: '',
    auteur: 'Redactie Peter Aerts + Anton Noë',
    datum: '2023',
    brontype: 'nieuwsbrief',
    partij: ['SWW', 'SWB'],
    rubriek_primair: 'Communicatie & nieuwsbrieven',
    rubriek_secundair: ['Financiën & fondsen', 'Governance & besluitvorming', 'Natuur, bomen & groen'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['nieuwsbrief', '5,2%', 'parkonderhoud', 'MJOP-2022', 'oprichting-SWW', 'erfpacht-2028'],
    kernonderwerpen: [
      'Vroegste documentatie van het financiële/onderhoudsconflict (okt–nov 2023)',
      'Exploitatieverhoging 2024: +5,2% aangenomen (ALV 17-11-2023; 53–1–0)',
      'MJOP 2022 nog niet bruikbaar; oprichting SWW 27-06-2023',
    ],
    verificatiepunten: [
      '+5,2% stemuitslag 53–1–0 — kruislings te bevestigen tegen begroting SWB 2024 (deel 3b)',
    ],
  },

  'Inventarisatie-7-SWW-nieuwsbrieven-2024-H1.md': {
    titel: 'SWW-nieuwsbrieven 2024 H1 (tranche 2a)',
    bron: 'stillewillewonen.nl',
    bron_url: 'https://stillewillewonen.nl/archief/nieuwsbrieven/',
    bestandsnaam: '',
    auteur: 'Correspondenten Koos van Kampen (SWW) + Peter Aerts (SWB)',
    datum: '2024-02/2024-06',
    brontype: 'nieuwsbrief',
    partij: ['SWW', 'SWB'],
    rubriek_primair: 'Communicatie & nieuwsbrieven',
    rubriek_secundair: ['Gas & energie', 'Water & riolering', 'Financiën & fondsen'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['nieuwsbrief', 'Enexis', 'gas-privaat', 'wateroverlast', 'jaarrekeningen', 'redactiewissel'],
    kernonderwerpen: [
      'De 8 edities van 2024 H1 (feb, maart, extra 2.1–2.4, mei, extra 3.1)',
      'Enexis; gas privaat bevestigd; wateroverlastcrisis jaarwisseling 2023/24',
      'Vanaf 2024 tweemaandelijks; geen hard-copy meer bij de receptie',
    ],
    verificatiepunten: [],
  },

  'Inventarisatie-8-SWW-nieuwsbrieven-2024-H2.md': {
    titel: 'SWW-nieuwsbrieven 2024 H2 (tranche 2b)',
    bron: 'stillewillewonen.nl',
    bron_url: 'https://stillewillewonen.nl/archief/nieuwsbrieven/',
    bestandsnaam: '',
    auteur: 'Redactie Peter Aerts (solo, t/m eind 2024)',
    datum: '2024-06/2024-12',
    brontype: 'nieuwsbrief',
    partij: ['SWW', 'SWB'],
    rubriek_primair: 'Communicatie & nieuwsbrieven',
    rubriek_secundair: ['Stakeholders & organisatie', 'Gas & energie', 'Financiën & fondsen'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['nieuwsbrief', 'Rianne-special', 'erfpacht-1997', 'straatverlichting', 'zonneparken', 'LSW-32k', 'SWB-40k'],
    kernonderwerpen: [
      'De 9 edities van 2024 H2, incl. de Special Rianne IJpelaar (directie LSW/SWB)',
      'Erfpacht 1997; LSW €32k + SWB €40k; straatverlichting-renovatie; zonneparken',
      'Provenance: afscheid Peter Aerts eind 2024',
    ],
    verificatiepunten: [],
  },

  'Inventarisatie-9-SWW-nieuwsbrieven-2025.md': {
    titel: 'SWW-nieuwsbrieven 2025 (tranche 3, slot)',
    bron: 'stillewillewonen.nl',
    bron_url: 'https://stillewillewonen.nl/archief/nieuwsbrieven/',
    bestandsnaam: '',
    auteur: '',
    datum: '2025-02/2025-04',
    brontype: 'nieuwsbrief',
    partij: ['SWW', 'SWB'],
    rubriek_primair: 'Communicatie & nieuwsbrieven',
    rubriek_secundair: ['Gas & energie', 'Financiën & fondsen', 'Wonen & bestemmingsplan'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['nieuwsbrief', 'EV-plan', 'Ad-Vi', 'grondprijs', 'paasnieuwsbrief', 'overlap-editie'],
    kernonderwerpen: [
      'De twee laatste SWW-redactie-edities (februari + april 2025)',
      'April (Paasnieuwsbrief) is de overlap-editie die ook in deel 6 zit',
      'Hiermee is de volledige SWW-nieuwsbrievenserie (mei 2023 – apr 2025) geborgd',
    ],
    verificatiepunten: [],
  },

  'Inventarisatie-stillewillewonen.nl.md': {
    titel: 'Site-inventarisatie — stillewillewonen.nl (SWW)',
    bron: 'stillewillewonen.nl',
    bron_url: 'https://stillewillewonen.nl/',
    bestandsnaam: '',
    auteur: '',
    datum: '2026-06-16',
    brontype: 'webpagina',
    partij: ['SWW'],
    rubriek_primair: 'Stakeholders & organisatie',
    rubriek_secundair: ['Communicatie & nieuwsbrieven', 'Governance & besluitvorming'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['site-inventarisatie', 'WordPress', 'bbPress', 'sitemap', 'SWW'],
    kernonderwerpen: [
      'Sitemap + pagina-overzicht van de bewonersverenigingssite',
      'Platform WordPress (forum bbPress; agenda Google Calendar-embed)',
      'Website openbaar; Forum en Facebook-groep besloten',
    ],
    verificatiepunten: [],
  },

  'inventarisatie-stillewille-nl.md': {
    titel: 'Site-inventarisatie — www.stillewille.nl (LSW/SWB)',
    bron: 'stillewille.nl',
    bron_url: 'https://www.stillewille.nl/',
    bestandsnaam: '',
    auteur: '',
    datum: '2026-06-16',
    brontype: 'webpagina',
    partij: ['LSW', 'SWB'],
    rubriek_primair: 'Stakeholders & organisatie',
    rubriek_secundair: ['Communicatie & nieuwsbrieven', 'Governance & besluitvorming'],
    status: 'definitief',
    betrouwbaarheid: 'GEEL',
    tags: ['site-inventarisatie', 'Joomla', 'YOOtheme', 'structuur', 'documenten'],
    kernonderwerpen: [
      'Structuur + documenten/verslagen/nieuwsbrieven-lijsten van de officiële landgoedsite',
      'Technisch profiel: Joomla + YOOtheme Pro; generator-meta geobfusceerd',
      'Niet gedekt: alles achter de login (incl. aangekondigde "Mijn SW"-omgeving)',
    ],
    verificatiepunten: [
      'Mogelijke toegankelijke directory-index op /images/bestanden/documenten/ — te verifiëren',
    ],
  },
};

let added = 0, skipped = 0;
for (const [file, meta] of Object.entries(FM)) {
  const path = join(HERE, file);
  if (!existsSync(path)) { console.warn('! ontbreekt:', file); continue; }
  const raw = readFileSync(path, 'utf8');
  if (raw.startsWith('---')) { skipped++; continue; }
  writeFileSync(path, emit(meta) + raw, 'utf8');
  added++;
  console.log('+ front-matter:', file);
}
console.log(`\nKlaar — ${added} getagd, ${skipped} overgeslagen (had al front-matter).`);
