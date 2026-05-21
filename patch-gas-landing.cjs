const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'kostenverdeling-gas.html');

if (!fs.existsSync(file)) {
  console.warn('Skipping kostenverdeling-gas.html: not found');
  process.exit(0);
}

let html = fs.readFileSync(file, 'utf8');

function replaceOnce(search, replacement) {
  if (!html.includes(search)) {
    console.warn(`Fragment not found: ${search.slice(0, 90)}...`);
    return;
  }
  html = html.replace(search, replacement);
}

replaceOnce(
  'De discussie gaat niet over gasgebruikers tegen niet-gasgebruikers. De kernvraag is wie verantwoordelijk is voor lekverlies, onderhoud en vervanging van het gemeenschappelijke gasnet.',
  'De discussie gaat niet over gasgebruikers tegen niet-gasgebruikers. De kernvraag is of gedwongen afname nog verdedigbaar is wanneer de prijs niet meer herleidbaar is tot bruikbare energie aan de individuele meter, normale leveringskosten en contractueel toelaatbare exploitatiekosten.'
);

replaceOnce(
  '<p>Het probleem is dat lekverlies en verouderde infrastructuur worden vertaald naar een verdeelvraag tussen bewoners. Daardoor verdwijnt de infrastructuurverantwoordelijkheid uit beeld.</p>',
  '<p>Het probleem is dat lekverlies, uitgestelde vervanging en administratieve correcties kunnen worden vertaald naar een verdeelvraag tussen bewoners. Juist bij gedwongen afname moet de prijsstelling controleerbaar, redelijk en herleidbaar zijn.</p>'
);

replaceOnce(
  'Beide groepen hebben belang bij transparantie over lekverlies, eigendom, onderhoudsplicht, vervangingsplicht en kostenverdeling.',
  'Beide groepen hebben belang bij transparantie over lekverlies, redelijke prijsstelling, onderhoud door SWB, vervanging door LSW en de vraag wie betaalt voor alternatieven wanneer het oude leidingennet feitelijk niet meer houdbaar is.'
);

replaceOnce(
  '<div class="owner">Eigenaar<br>(LSW)</div>',
  '<div class="owner">Rolverdeling<br>SWB / LSW</div>'
);

replaceOnce(
  '<p>De aandacht verschuift van infrastructuurverantwoordelijkheid naar een discussie tussen bewonersgroepen.</p>',
  '<p>De aandacht verschuift van redelijke prijsstelling en infrastructuurverantwoordelijkheid naar een discussie tussen bewonersgroepen.</p>'
);

replaceOnce(
  '<p>Welke kosten zijn individueel verbruik, welke kosten zijn lekverlies, en welke kosten horen bij onderhoud of vervanging van het gemeenschappelijke net?</p>',
  '<p>Welke kosten zijn daadwerkelijk geleverde energie, welke kosten zijn lekverlies vóór de meter, welke kosten zijn onderhoud door SWB, en welke kosten horen bij vervanging of een redelijk alternatief voor vervanging?</p>'
);

replaceOnce(
  '<h3><span class="badge blue">B</span>Spreek de eigenaar gezamenlijk aan</h3>\n          <p>De centrale vraag blijft: wie is verantwoordelijk voor onderhoud, vervanging en financiering van de gemeenschappelijke infrastructuur?</p>\n          <div class="icon-row"><span class="big-icon">👥</span><span class="big-icon">⚖</span><span class="big-icon">€</span></div>',
  '<h3><span class="badge blue">B</span>Houd de rolverdeling scherp</h3>\n          <p>Bewoners betalen servicekosten aan SWB voor onderhoud en instandhouding. De rechterlijke lijn wijst grootschalige vervanging van het gasnet toe aan LSW. De kernvraag is wanneer reactief onderhoud feitelijk vervanging gaat maskeren.</p>\n          <div class="icon-row"><span class="big-icon">👥</span><span class="big-icon">⚖</span><span class="big-icon">🔧</span></div>'
);

replaceOnce(
  'De discussie kan verschuiven van: <strong>“Wie is verantwoordelijk voor het oude gasnet?”</strong> naar: <strong>“Welke bewonersgroep moet betalen?”</strong>',
  'De discussie kan verschuiven van: <strong>“Is de prijs nog redelijk en herleidbaar tot bruikbare energie aan de meter?”</strong> naar: <strong>“Welke bewonersgroep moet betalen?”</strong>'
);

replaceOnce(
  'Dat is de valkuil. Gasgebruikers en niet-gasgebruikers hebben op dit punt een gezamenlijk belang: duidelijkheid over eigendom, onderhoudsplicht, vervangingsplicht en kostenverdeling.',
  'Dat is de valkuil. Gasgebruikers en niet-gasgebruikers hebben op dit punt een gezamenlijk belang: duidelijkheid over normale levering, redelijke prijsstelling, onderhoud door SWB, vervanging door LSW en de betaling van redelijke alternatieven.'
);

replaceOnce(
  '<section class="section">\n    <h2>4. De gezamenlijke lijn</h2>\n    <p>Bewoners hoeven het niet eens te zijn over gasgebruik, energietransitie of individuele keuzes. Zij hebben wél een gezamenlijk belang bij één uitgangspunt:</p>\n    <div class="warning">\n      <p><strong>Lekverlies door verouderde gemeenschappelijke infrastructuur mag niet ongemerkt worden omgezet in een onderlinge rekening tussen bewoners zonder volledige technische, financiële en juridische onderbouwing.</strong></p>\n    </div>\n  </section>',
  '<section class="section">\n    <h2>4. Gedwongen afname vraagt om een redelijke prijs</h2>\n    <p>Zolang bewoners contractueel verplicht zijn gas via SWB af te nemen en geen eigen leverancier of gastank mogen kiezen, is een redelijke en controleerbare prijsstelling onderdeel van die afnamepositie.</p>\n    <p>De bewoner betaalt voor bruikbare energie die zijn individuele meter bereikt. Gas dat vóór die meter verloren gaat door een verouderd of lekkend distributienet is geen individueel verbruik. Zulke verliezen kunnen alleen worden doorbelast als de technische, financiële en juridische grondslag volledig inzichtelijk is.</p>\n    <div class="warning">\n      <h3>De kernvraag</h3>\n      <p>Is de gehanteerde prijs nog een redelijke leveringsprijs, of feitelijk een doorbelasting van lekverlies, administratief herstel en uitgestelde vervanging?</p>\n    </div>\n  </section>\n\n  <section class="section">\n    <h2>5. Onderhoud door SWB, vervanging door LSW</h2>\n    <p>Bewoners betalen servicekosten aan Stille Wille Brabant B.V. (SWB). Binnen de bestaande verhoudingen is SWB verantwoordelijk voor onderhoud en instandhouding van de voorzieningen.</p>\n    <p>De verantwoordelijkheid voor grootschalige vervanging van het gasnet ligt volgens de rechterlijke lijn bij de landgoedeigenaar Landgoed Stille Wille B.V. (LSW).</p>\n    <div class="warning">\n      <h3>Wanneer wordt onderhoud geen onderhoud meer?</h3>\n      <p>De toetsingsvraag is wanneer telkens reactief onderhoud, storingsherstel en lekverliesbestrijding in strijd komen met redelijkheid en billijkheid, omdat de infrastructuur feitelijk aan vervanging toe is en de daarvoor verantwoordelijke partij geen structurele oplossing biedt.</p>\n    </div>\n  </section>\n\n  <section class="section">\n    <h2>6. Alternatieven voor vervanging</h2>\n    <p>Bewoners spreken over verschillende routes: een gastank per woning, een gezamenlijke gastank voor meerdere woningen met individuele afnamemeters, of volledige overstap naar warmtepomp, batterijopslag en zonnepanelen. Een groot aantal bewoners heeft die laatste route al gekozen.</p>\n    <p>Daarmee ontstaat een tweede vraag: als deze alternatieven feitelijk in de plaats komen van vervanging van het oude leidingennet, ligt de investering dan uitsluitend bij individuele bewoners, of mag van LSW een bijdrage worden verwacht omdat daarmee een vervangingsplicht of infrastructuurprobleem wordt opgelost?</p>\n  </section>\n\n  <section class="section">\n    <h2>7. De gezamenlijke lijn</h2>\n    <p>Bewoners hoeven het niet eens te zijn over gasgebruik, energietransitie of individuele keuzes. Zij hebben wél een gezamenlijk belang bij één uitgangspunt:</p>\n    <div class="warning">\n      <p><strong>Lekverlies door verouderde gemeenschappelijke infrastructuur mag niet ongemerkt worden omgezet in een onderlinge rekening tussen bewoners zonder volledige technische, financiële en juridische onderbouwing.</strong></p>\n    </div>\n  </section>'
);

replaceOnce(
  '<li>Welke kosten zijn onderhoud?</li>\n      <li>Welke kosten zijn vervanging?</li>\n      <li>Wie is eigenaar van de infrastructuur?</li>\n      <li>Wie heeft juridisch de verplichting tot instandhouding of vervanging?</li>',
  '<li>Welke kosten zijn onderhoud en instandhouding door SWB?</li>\n      <li>Welke kosten zijn grootschalige vervanging door LSW?</li>\n      <li>Welke prijs is redelijk voor bruikbare energie aan de individuele meter?</li>\n      <li>Wanneer wordt reactief onderhoud niet langer redelijk houdbaar?</li>\n      <li>Welke alternatieven vervangen feitelijk het oude leidingennet?</li>\n      <li>Moeten bewoners die alternatieven volledig zelf betalen, of ligt een bijdrage van LSW voor de hand?</li>'
);

fs.writeFileSync(file, html, 'utf8');
console.log('Patched kostenverdeling-gas.html content');
