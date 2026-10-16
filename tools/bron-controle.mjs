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
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
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

// stillewillewonen.nl staat achter een captcha van de hoster (SiteGround).
// Die geeft op een gewone download HTTP 202 met een verwijspagina naar
// /.well-known/sgcaptcha/ in plaats van het bestand. Een echte browser komt
// er wel langs: eenmaal de voorpagina openen levert het cookie op, waarna de
// download via dezelfde browsercontext lukt. De browser wordt alleen gestart
// als dat nodig blijkt.
let browserContexts = null;

function isUitdaging(buf) {
  const kop = buf.subarray(0, 600).toString('latin1');
  return kop.includes('sgcaptcha') || kop.includes('http-equiv="refresh"');
}

async function viaBrowser(url) {
  if (!browserContexts) {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    browserContexts = { browser, perHost: new Map() };
  }
  const host = new URL(url).origin;
  let context = browserContexts.perHost.get(host);
  if (!context) {
    context = await browserContexts.browser.newContext();
    const page = await context.newPage();
    // De voorpagina openen zet het cookie dat de captcha afgeeft.
    await page.goto(host + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    await page.close();
    browserContexts.perHost.set(host, context);
  }
  const res = await context.request.get(url, { timeout: 60000 });
  return { status: res.status(), body: Buffer.from(await res.body()) };
}

// Tekst uit HTML: scripts en stijl eruit, tags weg, entiteiten terug.
function striptags(h) {
  return h
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&euro;/g, '€')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

// Haalt een bestand op, met de browser als de hoster een captcha geeft.
async function haal(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'SW-Bieb broncontrole (archief Landgoed De Stille Wille)' },
  });
  if (!res.ok) return { status: res.status, body: null };
  let body = Buffer.from(await res.arrayBuffer());
  if (isUitdaging(body)) {
    const tweede = await viaBrowser(url);
    if (tweede.status >= 400 || isUitdaging(tweede.body)) return { status: tweede.status, body: null };
    body = tweede.body;
  }
  return { status: res.status, body };
}

const ocrGebruikt = new Set();
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

    if (isUitdaging(ruw)) {
      regels.push('- Eerste poging gaf een captcha van de hoster; opnieuw geprobeerd via een browser.');
      try {
        const tweede = await viaBrowser(bron.url);
        regels.push('- HTTP via browser: ' + tweede.status);
        if (tweede.status >= 400 || isUitdaging(tweede.body)) {
          regels.push('- **NIET OP TE HALEN**: de captcha blijft staan. Dit bestand moet met de hand worden aangeleverd.');
          mislukt++;
          regels.push('');
          continue;
        }
        ruw = tweede.body;
      } catch (e) {
        regels.push('- **NIET OP TE HALEN** via browser: ' + e.message);
        mislukt++;
        regels.push('');
        continue;
      }
    }
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

    // Een gescande akte levert geen tekstlaag op: pdftotext geeft dan (bijna)
    // niets terug. In dat geval de pagina's omzetten naar afbeeldingen en er
    // OCR over halen. OCR is geen letterlijke bron: een citaat dat alleen zo
    // gevonden wordt, blijft "te controleren aan het origineel".
    if (tekst.replace(/\s/g, '').length < 200) {
      regels.push('- Tekstlaag: leeg of vrijwel leeg, dus een scan. OCR geprobeerd (Nederlands).');
      try {
        const map = join(uit, bron.id + '-ocr');
        mkdirSync(map, { recursive: true });
        execFileSync('pdftoppm', ['-r', '200', '-png', pad, join(map, 'p')], { maxBuffer: 1 << 28 });
        const pagina = readdirSync(map).filter((n) => n.endsWith('.png')).sort();
        const delen = [];
        for (const n of pagina) {
          const uitvoer = execFileSync('tesseract', [join(map, n), 'stdout', '-l', 'nld'], {
            maxBuffer: 1 << 26,
            stdio: ['ignore', 'pipe', 'ignore'],
          }).toString('utf8');
          delen.push('--- ' + n + ' ---\n' + uitvoer);
        }
        tekst = delen.join('\n');
        for (const n of pagina) rmSync(join(map, n));
        rmSync(map, { recursive: true, force: true });
        regels.push('- OCR: ' + pagina.length + " pagina's, " + tekst.length + ' tekens. Let op: OCR, geen letterlijke tekstlaag.');
        ocrGebruikt.add(bron.id);
      } catch (e) {
        regels.push('- OCR mislukt: ' + e.message);
      }
    }
  } else {
    tekst = ruw.toString('utf8');
    // Open data van rechtspraak.nl komt als XML; alleen de tekst eruit.
    if (tekst.includes('<open-rechtspraak') || tekst.trimStart().startsWith('<?xml')) {
      tekst = tekst.replace(/<[^>]+>/g, ' ');
      regels.push('- Soort: XML (rechtspraak.nl open data)');
    } else {
      regels.push('- Soort: tekst of HTML');
    }
    tekst = tekst.includes('<body') || tekst.includes('<p>') ? striptags(tekst) : tekst;
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
      regels.push('- GEVONDEN' + (ocrGebruikt.has(bron.id) ? ' (VIA OCR, niet letterlijk)' : '') + ': `' + citaat + '`');
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

// ── Overzichtspagina's volgen ─────────────────────────────────────────────
// Een mededelingenpagina verwijst naar losse berichten en naar PDF's. Die
// worden hier opgehaald zodat de inhoud na te lezen is; er wordt niets
// gecontroleerd, alleen verzameld.
for (const volg of config.volgen || []) {
  regels.push('## ' + volg.titel);
  regels.push('');
  regels.push('- Overzichtspagina: ' + volg.url);

  const index = await haal(volg.url);
  regels.push('- HTTP: ' + index.status);
  if (!index.body) { mislukt++; regels.push(''); continue; }

  const basis = new URL(volg.url);
  const ruweLinks = [...index.body.toString('utf8').matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const patroon = new RegExp(volg.patroon || '.', 'i');
  const links = [];
  for (const l of ruweLinks) {
    let u;
    try { u = new URL(l, basis); } catch { continue; }
    if (u.hostname.replace(/^www\./, '') !== basis.hostname.replace(/^www\./, '')) continue;
    const isPdfLink = /\.pdf$/i.test(u.pathname);
    if (!isPdfLink && !patroon.test(u.pathname)) continue;
    if (u.href === volg.url) continue;
    u.hash = '';
    if (!links.includes(u.href)) links.push(u.href);
  }
  regels.push('- Gevonden verwijzingen: ' + links.length);

  mkdirSync(join(uit, volg.id), { recursive: true });
  writeFileSync(join(uit, volg.id, '_index.txt'), striptags(index.body.toString('utf8')));

  let n = 0;
  const pdfs = [];
  for (const link of links.slice(0, volg.maxPaginas || 20)) {
    const res = await haal(link);
    if (!res.body) { regels.push('  - ' + link + ' -> HTTP ' + res.status); continue; }
    const isPdf = res.body.subarray(0, 5).toString('latin1') === '%PDF-';
    const naam = (new URL(link).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'pagina') + (isPdf ? '.pdf' : '.txt');
    if (isPdf) {
      const pad = join(uit, volg.id, naam);
      writeFileSync(pad, res.body);
      try {
        const t = execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pad, '-'], { maxBuffer: 1 << 26 }).toString('utf8');
        writeFileSync(pad.replace(/\.pdf$/, '.txt'), t);
        regels.push('  - PDF ' + link + ' -> ' + t.length + ' tekens');
      } catch (e) {
        regels.push('  - PDF ' + link + ' -> pdftotext mislukt');
      }
      pdfs.push(link);
    } else {
      const t = striptags(res.body.toString('utf8'));
      writeFileSync(join(uit, volg.id, naam), t);
      regels.push('  - ' + link + ' -> ' + t.length + ' tekens');
      // Op de pagina zelf kunnen weer PDF's staan.
      for (const m of res.body.toString('utf8').matchAll(/href\s*=\s*["']([^"']+\.pdf)["']/gi)) {
        try {
          const u = new URL(m[1], link);
          if (!pdfs.includes(u.href) && !links.includes(u.href)) links.push(u.href);
        } catch { /* ongeldige link overslaan */ }
      }
    }
    n++;
  }
  regels.push('- Opgehaald: ' + n + " bestanden, opgeslagen in `" + volg.id + "/`");
  regels.push('');
}

if (browserContexts) { await browserContexts.browser.close(); }

writeFileSync(join(uit, 'RAPPORT.md'), regels.join('\n') + '\n');
console.log(regels.join('\n'));
console.log('\nMislukt: ' + mislukt);
