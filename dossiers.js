/**
 * dossiers.js — Registry / single source of truth
 * Kerndossiers Landgoed De Stille Wille
 *
 * Dit is de ENIGE plek die je aanraakt als er een dossier, sub-dossier of
 * sectie bijkomt. chrome.js leest deze data en rendert daaruit:
 *   - de Hoofdpagina-tegels (gegroepeerd per categorie)
 *   - de navigatie (sw-nav)
 *   - de kicker ("Kerndossier · ...")
 *   - de pager (vorige/volgende, berekend uit de volgorde hieronder)
 *   - de "kies kerndossier"-filter op de doorsnede-pagina's
 *
 * SCHEMA per item:
 *   slug         bestandsnaam zonder .html (plat, geen mappen)
 *   type         "kerndossier" | "doorsnede"
 *   titel        weergavenaam
 *   categorie    groepering op de Hoofdpagina, of null voor losse tegel
 *                (alleen kerndossiers; doorsneden hebben geen categorie)
 *   accent       "green" | "yellow" | "orange"  — rouleert; mapt op de
 *                bestaande accent-classes in components.css (geen hex hier)
 *   status       "actief" | "in-voorbereiding"
 *   omschrijving korte tegeltekst (neutraal)
 *   secties      array van { titel, omschrijving, pagina? }
 *                - pagina aanwezig  -> sectie is een eigen .html (zoals Gas)
 *                - pagina afwezig   -> sectie is een accordeon op de startpagina
 *
 * VOLGORDE in deze array = volgorde op de site. Tellingen (bv. "van 11")
 * worden door chrome.js berekend uit de array — nooit hardcoden.
 *
 * BELANGRIJK: omschrijvingen zijn neutraal en topical gehouden. Specifieke
 * cijfers, datums, bedragen en arrest-verwijzingen worden PER DOSSIER tegen
 * de primaire bron geverifieerd vóór publicatie en pas dan toegevoegd.
 */

window.SW_META = {
  // Datum die de hoofdpagina toont als "Bijgewerkt {bijgewerkt}". Pas aan
  // bij iedere inhoudelijke release. Bewuste handmatige knop — geen
  // build-step en geen file-mtime, zodat de getoonde datum overeenstemt
  // met de bedoelde release, niet met willekeurige commits.
  bijgewerkt: "mei 2026"
};

window.SW_DOSSIERS = [

  /* ============================================================
   * 01  ONDERGRONDSE INFRASTRUCTUUR  (categorie · 4 sub-dossiers)
   * ============================================================ */
  {
    slug: "gas",
    type: "kerndossier",
    titel: "Gas",
    categorie: "Ondergrondse infrastructuur",
    accent: "green",
    status: "actief",
    omschrijving: "Het gasnet: historie, juridische basis en de gasrekening.",
    secties: [
      { titel: "Historie",        omschrijving: "Tijdlijn van het gasnet.",                 pagina: "gas-historie.html" },
      { titel: "Juridische basis", omschrijving: "Hofuitspraken en contractuele basis.",     pagina: "gas-juridisch.html" },
      { titel: "Kosten",          omschrijving: "De gasrekening ontleed.",                   pagina: "gas-kosten.html" }
    ]
  },
  {
    slug: "riool",
    type: "kerndossier",
    titel: "Riool",
    categorie: "Ondergrondse infrastructuur",
    accent: "yellow",
    status: "in-voorbereiding",
    omschrijving: "Het rioolstelsel: aanleg, onderhoud en waterhuishouding.",
    secties: [
      { titel: "Historie & 2e canon", omschrijving: "Aanleg en de geschiedenis rond de rioleringsbijdrage." },
      { titel: "Kwaliteit & onderhoud", omschrijving: "Verstoppingen, stankoverlast en verzakkingen." },
      { titel: "Waterhuishouding", omschrijving: "Koppeling met sloten, duikers en oppervlaktewater." }
    ]
  },
  {
    slug: "water",
    type: "kerndossier",
    titel: "Water",
    categorie: "Ondergrondse infrastructuur",
    accent: "orange",
    status: "in-voorbereiding",
    omschrijving: "De waterleiding: kwaliteit, druk en ligging.",
    secties: [
      { titel: "Kwaliteit & druk", omschrijving: "Waterkwaliteit en fluctuaties in de druk." },
      { titel: "Infrastructuur & meters", omschrijving: "Ligging van leidingen en de plaatsing van watermeters." }
    ]
  },
  {
    slug: "cai",
    type: "kerndossier",
    titel: "CAI / Glasvezel",
    categorie: "Ondergrondse infrastructuur",
    accent: "green",
    status: "in-voorbereiding",
    omschrijving: "Het datanetwerk: financiering, kwaliteit en keuzevrijheid.",
    secties: [
      { titel: "De financieringsconstructie", omschrijving: "Hoe de aanleg en afschrijving zijn gefinancierd." },
      { titel: "Kwaliteit & keuzevrijheid", omschrijving: "Betrouwbaarheid van de dienst en de positie van de provider." }
    ]
  },

  /* ============================================================
   * 02  BOVENGRONDSE INFRASTRUCTUUR  (één startpagina · secties)
   * ============================================================ */
  {
    slug: "bovengronds",
    type: "kerndossier",
    titel: "Bovengrondse infrastructuur",
    categorie: null,
    accent: "yellow",
    status: "in-voorbereiding",
    omschrijving: "Wegen, verlichting, recreatie, veiligheid en afval op het landgoed.",
    secties: [
      { titel: "Wegen & paden", omschrijving: "Staat van de wegen en de afweging verharding versus boskarakter." },
      { titel: "Straatverlichting", omschrijving: "Veiligheid versus natuur en de moderniseringsplannen." },
      { titel: "Recreatieve voorzieningen", omschrijving: "Zwembad, tennisbanen en de Boskiosk / het buurthuis." },
      { titel: "Veiligheid & toegang", omschrijving: "Slagbomen, camera's, AED's en bereikbaarheid voor hulpdiensten." },
      { titel: "Afvalverwerking", omschrijving: "Containerkosten en de wens voor milieustraten of ondergrondse containers." }
    ]
  },

  /* ============================================================
   * 03 t/m 08  LOSSE KERNDOSSIERS  (twee lagen · accordeon-secties)
   * ============================================================ */
  {
    slug: "erfpacht",
    type: "kerndossier",
    titel: "Erfpacht",
    categorie: null,
    accent: "orange",
    status: "in-voorbereiding",
    omschrijving: "Contractvormen, grondprijzen en het sociaal plan.",
    secties: [
      { titel: "De contractvormen", omschrijving: "Verschillen tussen de looptijden van de erfpachtcontracten." },
      { titel: "Grondaankoop & prijzen", omschrijving: "Informatievoorziening over kosten per m² en de canonberekening." },
      { titel: "Het sociaal plan", omschrijving: "De regeling voor pachters die de grond niet kopen." }
    ]
  },
  {
    slug: "exploitatieovereenkomst",
    type: "kerndossier",
    titel: "Exploitatieovereenkomst",
    categorie: null,
    accent: "green",
    status: "actief",
    omschrijving: "Rechten en plichten tussen bewoners en exploitant.",
    secties: [
      { titel: "De juridische basis", omschrijving: "Rechten en plichten op basis van de notariële aktes en jurisprudentie." },
      { titel: "Verschillende versies", omschrijving: "Het in omloop zijn van meerdere versies van de overeenkomst." },
      { titel: "Huur opstallen", omschrijving: "De structurele kostenpost voor niet in erfpacht uitgegeven gronden." },
      { titel: "Gedwongen winkelnering", omschrijving: "Contractuele binding aan de exploitant voor diensten." }
    ]
  },
  {
    slug: "ecologie",
    type: "kerndossier",
    titel: "Ecologie",
    categorie: null,
    accent: "yellow",
    status: "in-voorbereiding",
    omschrijving: "Bos, biodiversiteit, bomenkap en omliggende zonneparken.",
    secties: [
      { titel: "Het wandelbos & biodiversiteit", omschrijving: "Beheer van het bos en de afweging park versus natuur." },
      { titel: "Bomenkap & herplantplicht", omschrijving: "Kapvergunningen en het naleven van de herplantplicht." },
      { titel: "Zonneparken omgeving", omschrijving: "Impact van geplande externe zonneparken op de natuur rond het landgoed." }
    ]
  },
  {
    slug: "sww",
    type: "kerndossier",
    titel: "SWW (bewonersvereniging)",
    categorie: null,
    accent: "orange",
    status: "in-voorbereiding",
    omschrijving: "De bewonersvereniging: historie, herstructurering en bestuur.",
    secties: [
      { titel: "De fusiehistorie", omschrijving: "Achtergrond van het samengaan van de voorgaande verenigingen." },
      { titel: "Herstructurering", omschrijving: "Het plan om de exploitatievorm te wijzigen en de analyses daarop." },
      { titel: "Bestuur & commissies", omschrijving: "Overzicht van werkgroepen, taken en vacatures." }
    ]
  },
  {
    slug: "br",
    type: "kerndossier",
    titel: "BR (bewonersraad)",
    categorie: null,
    accent: "green",
    status: "in-voorbereiding",
    omschrijving: "De bewonersraad: bevoegdheden en vertegenwoordiging.",
    secties: [
      { titel: "Positie & mandaat", omschrijving: "De vraag of de raad adviesrecht of instemmingsrecht heeft." },
      { titel: "Samenstelling & transparantie", omschrijving: "Wie de raad vertegenwoordigt en de terugkoppeling naar de achterban." }
    ]
  },
  {
    slug: "mjop",
    type: "kerndossier",
    titel: "MJOP",
    categorie: null,
    accent: "yellow",
    status: "in-voorbereiding",
    omschrijving: "Het meerjarenonderhoudsplan en de onderhoudsfondsen.",
    secties: [
      { titel: "Het conditierapport", omschrijving: "De onafhankelijke conditiemeting als basis voor de planning." },
      { titel: "Investerings- versus reserveringsfonds", omschrijving: "De scheiding tussen de fondsen voor onderhoud en vernieuwing." },
      { titel: "Ontbrekende elementen", omschrijving: "De vraag of zware ondergrondse infrastructuur in het plan is opgenomen." }
    ]
  },

  /* ============================================================
   * DOORSNEDEN  (aparte nav-sectie · "kies kerndossier"-filter)
   * ============================================================ */
  {
    slug: "financieel-overzicht",
    type: "doorsnede",
    titel: "Financieel overzicht (SWB)",
    categorie: null,
    accent: "green",
    status: "actief",
    omschrijving: "Waar gaat het servicekostengeld heen? Jaarrekeningen en exploitatiekosten, gefilterd per dossier.",
    secties: []
  },
  {
    slug: "in-beeld",
    type: "doorsnede",
    titel: "In beeld",
    categorie: null,
    accent: "orange",
    status: "actief",
    omschrijving: "Grafieken, kerncijfers en audio — de cijfers achter de dossiers visueel.",
    secties: []
  },
  {
    slug: "bronnen",
    type: "doorsnede",
    titel: "Bronnen",
    categorie: null,
    accent: "yellow",
    status: "actief",
    omschrijving: "Centrale bronnenbank: alle documenten, uitspraken en rapporten, getagd per dossier.",
    secties: []
  }

];
