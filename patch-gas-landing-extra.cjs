const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'kostenverdeling-gas.html');

if (!fs.existsSync(file)) {
  console.warn('Skipping kostenverdeling-gas.html: not found');
  process.exit(0);
}

let html = fs.readFileSync(file, 'utf8');

function replaceAllSafe(search, replacement) {
  if (!html.includes(search)) {
    console.warn(`Fragment not found: ${search.slice(0, 90)}...`);
    return;
  }
  html = html.split(search).join(replacement);
}

replaceAllSafe(
  '<div class="owner">Rolverdeling<br>SWB / LSW</div>',
  '<div class="owner">SWB: onderhoud<br>LSW: vervanging</div>'
);

replaceAllSafe(
  '<h3>Per mei 2026</h3>\n            <p>Lekverlies boven 5% wordt in de algemene exploitatie opgenomen.</p>',
  '<h3>Volgens mededeling mei 2026</h3>\n            <p>Lekverlies boven 5% wordt niet langer uitsluitend via gasgebruikers verrekend.</p>'
);

replaceAllSafe(
  '<p>Welke kosten zijn daadwerkelijk geleverde energie, welke kosten zijn lekverlies vóór de meter, welke kosten zijn onderhoud door SWB, en welke kosten horen bij vervanging of een redelijk alternatief voor vervanging?</p>',
  '<p>Welke kosten zijn daadwerkelijk geleverde energie aan de individuele meter? Welke kosten zijn lekverlies vóór de meter? Welke kosten zijn onderhoud door SWB? En welke kosten horen bij vervanging of een redelijk alternatief voor vervanging?</p><p><strong>Gedwongen afname vraagt om redelijke prijsstelling:</strong> zolang bewoners via SWB moeten afnemen, moet de prijs controleerbaar, redelijk en herleidbaar zijn.</p>'
);

replaceAllSafe(
  '<p>Bewoners betalen servicekosten aan SWB voor onderhoud en instandhouding. De rechterlijke lijn wijst grootschalige vervanging van het gasnet toe aan LSW. De kernvraag is wanneer reactief onderhoud feitelijk vervanging gaat maskeren.</p>',
  '<p>Bewoners betalen servicekosten aan SWB voor onderhoud en instandhouding. De Bossche arresten vormen een zwaar juridisch aanknopingspunt dat grootschalige vervanging van het gasnet niet via de exploitatie aan bewoners kan worden doorgeschoven.</p><p>De kernvraag is wanneer reactief onderhoud, lekherstel en verliesdoorbelasting feitelijk de gevolgen van uitgestelde vervanging maskeren.</p>'
);

replaceAllSafe(
  'Een gezamenlijke lijn geeft meer duidelijkheid over kosten, verantwoordelijkheid en rechtspositie.',
  'Een gezamenlijke lijn geeft meer duidelijkheid over prijs, levering, onderhoud, vervanging en rechtspositie.'
);

replaceAllSafe(
  '<p>Bewoners betalen servicekosten aan Stille Wille Brabant B.V. (SWB). Binnen de bestaande verhoudingen is SWB verantwoordelijk voor onderhoud en instandhouding van de voorzieningen.</p>\n    <p>De verantwoordelijkheid voor grootschalige vervanging van het gasnet ligt volgens de rechterlijke lijn bij de landgoedeigenaar Landgoed Stille Wille B.V. (LSW).</p>',
  '<p>Bewoners betalen servicekosten aan Stille Wille Brabant B.V. (SWB). Binnen de bestaande verhoudingen is SWB verantwoordelijk voor onderhoud en instandhouding van de voorzieningen.</p>\n    <p>De Bossche arresten vormen een zwaar juridisch aanknopingspunt dat grootschalige vervanging van het gasnet niet via de exploitatie aan bewoners kan worden doorgeschoven. De verantwoordelijkheid voor grootschalige vervanging ligt daarmee nadrukkelijk bij de landgoedeigenaar Landgoed Stille Wille B.V. (LSW), voor zover deze rechterlijke lijn op de actuele situatie van toepassing is.</p>'
);

fs.writeFileSync(file, html, 'utf8');
console.log('Applied extra legal sharpening to kostenverdeling-gas.html');
