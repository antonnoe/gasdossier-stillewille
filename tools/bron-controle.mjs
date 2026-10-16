/**
 * bron-controle.mjs — controleert aangeleverde citaten tegen de openbare bron.
 *
 * Draait op een GitHub-runner, want de sessie van Claude komt alleen bij
 * github.com. Per bron in tools/bron-controle.json: downloaden, tekst
 * eruit halen, en elk opgegeven citaat letterlijk opzoeken. Het rapport en
 * de ruwe tekst blijven op de tak staan zodat de citaten na te lezen zijn;
 * de ruwe tekst wordt vóór samenvoegen weer verwijderd.
 *
 * Gebruik: node tools/bron-controle.mjs <uitvoermap>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const uit = process.argv[2] || '_bron-tekst';
mkdirSync(uit, { recursive: true });

const config = JSON.parse(readFileSync('tools/bron-controle.json', 'utf8'));

// Witruimte, aanhalingstekens en liggende streepjes gelijktrekken: een PDF
// breekt regels af op willekeurige plaatsen en gebruikt andere tekens dan
// een tekstverwerker, dus letterlijk vergelijken mislukt altijd.
function normaliseer(s) {
  return s
    .replace(/­/g, '')
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐-―]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

const regels = [];
regels.push('# Broncontrole');
regels.push('');
regels.push('Automatisch rapport van `tools/bron-controle.mjs`. Per bron: is hij op te halen, en staat elk opgegeven citaat er letterlijk in. Witruimte en aanhalingstekens zijn gelijkgetrokken voordat er vergeleken wordt.');
regels.push('');
regels.push('Gedraaid op: ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC');
regels.push('');

let mislukt = 0;

for (const bron of config.bronnen) {
  regels.push('## ' + bron.titel);
  regels.push('');
  regels.push('- Bron-id: `' + bron.id + '`');
  regels.push('- URL: ' + bron.url);

  let ruw;
  try {
    const res = await fetch(bron.url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'SW-Bieb broncontrole (archief Landgoed De Stille Wille)' },
    });
    regels.push('- HTTP: ' + res.status);
    if (!res.ok) { mislukt++; regels.push(''); continue; }
    ruw = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    regels.push('- HTTP: niet op te halen (' + e.message + ')');
    mislukt++;
    regels.push('');
    continue;
  }

  regels.push('- Grootte: ' + ruw.length + ' bytes');

  let tekst;
  const isPdf = ruw.subarray(0, 5).toString('latin1') === '%PDF-';
  if (isPdf) {
    const pad = join(uit, bron.id + '.pdf');
    writeFileSync(pad, ruw);
    try {
      tekst = execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pad, '-'], {
        maxBuffer: 64 * 1024 * 1024,
      }).toString('utf8');
    } catch (e) {
      regels.push('- Tekst: pdftotext mislukt (' + e.message + ')');
      mislukt++;
      regels.push('');
      continue;
    }
    regels.push('- Soort: PDF');
  } else {
    tekst = ruw.toString('utf8');
    // Open data van rechtspraak.nl komt als XML; alleen de tekst eruit.
    if (tekst.includes('<open-rechtspraak') || tekst.trimStart().startsWith('<?xml')) {
      tekst = tekst.replace(/<[^>]+>/g, ' ');
      regels.push('- Soort: XML (rechtspraak.nl open data)');
    } else {
      regels.push('- Soort: tekst of HTML');
    }
  }

  writeFileSync(join(uit, bron.id + '.txt'), tekst);
  const plat = normaliseer(tekst);
  regels.push('- Tekst: ' + plat.length + ' tekens, opgeslagen als `' + bron.id + '.txt`');
  regels.push('');

  if (!bron.citaten.length) {
    regels.push('Geen citaten opgegeven; alleen opgehaald zodat de tekst na te lezen is.');
    regels.push('');
    continue;
  }

  for (const citaat of bron.citaten) {
    const naald = normaliseer(citaat);
    const pos = plat.indexOf(naald);
    if (pos === -1) {
      regels.push('- **NIET GEVONDEN**: `' + citaat + '`');
      mislukt++;
    } else {
      const van = Math.max(0, pos - 160);
      const tot = Math.min(plat.length, pos + naald.length + 220);
      regels.push('- GEVONDEN: `' + citaat + '`');
      regels.push('  > …' + plat.slice(van, tot) + '…');
    }
  }
  regels.push('');
}

regels.push('---');
regels.push('');
regels.push(mislukt === 0
  ? 'Alles gevonden.'
  : 'Aantal niet gevonden of niet op te halen: ' + mislukt + '. Die regels staan hierboven met **NIET GEVONDEN** of een HTTP-fout.');

writeFileSync(join(uit, 'RAPPORT.md'), regels.join('\n') + '\n');
console.log(regels.join('\n'));
console.log('\nMislukt: ' + mislukt);
