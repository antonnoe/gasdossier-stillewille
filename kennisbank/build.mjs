/**
 * build.mjs — manifestgenerator voor de kennisbank
 *
 * Leest alle getagde corpusbestanden (de markdown met YAML front-matter
 * volgens `Inventarisatie-4-...` §A.3), parseert de front-matter en schrijft
 * `corpus.json`: een platte manifest die de overzichtspagina client-side
 * inleest voor weergave en filtering (rubriek, partij, betrouwbaarheid).
 *
 * Single source of truth = de front-matter in de bestanden zelf. Draai dit
 * script opnieuw na elke wijziging aan een corpusbestand:
 *
 *   node build.mjs
 *
 * Geen build-stap in Vercel nodig: corpus.json is een gecommit artefact.
 * De detailpagina haalt het rauwe .md-bestand op en rendert dat met marked.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Minimale YAML-parser voor het platte front-matter-schema (strings +
 *  string-arrays, zowel inline `[]` als block-list met `- `). */
export function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  const body = raw.slice(m[0].length);
  const data = {};
  const lines = m[1].split(/\r?\n/);
  let key = null;
  const unquote = (s) => {
    s = s.trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1);
    }
    return s.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  };
  for (const line of lines) {
    if (!line.trim()) continue;
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && key) {
      if (!Array.isArray(data[key])) data[key] = [];
      data[key].push(unquote(listItem[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
    if (!kv) continue;
    key = kv[1];
    const val = kv[2];
    if (val === '' ) { data[key] = ''; continue; }       // block-list or empty
    if (val === '[]') { data[key] = []; continue; }
    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1).trim();
      data[key] = inner ? inner.split(',').map(unquote) : [];
      continue;
    }
    data[key] = unquote(val);
  }
  return { data, body };
}

/** slug = bestandsnaam zonder .md, lowercase, zonder rare tekens. */
function toSlug(file) {
  return file.replace(/\.md$/i, '').toLowerCase();
}

/** Eerste betekenisvolle alinea uit de body, als korte excerpt. */
function excerptFrom(body) {
  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    if (l.startsWith('#')) continue;                 // sla koppen over
    if (l.startsWith('>')) continue;                 // sla blockquotes over
    if (l.startsWith('|') || l.startsWith('---')) continue;
    // strip markdown-nadruk en links
    const plain = l
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/`/g, '');
    if (plain.length < 40) continue;
    return plain.length > 240 ? plain.slice(0, 237).trimEnd() + '…' : plain;
  }
  return '';
}

function build() {
const files = readdirSync(HERE)
  .filter((f) => /\.md$/i.test(f) && f.toUpperCase() !== 'INDEX.MD');

const docs = [];
for (const file of files) {
  const raw = readFileSync(join(HERE, file), 'utf8');
  const { data, body } = parseFrontMatter(raw);
  if (!data.titel) {
    console.warn('! geen front-matter (overgeslagen):', file);
    continue;
  }
  // headingtelling als grove maat voor leeslengte
  const headings = (body.match(/^#{1,6}\s/gm) || []).length;
  const words = body.split(/\s+/).filter(Boolean).length;
  docs.push({
    slug: toSlug(file),
    bestand: file,
    titel: data.titel || file,
    bron: data.bron || '',
    bron_url: data.bron_url || '',
    bestandsnaam: data.bestandsnaam || '',
    auteur: data.auteur || '',
    datum: data.datum || '',
    brontype: data.brontype || '',
    partij: data.partij || [],
    rubriek_primair: data.rubriek_primair || '',
    rubriek_secundair: data.rubriek_secundair || [],
    status: data.status || '',
    betrouwbaarheid: (data.betrouwbaarheid || '').toUpperCase(),
    tags: data.tags || [],
    kernonderwerpen: data.kernonderwerpen || [],
    verificatiepunten: data.verificatiepunten || [],
    excerpt: excerptFrom(body),
    woorden: words,
    secties: headings,
  });
}

// Sorteer op hoofdrubriek, dan titel — stabiel en voorspelbaar.
docs.sort((a, b) =>
  a.rubriek_primair.localeCompare(b.rubriek_primair, 'nl') ||
  a.titel.localeCompare(b.titel, 'nl'));

// Vaste rubriek- en facetvolgorde uit het schema (§A.1 / §A.2).
const RUBRIEKEN = [
  'Governance & besluitvorming',
  'Financiën & fondsen',
  'Gas & energie',
  'Natuur, bomen & groen',
  'Water & riolering',
  'Wegen & infrastructuur',
  'Regels & handhaving',
  'Recreatie & voorzieningen',
  'Wonen & bestemmingsplan',
  'Communicatie & nieuwsbrieven',
  'Stakeholders & organisatie',
];
const PARTIJEN = ['LSW', 'SWB', 'SWW', 'Bewonersraad', 'Klankbordgroep', 'gemeente', 'bewonersgroep', 'derde'];
const BETROUWBAARHEID = ['GROEN', 'GEEL', 'ORANJE'];

const manifest = {
  gegenereerd: new Date().toISOString().slice(0, 10),
  schema: 'Inventarisatie-4 §A.3',
  telling: docs.length,
  facetten: { rubrieken: RUBRIEKEN, partijen: PARTIJEN, betrouwbaarheid: BETROUWBAARHEID },
  documenten: docs,
};

writeFileSync(join(HERE, 'corpus.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`corpus.json geschreven — ${docs.length} documenten.`);
}

// Alleen genereren bij directe uitvoering (`node build.mjs`); bij import
// (voor parseFrontMatter) geen neveneffecten.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  build();
}
