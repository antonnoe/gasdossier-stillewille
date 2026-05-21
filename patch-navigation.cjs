const fs = require('fs');
const path = require('path');

const pages = [
  'index.html',
  'historie.html',
  'overzicht.html',
  'juridische-basis.html',
  'financiele-basis.html',
  'bronnen.html'
];

const navItems = [
  { href: '/', label: 'Hoofdpagina', file: 'index.html' },
  { href: '/historie.html', label: 'Historie', file: 'historie.html' },
  { href: '/juridische-basis.html', label: 'Juridische basis', file: 'juridische-basis.html' },
  { href: '/financiele-basis.html', label: 'Financiële basis', file: 'financiele-basis.html' },
  { href: '/bronnen.html', label: 'Bronnen', file: 'bronnen.html' }
];

function buildNav(currentFile) {
  const links = navItems.map((item) => {
    const active = item.file === currentFile ? ' class="active"' : '';
    return `    <a href="${item.href}"${active}>${item.label}</a>`;
  }).join('\n');

  return `<nav class="nav" aria-label="Hoofdnavigatie">\n  <div class="nav-inner">\n${links}\n  </div>\n</nav>`;
}

for (const file of pages) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Skipping ${file}: not found`);
    continue;
  }

  const html = fs.readFileSync(fullPath, 'utf8');
  const patched = html.replace(
    /<nav class="nav" aria-label="Hoofdnavigatie">[\s\S]*?<\/nav>/,
    buildNav(file)
  );

  if (patched === html) {
    console.warn(`No navigation block patched in ${file}`);
    continue;
  }

  fs.writeFileSync(fullPath, patched, 'utf8');
  console.log(`Patched navigation in ${file}`);
}
