/**
 * display.mjs — bewoners-voorkant: weergavelaag bovenop de corpus
 *
 * De corpusbestanden (.md) blijven de bron-van-waarheid en worden NIET
 * gewijzigd. Dit bestand legt er een bewonersvriendelijke laag overheen:
 *   - ONDERWERPEN   : de rubrieken als herkenbare ingangen in gewone taal,
 *                     met een korte, NEUTRALE beschrijving (geen nieuwe feiten)
 *   - ICONEN        : een eenvoudig lijn-icoon per onderwerp
 *   - WEERGAVE      : per document een begrijpelijke titel + neutrale duiding
 *   - EXTRA_RUBRIEK : aanvullende onderwerp-koppeling (gegrond in INDEX.md §3),
 *                     zodat brede nieuwsbrieven ook onder Wegen/Water/Recreatie
 *                     vindbaar zijn — puur een mapping, geen inhoudswijziging
 *   - PARTIJEN_INFO : neutrale rolomschrijving per partij ("Wie is wie")
 *
 * build.mjs voegt deze laag samen tot corpus.json. Het redactionele
 * betrouwbaarheids-stoplicht en de productie-tags blijven in de data (de
 * latere agent weegt daarmee zijn bronnen), maar verschijnen niet in het
 * eerste beeld van de bezoeker.
 */

/** De 11 hoofdrubrieken als bewoners-ingangen. `key` = schema-rubriek (§A.1). */
export const ONDERWERPEN = [
  {
    key: 'Governance & besluitvorming',
    label: 'Bestuur & besluiten',
    icon: 'bestuur',
    accent: 'green',
    beschrijving: 'Hoe het landgoed wordt bestuurd en hoe besluiten tot stand komen: de vereniging, de bewonersraad, de vergaderingen en de plannen voor de toekomst van het landgoed.',
  },
  {
    key: 'Financiën & fondsen',
    label: 'Geld & servicekosten',
    icon: 'geld',
    accent: 'yellow',
    beschrijving: 'De begroting, de servicekosten, de fondsen en de jaarcijfers — waar het geld vandaan komt en waaraan het wordt besteed.',
  },
  {
    key: 'Gas & energie',
    label: 'Gas & energie',
    icon: 'gas',
    accent: 'orange',
    beschrijving: 'Het gasnet, de energievoorziening en de projecten rond duurzame energie op het landgoed.',
  },
  {
    key: 'Natuur, bomen & groen',
    label: 'Natuur & groen',
    icon: 'natuur',
    accent: 'green',
    beschrijving: 'Het groenbeheer: bomen, natuur, het groenplan en de werkgroepen die zich hiermee bezighouden.',
  },
  {
    key: 'Water & riolering',
    label: 'Water & riolering',
    icon: 'water',
    accent: 'yellow',
    beschrijving: 'De waterhuishouding op het landgoed: riolering, sloten en duikers, en wateroverlast.',
  },
  {
    key: 'Wegen & infrastructuur',
    label: 'Wegen & infrastructuur',
    icon: 'wegen',
    accent: 'orange',
    beschrijving: 'De wegen, de straatverlichting en de ondergrondse infrastructuur, zoals kabels en leidingen.',
  },
  {
    key: 'Regels & handhaving',
    label: 'Regels & handhaving',
    icon: 'regels',
    accent: 'green',
    beschrijving: 'De parkregels — het verblijfs- en gebruiksreglement — en hoe daarop wordt toegezien.',
  },
  {
    key: 'Recreatie & voorzieningen',
    label: 'Recreatie & voorzieningen',
    icon: 'recreatie',
    accent: 'yellow',
    beschrijving: 'De gezamenlijke voorzieningen, zoals het recreatiegebied, de tennisbanen, het zwembad en de Boskiosk.',
  },
  {
    key: 'Wonen & bestemmingsplan',
    label: 'Wonen & erfpacht',
    icon: 'wonen',
    accent: 'orange',
    beschrijving: 'Wonen op het landgoed: het bestemmingsplan, de erfpacht en de plannen rond het eigendom van de grond.',
  },
  {
    key: 'Communicatie & nieuwsbrieven',
    label: 'Nieuwsbrieven & mededelingen',
    icon: 'nieuws',
    accent: 'green',
    beschrijving: 'De nieuwsbrieven en mededelingen waarmee bewoners op de hoogte worden gehouden.',
  },
  {
    key: 'Stakeholders & organisatie',
    label: 'Wie is wie (partijen)',
    icon: 'partijen',
    accent: 'yellow',
    beschrijving: 'Welke partijen en organisaties een rol spelen op het landgoed, en wat die rol is.',
  },
];

/** Eenvoudige lijn-iconen (24×24, currentColor). Inner-SVG per onderwerp-key. */
export const ICONEN = {
  bestuur:   '<path d="M3 21h18M4 10l8-6 8 6M6 10v8M10 10v8M14 10v8M18 10v8M4 21v-3h16v3"/>',
  geld:      '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9v6M18 9v6"/>',
  gas:       '<path d="M12 2s5 4 5 9a5 5 0 0 1-10 0c0-2 1.4-3.6 2.5-4.8C9.6 7.7 11 9 11 9s-1-3.8 1-7z"/>',
  natuur:    '<path d="M11 20A7 7 0 0 1 4 13C4 8 8 4 20 4c0 8-4 12-9 12z"/><path d="M5 19c4-5 8-7 12-8"/>',
  water:     '<path d="M12 3s6 6 6 10a6 6 0 0 1-12 0c0-4 6-10 6-10z"/>',
  wegen:     '<path d="M6 21 9 3M18 21 15 3M12 5v3M12 11v3M12 17v2"/>',
  regels:    '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="m9 14 2 2 4-4"/>',
  recreatie: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 0 0 18M12 3a15 15 0 0 1 0 18"/>',
  wonen:     '<path d="M3 11 12 4l9 7M5 10v10h14V10M9 20v-6h6v6"/>',
  nieuws:    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  partijen:  '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 20a5 5 0 0 1 5.5-4.4"/>',
};

/** Per document: een begrijpelijke weergavetitel + neutrale één-regel-duiding.
 *  Geen feitelijke synthese — alleen een toegankelijke herformulering. */
export const WEERGAVE = {
  'inventarisatie-3-documentinhoud-deel1-governance-financien': {
    titel: 'Bestuur, toekomstplannen en geldzaken',
    duiding: 'De juridische basis van de vereniging, het voorstel om de exploitatie-BV om te zetten naar een vereniging, en de financiële structuur.',
  },
  'inventarisatie-3-documentinhoud-deel2-stillewille-nl': {
    titel: 'Recente stukken op de officiële landgoedsite (2025–2026)',
    duiding: 'Nieuwere documenten die op stillewille.nl zijn gepubliceerd, vooral over de periode na de zomer van 2025.',
  },
  'inventarisatie-3-documentinhoud-deel2b-ocr-scans': {
    titel: 'Beheersovereenkomst en bewonersraadverslag (gescande stukken)',
    duiding: 'Twee documenten die alleen als scan bestonden en met tekstherkenning leesbaar zijn gemaakt.',
  },
  'inventarisatie-3-documentinhoud-deel3-sww-notulenreeks': {
    titel: 'Verslagen van bewonersraad en ledenvergaderingen (2023–2025)',
    duiding: 'De reeks vergaderverslagen die de gang van zaken binnen het bestuur door de jaren heen volgt.',
  },
  'inventarisatie-3-documentinhoud-deel3b-losse-eindjes': {
    titel: 'Begroting en jaarcijfers (2023–2024)',
    duiding: 'De exploitatiebegroting, de eigen cijfers van de vereniging en enkele aanvullende bewonersraadverslagen.',
  },
  'inventarisatie-3-documentinhoud-deel4-reglementen-enquete': {
    titel: 'Parkregels, groenplan en de bewonersenquête',
    duiding: 'De bindende parkregels, het natuur-/groenplan, het bestemmingsplan en de uitkomsten van de bewonersenquête.',
  },
  'inventarisatie-3-documentinhoud-deel5-bestemmingsplan-fondsen-brmandaat': {
    titel: 'Bestemmingsplan, fondsen en de rol van de bewonersraad',
    duiding: 'De planregels van het bestemmingsplan, de opzet van de fondsen en de taken en bevoegdheden van de bewonersraad.',
  },
  'inventarisatie-3-documentinhoud-deel6-nieuwsbrieven': {
    titel: 'Nieuwsbrieven van het landgoed (2025–2026)',
    duiding: 'De nieuwsbrieven en korte mededelingen die op stillewille.nl verschenen.',
  },
  'inventarisatie-4-stillewillewonen-start-en-rubriceringsschema': {
    titel: "Standpunt: risico's van een nieuwe vereniging van perceeleigenaren",
    duiding: 'Een kritisch standpunt van een bewonersgroep over de toekomstplannen. Dit stuk legt daarnaast vast hoe deze kennisbank is ingedeeld.',
  },
  'inventarisatie-5-stillewillewonen-pagina-sweep': {
    titel: "Commissies, werkgroepen en pagina's van de bewonerssite",
    duiding: 'Een overzicht van de commissies en werkgroepen en van de overige pagina’s op de bewonerssite.',
  },
  'inventarisatie-6-sww-nieuwsbrieven-2023': {
    titel: 'Bewonersnieuwsbrieven 2023',
    duiding: 'De nieuwsbrieven van de bewonersvereniging uit 2023.',
  },
  'inventarisatie-7-sww-nieuwsbrieven-2024-h1': {
    titel: 'Bewonersnieuwsbrieven 2024 — eerste helft',
    duiding: 'De nieuwsbrieven van de bewonersvereniging uit de eerste helft van 2024.',
  },
  'inventarisatie-8-sww-nieuwsbrieven-2024-h2': {
    titel: 'Bewonersnieuwsbrieven 2024 — tweede helft',
    duiding: 'De nieuwsbrieven van de bewonersvereniging uit de tweede helft van 2024, met onder meer een special over de directie.',
  },
  'inventarisatie-9-sww-nieuwsbrieven-2025': {
    titel: 'Bewonersnieuwsbrieven 2025',
    duiding: 'De laatste nieuwsbrieven van de bewonersredactie, uit begin 2025.',
  },
  'inventarisatie-2-volledige-inhoud-per-onderwerp': {
    titel: 'Alle onderwerpen van beide websites, gebundeld',
    duiding: 'Een brede bundeling van de inhoud van beide Stille Wille-websites, geordend op onderwerp.',
  },
  'inventarisatie-stillewille-nl': {
    titel: 'Overzicht van de officiële landgoedsite (stillewille.nl)',
    duiding: 'Wat er op de officiële site van eigenaar en exploitant staat: structuur, documenten en nieuws.',
  },
  'inventarisatie-stillewillewonen.nl': {
    titel: 'Overzicht van de bewonerssite (stillewillewonen.nl)',
    duiding: 'Wat er op de site van de bewonersvereniging staat: de opzet en een overzicht van de pagina’s.',
  },
};

/** Aanvullende onderwerp-koppeling per document, gegrond in INDEX.md §3.
 *  Brede nieuwsbrieven raken meerdere onderwerpen; deze mapping maakt ze
 *  ook onder die onderwerpen vindbaar zonder de bronbestanden te wijzigen. */
export const EXTRA_RUBRIEKEN = {
  'inventarisatie-6-sww-nieuwsbrieven-2023': ['Wegen & infrastructuur'],
  'inventarisatie-7-sww-nieuwsbrieven-2024-h1': ['Natuur, bomen & groen', 'Wegen & infrastructuur', 'Recreatie & voorzieningen'],
  'inventarisatie-8-sww-nieuwsbrieven-2024-h2': ['Natuur, bomen & groen', 'Water & riolering', 'Wegen & infrastructuur', 'Recreatie & voorzieningen'],
  'inventarisatie-9-sww-nieuwsbrieven-2025': ['Natuur, bomen & groen', 'Wegen & infrastructuur', 'Recreatie & voorzieningen'],
};

/** Neutrale rolomschrijving per partij — voor de "Wie is wie"-ingang. */
export const PARTIJEN_INFO = {
  LSW: { naam: 'LSW — Landgoed Stille Wille B.V.', rol: 'Eigenaar van de grond en verpachter.' },
  SWB: { naam: 'SWB — Stille Wille Brabant B.V.', rol: 'De maatschappij die het park exploiteert en beheert.' },
  SWW: { naam: 'SWW — Stille Wille Wonen', rol: 'De bewonersvereniging, opgericht in 2023.' },
  Bewonersraad: { naam: 'Bewonersraad', rol: 'Overlegorgaan tussen de bewoners en de exploitant/eigenaar.' },
  Klankbordgroep: { naam: 'Klankbordgroep', rol: 'Onafhankelijke bewonersgroep die meedenkt over de toekomst van het landgoed.' },
  gemeente: { naam: 'Gemeente Oirschot', rol: 'Betrokken bij onder meer het bestemmingsplan en de leefbaarheid.' },
  bewonersgroep: { naam: 'Bewonersgroep', rol: 'Groepen bewoners die zich rond een bepaald onderwerp organiseren.' },
  derde: { naam: 'Overige partijen', rol: 'Externe betrokkenen, zoals notaris, adviseurs of leveranciers.' },
};
