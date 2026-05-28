const fs = require('fs');
const path = require('path');

const pages = [
  'index.html',
  'historie.html',
  'overzicht.html',
  'kostenverdeling-gas.html',
  'juridische-basis.html',
  'financiele-basis.html',
  'financieel-overzicht.html',
  'in-beeld.html',
  'bronnen.html'
];

const navItems = [
  { href: '/', label: 'Hoofdpagina', file: 'index.html' },
  { href: '/historie.html', label: 'Historie', file: 'historie.html' },
  { href: '/juridische-basis.html', label: 'Juridische basis', file: 'juridische-basis.html' },
  { href: '/financiele-basis.html', label: 'Gasrekening', file: 'financiele-basis.html' },
  { href: '/financieel-overzicht.html', label: 'Financieel overzicht', file: 'financieel-overzicht.html' },
  { href: '/in-beeld.html', label: 'In beeld', file: 'in-beeld.html' },
  { href: '/bronnen.html', label: 'Bronnen', file: 'bronnen.html' }
];

function buildNav(currentFile) {
  const links = navItems.map((item) => {
    const active = item.file === currentFile ? ' class="active"' : '';
    return `    <a href="${item.href}"${active}>${item.label}</a>`;
  }).join('\n');

  return `<nav class="nav" aria-label="Hoofdnavigatie">\n  <div class="nav-inner">\n${links}\n  </div>\n</nav>`;
}

function patchSharedContent(html) {
  return html
    .replaceAll('mailto:commissies@stillewillewonen.nl', 'mailto:info@stillewillewonen.nl')
    .replaceAll('commissies@stillewillewonen.nl', 'info@stillewillewonen.nl')
    .replaceAll('href="/Onderzoek_Breedveld_Schoenmaker_2020.pdf" target="_blank" rel="noopener" style="display:inline-block;background:var(--maroon);color:#fff;text-decoration:none;padding:8px 16px;border-radius:4px;font-weight:600;font-size:0.92em">Open rapport (PDF)</a>', 'href="https://www.vhsw.nl/gasonderzoek/" target="_blank" rel="noopener" style="display:inline-block;background:var(--maroon);color:#fff;text-decoration:none;padding:8px 16px;border-radius:4px;font-weight:600;font-size:0.92em">Open gasonderzoek bij VHSW</a>')
    .replaceAll('Ook beschikbaar via het <a href="https://stillewillewonen.nl/archief/" target="_blank" rel="noopener">archief van Stille Wille Wonen</a>.', 'Primaire projectpagina: <a href="https://www.vhsw.nl/gasonderzoek/" target="_blank" rel="noopener">vhsw.nl/gasonderzoek</a> · Lokale kopie: <a href="/Onderzoek_Breedveld_Schoenmaker_2020.pdf" target="_blank" rel="noopener">PDF in dit dossier</a>.')
    .replaceAll('Het volledige rapport Breedveld/Schoenmaker (juni 2020) is rechtstreeks beschikbaar als <a href="/Onderzoek_Breedveld_Schoenmaker_2020.pdf" target="_blank" rel="noopener">PDF</a>, of via het archief van <a href="https://stillewillewonen.nl/archief/" target="_blank" rel="noopener">Stille Wille Wonen</a>.', 'Het volledige rapport Breedveld/Schoenmaker (juni 2020) is beschikbaar via de primaire projectpagina <a href="https://www.vhsw.nl/gasonderzoek/" target="_blank" rel="noopener">vhsw.nl/gasonderzoek</a>. Daarnaast blijft een <a href="/Onderzoek_Breedveld_Schoenmaker_2020.pdf" target="_blank" rel="noopener">lokale PDF-kopie</a> in dit dossier beschikbaar.');
}

for (const file of pages) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Skipping ${file}: not found`);
    continue;
  }

  const html = fs.readFileSync(fullPath, 'utf8');
  let patched = html.replace(
    /<nav class="nav" aria-label="Hoofdnavigatie">[\s\S]*?<\/nav>/,
    buildNav(file)
  );
  patched = patchSharedContent(patched);

  if (patched === html) {
    console.warn(`No changes applied in ${file}`);
    continue;
  }

  fs.writeFileSync(fullPath, patched, 'utf8');
  console.log(`Patched ${file}`);
}
