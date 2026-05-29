/**
 * chrome.js — Registry-driven page chrome
 *
 * Reads window.SW_DOSSIERS (from dossiers.js) and renders:
 *   - sw-nav         (replaces .sw-nav .sw-nav-inner contents)
 *   - kicker         (replaces .page-kicker contents — keeps the .square)
 *   - tile grid      (fills [data-sw-tile-grid] on the home page)
 *   - pager          (fills [data-sw-pager])
 *   - status badge   ([data-sw-status]) — for "in-voorbereiding" pages
 *   - dropdown       ([data-sw-dossier-select]) — doorsnede-pagina's
 *
 * Current page is identified via <body data-slug="..."> (slug = filename
 * without .html). Slug "home" is the landing page.
 */

(function () {
  'use strict';

  var R = window.SW_DOSSIERS || [];
  var META = window.SW_META || {};
  var body = document.body;
  var slug = body.getAttribute('data-slug') || '';

  // --- Lookups -------------------------------------------------------------

  var kerndossiers = R.filter(function (d) { return d.type === 'kerndossier'; });
  var doorsneden   = R.filter(function (d) { return d.type === 'doorsnede'; });

  function findBySlug(s) {
    for (var i = 0; i < R.length; i++) if (R[i].slug === s) return R[i];
    return null;
  }

  // Group kerndossiers by categorie (preserve array order)
  function groupKerndossiers() {
    var groups = []; // [{ categorie, items: [] }]  (categorie === null for losse)
    var seen = {};
    kerndossiers.forEach(function (d) {
      var key = d.categorie || '__los__';
      if (!seen[key]) {
        seen[key] = { categorie: d.categorie, items: [] };
        groups.push(seen[key]);
      }
      seen[key].items.push(d);
    });
    return groups;
  }

  // --- Helpers -------------------------------------------------------------

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (children) children.forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function href(d) {
    return '/' + d.slug + '.html';
  }

  // --- Render: sw-nav ------------------------------------------------------

  function renderNav() {
    var inner = document.querySelector('.sw-nav .sw-nav-inner');
    if (!inner) return;
    inner.innerHTML = '';

    inner.appendChild(linkNav('/', 'Hoofdpagina', slug === 'home'));

    var groups = groupKerndossiers();
    groups.forEach(function (g) {
      if (g.categorie) {
        // grouped — render label + items, label is non-link
        var label = el('span', { class: 'sw-nav-group' });
        label.textContent = g.categorie;
        inner.appendChild(label);
      }
      g.items.forEach(function (d) {
        inner.appendChild(linkNav(href(d), d.titel, d.slug === slug));
      });
    });

    // Doorsneden in a separate visual block
    if (doorsneden.length) {
      var sep = el('span', { class: 'sw-nav-sep' });
      sep.textContent = '·';
      inner.appendChild(sep);
      doorsneden.forEach(function (d) {
        inner.appendChild(linkNav(href(d), d.titel, d.slug === slug));
      });
    }
  }

  function linkNav(h, label, isActive) {
    var a = el('a', { href: h });
    a.textContent = label;
    if (isActive) a.className = 'active';
    return a;
  }

  // --- Render: kicker ------------------------------------------------------

  function renderKicker() {
    var k = document.querySelector('.page-kicker');
    if (!k) return;
    var d = findBySlug(slug);
    if (!d) return;

    var text;
    if (d.type === 'doorsnede') {
      text = 'Doorsnede';
    } else if (d.categorie) {
      text = 'Kerndossier · ' + d.categorie;
    } else {
      text = 'Kerndossier';
    }

    // Preserve any existing .square; replace text content after it.
    k.innerHTML = '';
    k.appendChild(el('span', { class: 'square' }));
    k.appendChild(document.createTextNode(' ' + text));

    if (d.status === 'in-voorbereiding') {
      var b = el('span', { class: 'sw-status-badge' });
      b.textContent = 'in voorbereiding';
      k.appendChild(document.createTextNode(' '));
      k.appendChild(b);
    }
  }

  // --- Render: tile grid (home page) --------------------------------------

  function renderTileGrid() {
    var host = document.querySelector('[data-sw-tile-grid]');
    if (!host) return;
    host.innerHTML = '';

    var groups = groupKerndossiers();
    groups.forEach(function (g, gi) {
      var section = el('section', { class: 'sw-group' });
      if (g.categorie) {
        var head = el('h2', { class: 'sw-group-title', text: g.categorie });
        section.appendChild(head);
      }
      var grid = el('div', { class: 'sw-tile-grid' });
      g.items.forEach(function (d, i) {
        grid.appendChild(buildTile(d));
      });
      section.appendChild(grid);
      host.appendChild(section);
    });

    // Doorsneden in own block
    if (doorsneden.length) {
      var ds = el('section', { class: 'sw-group sw-group-doorsneden' });
      ds.appendChild(el('h2', { class: 'sw-group-title', text: 'Doorsneden' }));
      var dgrid = el('div', { class: 'sw-tile-grid' });
      doorsneden.forEach(function (d) { dgrid.appendChild(buildTile(d)); });
      ds.appendChild(dgrid);
      host.appendChild(ds);
    }
  }

  function buildTile(d) {
    var a = el('a', { class: 'sw-tile sw-tile-' + d.accent, href: href(d) });
    a.setAttribute('data-status', d.status);

    var meta = el('div', { class: 'sw-tile-meta' });
    var titleEl = el('h3', { class: 'sw-tile-title', text: d.titel });
    var desc = el('p', { class: 'sw-tile-desc', text: d.omschrijving });

    if (d.status === 'in-voorbereiding') {
      var b = el('span', { class: 'sw-status-badge' });
      b.textContent = 'in voorbereiding';
      meta.appendChild(b);
    }

    a.appendChild(meta);
    a.appendChild(titleEl);
    a.appendChild(desc);
    return a;
  }

  // --- Render: status-filter (Hoofdpagina) ---------------------------------

  function renderStatusFilter() {
    var host = document.querySelector('[data-sw-status-filter]');
    if (!host) return;

    var btns = [
      { value: 'alles',           label: 'Alles' },
      { value: 'actief',          label: 'Nu live' },
      { value: 'in-voorbereiding', label: 'In voorbereiding' }
    ];

    host.innerHTML = '';
    btns.forEach(function (b) {
      var btn = el('button', { type: 'button', class: 'sw-filter-btn', 'data-filter': b.value });
      btn.textContent = b.label;
      if (b.value === 'alles') btn.className += ' is-active';
      host.appendChild(btn);
    });

    host.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t.matches('.sw-filter-btn')) return;
      var v = t.getAttribute('data-filter');
      host.querySelectorAll('.sw-filter-btn').forEach(function (n) {
        n.classList.toggle('is-active', n === t);
      });
      // Show/hide tiles. Categorie-groups with zero visible tiles get hidden too.
      document.querySelectorAll('.sw-tile[data-status]').forEach(function (tile) {
        var match = v === 'alles' || tile.getAttribute('data-status') === v;
        tile.style.display = match ? '' : 'none';
      });
      document.querySelectorAll('.sw-group').forEach(function (g) {
        var anyVisible = Array.from(g.querySelectorAll('.sw-tile')).some(function (t) {
          return t.style.display !== 'none';
        });
        g.style.display = anyVisible ? '' : 'none';
      });
    });
  }

  // --- Render: pager -------------------------------------------------------

  function renderPager() {
    var host = document.querySelector('[data-sw-pager]');
    if (!host) return;
    var d = findBySlug(slug);
    if (!d) return;

    var list = d.type === 'doorsnede' ? doorsneden : kerndossiers;
    var idx = -1;
    for (var i = 0; i < list.length; i++) if (list[i].slug === slug) { idx = i; break; }
    if (idx < 0) return;

    var prev = idx > 0 ? list[idx - 1] : null;
    var next = idx < list.length - 1 ? list[idx + 1] : null;

    host.innerHTML = '';

    var prevA = el('a', { class: 'pager-prev', href: prev ? href(prev) : '/' });
    prevA.appendChild(el('span', { class: 'pager-dir', text: prev ? '← Vorige' : '← Hoofdpagina' }));
    prevA.appendChild(el('span', { class: 'pager-title', text: prev ? prev.titel : 'Alle dossiers' }));
    host.appendChild(prevA);

    var nextA = el('a', { class: 'pager-next', href: next ? href(next) : '/' });
    nextA.appendChild(el('span', { class: 'pager-dir', text: next ? 'Volgende →' : 'Hoofdpagina →' }));
    nextA.appendChild(el('span', { class: 'pager-title', text: next ? next.titel : 'Alle dossiers' }));
    host.appendChild(nextA);
  }

  // --- Render: dossier-filter dropdown (doorsneden) ------------------------

  function renderDossierSelect() {
    var sel = document.querySelector('[data-sw-dossier-select]');
    if (!sel) return;
    sel.innerHTML = '';

    var allOpt = el('option', { value: 'alle' });
    allOpt.textContent = 'Alle dossiers';
    sel.appendChild(allOpt);

    kerndossiers.forEach(function (d) {
      var o = el('option', { value: d.slug });
      o.textContent = d.titel;
      sel.appendChild(o);
    });

    sel.addEventListener('change', function () {
      var v = sel.value;
      var blocks = document.querySelectorAll('[data-dossier]');
      blocks.forEach(function (b) {
        var tags = (b.getAttribute('data-dossier') || '').split(/\s+/);
        var match = v === 'alle' || tags.indexOf(v) >= 0;
        b.style.display = match ? '' : 'none';
      });
    });
  }

  // --- Render: in-voorbereiding banner on the page header ------------------

  function renderStatusBanner() {
    var d = findBySlug(slug);
    if (!d || d.status !== 'in-voorbereiding') return;
    var host = document.querySelector('[data-sw-status]');
    if (!host) return;
    var box = el('aside', { class: 'callout callout-yellow sw-voorbereiding' });
    box.appendChild(el('div', { class: 'callout-label', text: 'In voorbereiding' }));
    var p = el('p');
    p.textContent = 'Dit dossier is een werkpagina. De secties hieronder zijn neutraal omschreven; ' +
      'specifieke cijfers, datums en bronverwijzingen worden pas opgenomen na verificatie tegen de primaire bron.';
    box.appendChild(p);
    host.appendChild(box);
  }

  // --- Render: bijgewerkt-datum (any element with [data-sw-bijgewerkt]) ----

  function renderBijgewerkt() {
    var nodes = document.querySelectorAll('[data-sw-bijgewerkt]');
    if (!nodes.length || !META.bijgewerkt) return;
    nodes.forEach(function (n) { n.textContent = META.bijgewerkt; });
  }

  // --- Boot ----------------------------------------------------------------

  function boot() {
    renderNav();
    renderKicker();
    renderTileGrid();
    renderPager();
    renderDossierSelect();
    renderStatusBanner();
    renderBijgewerkt();
    renderStatusFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
