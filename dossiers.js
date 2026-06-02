/**
 * dossiers.js — Registry / single source of truth
 * Kerndossiers Landgoed De Stille Wille
 *
 * Dit is de ENIGE plek die je aanraakt als er een dossier, sub-dossier of
 * sectie bijkomt. chrome.js leest deze data en rendert daaruit:
 *   - de Hoofdpagina-tegels (gegroepeerd per categorie)
 *   - de navigatie (sw-nav) — alle categorieën als dropdown
 *   - de kicker ("Kerndossier · ..." / "Overzicht")
 *   - de pager (vorige/volgende, berekend uit de volgorde hieronder)
 *   - de status-toggle + de "kies kerndossier"-filter op de overzicht-pagina's
 *
 * SCHEMA per item:
 *   slug         bestandsnaam zonder .html (plat, geen mappen)
 *   type         "kerndossier" | "doorsnede"
 *   titel        weergavenaam
 *   categorie    groepering op de Hoofdpagina en in de nav-dropdown
 *                (alleen kerndossiers; doorsneden vallen onder "Overzichten")
 *   accent       "green" | "yellow" | "orange" — DECORATIEF, rouleert over de
 *                tegels; mapt op de accent-classes in components.css. Dit is
 *                puur sier, geen betekenis.
 *   status       "voltooid" | "in-uitvoering" | "gepland" — de READINESS-as
 *   omschrijving korte tegeltekst (neutraal)
 *   secties      array van { titel, omschrijving, pagina? }
 *                - pagina aanwezig  -> sectie is een eigen .html (zoals Gas)
 *                - pagina afwezig   -> sectie is een accordeon op de startpagina
 *
 * VOLGORDE in deze array = volgorde op de site. Tellingen worden door
 * chrome.js uit de array berekend — nooit hardcoden.
 *
 * ── TWEE ASSEN, NIET VERWARREN ──────────────────────────────────────────
 *   1. READINESS (dit `status`-veld): voltooid / in-uitvoering / gepland.
 *      Zegt hoe ver een PAGINA af is. Wordt VORM-gecodeerd getoond
 *      (vol/half/open stip) in een neutrale kleur.
 *   2. VERIFICATIE (het stoplicht in bronnen.html / tijdlijn / stakeholders):
 *      groen / geel / oranje. Zegt hoe hard een CLAIM is. Wordt KLEUR-gecodeerd
 *      getoond.
 * Deze assen mogen elkaar visueel niet overlappen: "Voltooid" betekent NIET
 * "groen geverifieerd". Houd het groen/geel/oranje-palet daarom weg bij de
 * readiness-stip en -badge.
 *
 * "Voltooid" is altijd een MOMENTOPNAME: opgebouwd en tot de peildatum
 * (SW_META.bijgewerkt) geverifieerd. De situatie op het landgoed verandert;
 * ook een voltooid dossier wordt bijgewerkt zodra er nieuwe feiten zijn.
 *
 * BELANGRIJK: omschrijvingen zijn neutraal en topical gehouden. Specifieke
 * cijfers, datums, bedragen en arrest-verwijzingen worden PER DOSSIER tegen
 * de primaire bron geverifieerd vóór publicatie en pas dan toegevoegd.
 */

window.SW_META = {
  // Datum die de hoofdpagina toont als peildatum en die in de "Voltooid ·
  // {datum}"-badge verschijnt. Pas aan bij iedere INHOUDELIJKE release —
  // een puur structurele wijziging (zoals deze nav-herstructurering)
  // ververst de inhoudelijke peildatum niet.
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
    status: "voltooid",
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
    status: "gepland",
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
    status: "gepland",
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
    status: "gepland",
    omschrijving: "Het datanetwerk: financiering, kwaliteit en keuzevrijheid.",
    secties: [
      { titel: "De financieringsconstructie", omschrijving: "Hoe de aanleg en afschrijving zijn gefinancierd." },
      { titel: "Kwaliteit & keuzevrijheid", omschrijving: "Betrouwbaarheid van de dienst en de positie van de provider." }
    ]
  },

  /* ============================================================
   * 02  BOVENGRONDS & OMGEVING  (categorie · 2 dossiers)
   * ============================================================ */
  {
    slug: "bovengronds",
    type: "kerndossier",
    titel: "Bovengrondse infrastructuur",
    categorie: "Bovengronds & omgeving",
    accent: "yellow",
    status: "gepland",
    omschrijving: "Wegen, verlichting, recreatie, veiligheid en afval op het landgoed.",
    secties: [
      { titel: "Wegen & paden", omschrijving: "Staat van de wegen en de afweging verharding versus boskarakter." },
      { titel: "Straatverlichting", omschrijving: "Veiligheid versus natuur en de moderniseringsplannen." },
      { titel: "Recreatieve voorzieningen", omschrijving: "Zwembad, tennisbanen en de Boskiosk / het buurthuis." },
      { titel: "Veiligheid & toegang", omschrijving: "Slagbomen, camera's, AED's en bereikbaarheid voor hulpdiensten." },
      { titel: "Afvalverwerking", omschrijving: "Containerkosten en de wens voor milieustraten of ondergrondse containers." }
    ]
  },
  {
    slug: "ecologie",
    type: "kerndossier",
    titel: "Ecologie",
    categorie: "Bovengronds & omgeving",
    accent: "orange",
    status: "gepland",
    omschrijving: "Bos, biodiversiteit, bomenkap en omliggende zonneparken.",
    secties: [
      { titel: "Het wandelbos & biodiversiteit", omschrijving: "Beheer van het bos en de afweging park versus natuur." },
      { titel: "Bomenkap & herplantplicht", omschrijving: "Kapvergunningen en het naleven van de herplantplicht." },
      { titel: "Zonneparken omgeving", omschrijving: "Impact van geplande externe zonneparken op de natuur rond het landgoed." }
    ]
  },

  /* ============================================================
   * 03  CONTRACTEN & GROND  (categorie · 2 dossiers)
   * ============================================================ */
  {
    slug: "erfpacht",
    type: "kerndossier",
    titel: "Erfpacht",
    categorie: "Contracten & grond",
    accent: "orange",
    status: "in-uitvoering",
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
    categorie: "Contracten & grond",
    accent: "green",
    status: "voltooid",
    omschrijving: "Rechten en plichten tussen bewoners en exploitant.",
    secties: [
      { titel: "De juridische basis", omschrijving: "Rechten en plichten op basis van de notariële aktes en jurisprudentie." },
      { titel: "Verschillende versies", omschrijving: "Het in omloop zijn van meerdere versies van de overeenkomst." },
      { titel: "Huur opstallen", omschrijving: "De structurele kostenpost voor niet in erfpacht uitgegeven gronden." },
      { titel: "Gedwongen winkelnering", omschrijving: "Contractuele binding aan de exploitant voor diensten." }
    ]
  },

  /* ============================================================
   * 04  ORGANISATIE & BEHEER  (categorie · 3 dossiers)
   * ============================================================ */
  {
    slug: "sww",
    type: "kerndossier",
    titel: "SWW (bewonersvereniging)",
    categorie: "Organisatie & beheer",
    accent: "orange",
    status: "voltooid",
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
    categorie: "Organisatie & beheer",
    accent: "green",
    status: "in-uitvoering",
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
    categorie: "Organisatie & beheer",
    accent: "yellow",
    status: "gepland",
    omschrijving: "Het meerjarenonderhoudsplan en de onderhoudsfondsen.",
    secties: [
      { titel: "Het conditierapport", omschrijving: "De onafhankelijke conditiemeting als basis voor de planning." },
      { titel: "Investerings- versus reserveringsfonds", omschrijving: "De scheiding tussen de fondsen voor onderhoud en vernieuwing." },
      { titel: "Ontbrekende elementen", omschrijving: "De vraag of zware ondergrondse infrastructuur in het plan is opgenomen." }
    ]
  },

  /* ============================================================
   * OVERZICHTEN  (doorsneden · eigen nav-dropdown "Overzichten")
   * Volgorde = volgorde in het "Overzichten"-menu.
   * ============================================================ */
  {
    slug: "financieel-overzicht",
    type: "doorsnede",
    titel: "Financieel overzicht (SWB)",
    categorie: null,
    accent: "green",
    status: "voltooid",
    omschrijving: "Waar gaat het servicekostengeld heen? Jaarrekeningen en exploitatiekosten, gefilterd per dossier.",
    secties: []
  },
  {
    slug: "in-beeld",
    type: "doorsnede",
    titel: "In beeld",
    categorie: null,
    accent: "orange",
    status: "voltooid",
    omschrijving: "Grafieken, kerncijfers en audio — de cijfers achter de dossiers visueel.",
    secties: []
  },
  {
    slug: "tijdlijn",
    type: "doorsnede",
    titel: "Tijdlijn",
    categorie: null,
    accent: "yellow",
    status: "voltooid",
    omschrijving: "De geverifieerde gebeurtenissen rond het landgoed in chronologische volgorde — de feitelijke ruggengraat onder de dossiers.",
    secties: []
  },
  {
    slug: "stakeholders",
    type: "doorsnede",
    titel: "Stakeholders",
    categorie: null,
    accent: "green",
    status: "voltooid",
    omschrijving: "Wie is wie op het landgoed: een structuur- en relatiekaart van grondeigenaar, exploitant, bewoners en vertegenwoordiging.",
    secties: []
  },
  {
    slug: "bronnen",
    type: "doorsnede",
    titel: "Bronnen",
    categorie: null,
    accent: "yellow",
    status: "voltooid",
    omschrijving: "Centrale bronnenbank: alle documenten, uitspraken en rapporten, met verificatieregister en getagd per dossier.",
    secties: []
  }

];
