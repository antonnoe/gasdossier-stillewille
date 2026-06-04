/**
 * chrome.js — Registry-driven page chrome
 *
 * Reads window.SW_DOSSIERS (from dossiers.js) and renders:
 *   - sw-nav         (replaces .sw-nav .sw-nav-inner contents)
 *   - kicker         (replaces .page-kicker contents — keeps the .square)
 *   - tile grid      (fills [data-sw-tile-grid] on the home page)
 *   - pager          (fills [data-sw-pager])
 *   - status badge   ([data-sw-status]) — banner for in-uitvoering / gepland
 *   - status filter  ([data-sw-status-filter]) — readiness-toggle
 *   - dropdown       ([data-sw-dossier-select]) — overzicht-pagina's
 *
 * Current page is identified via <body data-slug="...">. Slug "home" = landing.
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

  // --- Status (readiness) helpers ------------------------------------------
  // LET OP: readiness (voltooid/in-uitvoering/gepland) is een ANDERE as dan
  // de verificatie-stoplicht (groen/geel/oranje). Readiness = VORM-gecodeerd
  // (vol/half/open) in neutrale kleur via currentColor — nooit het
  // stoplicht-palet, om verwarring te voorkomen.
  var STATUS_LABEL = {
    'voltooid': 'Voltooid',
    'in-uitvoering': 'Werk in uitvoering',
    'gepland': 'Later in 2026 gepland'
  };
  var STATUS_DOT = {
    'voltooid': 'sw-dot--vol',
    'in-uitvoering': 'sw-dot--half',
    'gepland': 'sw-dot--open'
  };

  function statusLabel(d) {
    var base = STATUS_LABEL[d.status] || '';
    if (d.status === 'voltooid' && META.bijgewerkt) base += ' · ' + META.bijgewerkt;
    return base;
  }

  function statusBadge(d) {
    if (!d || !d.status) return null;
    var b = el('span', { class: 'sw-status-badge sw-status-badge--' + d.status });
    b.appendChild(el('span', { class: 'sw-dot ' + (STATUS_DOT[d.status] || ''), 'aria-hidden': 'true' }));
    b.appendChild(document.createTextNode(statusLabel(d)));
    return b;
  }

  function statusDot(d) {
    if (!d || !d.status) return null;
    return el('span', { class: 'sw-dot ' + (STATUS_DOT[d.status] || ''), 'aria-hidden': 'true', title: STATUS_LABEL[d.status] || '' });
  }

  // --- Render: sw-nav ------------------------------------------------------

  function ensureMobileToggle() {
    var nav = document.querySelector('.sw-nav');
    if (!nav || nav.querySelector('.sw-nav-toggle')) return;

    var btn = el('button', {
      type: 'button',
      class: 'sw-nav-toggle',
      'aria-label': 'Menu',
      'aria-expanded': 'false',
      'aria-controls': 'sw-nav-inner'
    });
    // Hamburger icon (CSS-driven) — three bars rendered via SVG for crispness.
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">' +
      '<path class="sw-nav-toggle-bars" d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path class="sw-nav-toggle-cross" d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '</svg>';
    nav.insertBefore(btn, nav.firstChild);

    var inner = nav.querySelector('.sw-nav-inner');
    if (inner && !inner.id) inner.id = 'sw-nav-inner';

    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Esc closes the drawer.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function renderNav() {
    var inner = document.querySelector('.sw-nav .sw-nav-inner');
    if (!inner) return;
    inner.innerHTML = '';

    inner.appendChild(linkNav('/', 'Hoofdpagina', slug === 'home'));

    var groups = groupKerndossiers();
    groups.forEach(function (g) {
      if (g.categorie) {
        // Real grouping: trigger + panel, CSS-driven dropdown.
        var grp = el('div', { class: 'sw-nav-grp' });
        var anyActive = g.items.some(function (d) { return d.slug === slug; });
        var trigger = el('button', {
          type: 'button',
          class: 'sw-nav-grp-trigger' + (anyActive ? ' is-active' : ''),
          'aria-haspopup': 'true',
          'aria-expanded': 'false'
        });
        trigger.appendChild(document.createTextNode(g.categorie + ' '));
        trigger.appendChild(el('span', { class: 'sw-nav-grp-caret', 'aria-hidden': 'true', text: '▾' }));
        grp.appendChild(trigger);

        var panel = el('div', { class: 'sw-nav-grp-panel', role: 'menu' });
        g.items.forEach(function (d) {
          var a = el('a', { href: href(d), role: 'menuitem' });
          var dot = statusDot(d); if (dot) a.appendChild(dot);
          a.appendChild(document.createTextNode(d.titel));
          if (d.slug === slug) a.className = 'active';
          panel.appendChild(a);
        });
        grp.appendChild(panel);
        inner.appendChild(grp);
      } else {
        g.items.forEach(function (d) {
          inner.appendChild(linkNav(href(d), d.titel, d.slug === slug));
        });
      }
    });

    // Doorsneden onder één dropdown "Overzichten".
    if (doorsneden.length) {
      var dgrp = el('div', { class: 'sw-nav-grp' });
      var dAnyActive = doorsneden.some(function (d) { return d.slug === slug; });
      var dTrigger = el('button', {
        type: 'button',
        class: 'sw-nav-grp-trigger' + (dAnyActive ? ' is-active' : ''),
        'aria-haspopup': 'true',
        'aria-expanded': 'false'
      });
      dTrigger.appendChild(document.createTextNode('Overzichten '));
      dTrigger.appendChild(el('span', { class: 'sw-nav-grp-caret', 'aria-hidden': 'true', text: '▾' }));
      dgrp.appendChild(dTrigger);

      var dPanel = el('div', { class: 'sw-nav-grp-panel', role: 'menu' });
      doorsneden.forEach(function (d) {
        var a = el('a', { href: href(d), role: 'menuitem' });
        var dot = statusDot(d); if (dot) a.appendChild(dot);
        a.appendChild(document.createTextNode(d.titel));
        if (d.slug === slug) a.className = 'active';
        dPanel.appendChild(a);
      });
      dgrp.appendChild(dPanel);
      inner.appendChild(dgrp);
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
      text = 'Overzicht';
    } else if (d.categorie) {
      text = 'Kerndossier · ' + d.categorie;
    } else {
      text = 'Kerndossier';
    }

    // Preserve any existing .square; replace text content after it.
    k.innerHTML = '';
    k.appendChild(el('span', { class: 'square' }));
    k.appendChild(document.createTextNode(' ' + text));

    var kb = statusBadge(d);
    if (kb) { k.appendChild(document.createTextNode(' ')); k.appendChild(kb); }
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
      ds.appendChild(el('h2', { class: 'sw-group-title', text: 'Overzichten' }));
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

    var tb = statusBadge(d);
    if (tb) meta.appendChild(tb);

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
      { value: 'voltooid',      label: 'Voltooid' },
      { value: 'in-uitvoering', label: 'Werk in uitvoering' },
      { value: 'gepland',       label: 'Later in 2026 gepland' },
      { value: 'alles',         label: 'Alles' }
    ];
    var DEFAULT = 'voltooid';

    host.innerHTML = '';
    btns.forEach(function (b) {
      var btn = el('button', { type: 'button', class: 'sw-filter-btn', 'data-filter': b.value });
      btn.textContent = b.label;
      if (b.value === DEFAULT) btn.className += ' is-active';
      host.appendChild(btn);
    });

    function applyFilter(v) {
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
    }

    host.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t.matches('.sw-filter-btn')) return;
      var v = t.getAttribute('data-filter');
      host.querySelectorAll('.sw-filter-btn').forEach(function (n) {
        n.classList.toggle('is-active', n === t);
      });
      applyFilter(v);
    });

    applyFilter(DEFAULT); // hoofdpagina opent met "Voltooid"
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

  // --- Render: dossier-filter dropdown (overzicht-pagina's) ----------------

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

  // --- Render: status-banner op de page header -----------------------------

  function renderStatusBanner() {
    var d = findBySlug(slug);
    if (!d) return;
    if (d.status !== 'in-uitvoering' && d.status !== 'gepland') return; // 'voltooid' krijgt geen banner
    var host = document.querySelector('[data-sw-status]');
    if (!host) return;

    var cfg = d.status === 'in-uitvoering'
      ? { cls: 'callout-yellow', label: 'Werk in uitvoering',
          txt: 'Dit dossier is in bewerking. Onderdelen kunnen nog onvolledig zijn; specifieke cijfers, datums en bronverwijzingen worden pas opgenomen na verificatie tegen de primaire bron.' }
      : { cls: 'callout-orange', label: 'Later in 2026 gepland',
          txt: 'Dit dossier is gepland voor later in 2026. De indeling hieronder is voorlopig; er is nog geen geverifieerde inhoud opgenomen.' };

    var box = el('aside', { class: 'callout ' + cfg.cls + ' sw-voorbereiding' });
    box.appendChild(el('div', { class: 'callout-label', text: cfg.label }));
    box.appendChild(el('p', { text: cfg.txt }));
    host.appendChild(box);
  }

  // --- Tabellen: scrollbaar kader om elke <table> in .page-main -----------
  // Wikkelt elke tabel die nog niet in een .sw-table-wrap zit. Tabellen die
  // al (handmatig) gewrapt zijn worden overgeslagen, zodat er nooit een
  // dubbele wrapper ontstaat.
  function wrapTables() {
    var tables = document.querySelectorAll('.page-main table');
    tables.forEach(function (table) {
      if (table.closest('.sw-table-wrap')) return;
      var wrap = el('div', { class: 'sw-table-wrap' });
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  // --- Render: bijgewerkt-datum (any element with [data-sw-bijgewerkt]) ----

  function renderBijgewerkt() {
    var nodes = document.querySelectorAll('[data-sw-bijgewerkt]');
    if (!nodes.length || !META.bijgewerkt) return;
    nodes.forEach(function (n) { n.textContent = META.bijgewerkt; });
  }

  // --- Render: openings-modal (site-breed, geen opslag) -------------------
  // Eén bron voor alle pagina's: chrome.js wordt overal ingeladen. Geen
  // localStorage/sessionStorage (werkt niet in deze omgeving), dus de modal
  // verschijnt elke sessie — daarom rustig vormgegeven en snel weg te klikken.
  function renderIntroModal() {
    if (document.querySelector('.sw-modal-overlay')) return;

    // Eénmaal per sessie tonen (de site bestaat uit losse HTML-pagina's,
    // dus boot() draait bij elke navigatie). try/catch: als de browser
    // opslag blokkeert, verschijnt de modal gewoon — liever een keer te
    // veel dan een gebroken pagina.
    try {
      if (sessionStorage.getItem('sw-intro-seen')) return;
      sessionStorage.setItem('sw-intro-seen', '1');
    } catch (e) { /* opslag geblokkeerd: modal toch tonen */ }

    var overlay = el('div', {
      class: 'sw-modal-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'sw-modal-title'
    });
    var modal = el('div', { class: 'sw-modal' });

    var close = el('button', { type: 'button', class: 'sw-modal-close', 'aria-label': 'Sluiten' });
    close.innerHTML = '&times;';
    modal.appendChild(close);

    modal.appendChild(el('h2', { id: 'sw-modal-title', text: 'Over deze website' }));

    var blocks = [
      ['Wat dit is', 'Een feitelijke werkverzameling van dossiers over Landgoed De Stille Wille — gas, financiën en beheer — bedoeld voor de 324 huishoudens.'],
      ['Het doel', 'Niet stelling nemen of een partij aanklagen, maar de feiten en de onderliggende stukken navolgbaar bij elkaar brengen, zodat iedereen zich een eigen oordeel kan vormen.'],
      ['De principes', 'Alles wordt getoetst aan primaire bronnen — vonnissen, contracten, jaarrekeningen. Verschillen van inzicht worden zichtbaar gemaakt als open vragen, niet als conclusies. Er worden geen persoonsnamen genoemd. De inhoud is geen juridisch advies.'],
      ['Een levend dossier', 'Deze site is een levend, digitaal organisme dat voortdurend zal meebewegen en een inhoudelijke en interactieve dynamiek zal krijgen die in alle dossiers zichtbaar wordt. Het streven is dat een aanpassing in één categorie ook de gerelateerde categorieën laat meebewegen. De site groeit: dossiers worden toegevoegd en aangescherpt, en feedback is welkom.']
    ];
    blocks.forEach(function (b) {
      modal.appendChild(el('h3', { text: b[0] }));
      modal.appendChild(el('p', { text: b[1] }));
    });

    var cta = el('button', { type: 'button', class: 'sw-modal-cta', text: 'Aan de slag' });
    modal.appendChild(cta);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function dismiss() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') dismiss(); }

    close.addEventListener('click', dismiss);
    cta.addEventListener('click', dismiss);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) dismiss(); });
    document.addEventListener('keydown', onKey);
    close.focus();
  }

  // --- Render: reactieblok (visual prototype, nog niet actief) ------------
  // Site-breed via chrome.js, onderaan elke .page-main (de homepage heeft
  // geen .page-main en wordt dus overgeslagen). Verstuurt NIETS: de klik
  // wordt in JS afgevangen en toont een inline-melding.
  function renderReactieBlok() {
    var main = document.querySelector('.page-main');
    if (!main || main.querySelector('.sw-react')) return;

    var sec = el('section', { class: 'sw-react', 'aria-labelledby': 'sw-react-kop' });

    sec.appendChild(el('p', { class: 'sw-react-proto', text: 'Voorbeeld / prototype — dit reactieformulier is nog niet actief.' }));
    sec.appendChild(el('h2', { id: 'sw-react-kop', text: 'Reageren op dit dossier' }));
    sec.appendChild(el('p', { class: 'sw-react-intro', text: 'Klopt er iets niet, of mist er informatie? Laat het weten. Uw reactie gaat naar het bestuur van Stille Wille Wonen en de websitebeheerder.' }));

    function field(labelText, control, id) {
      var wrap = el('div', { class: 'sw-react-field' });
      var lab = el('label', { 'for': id, text: labelText });
      control.setAttribute('id', id);
      wrap.appendChild(lab);
      wrap.appendChild(control);
      return wrap;
    }

    sec.appendChild(field('Uw bericht', el('textarea', { rows: '5', placeholder: 'Uw reactie…' }), 'sw-react-msg-in'));

    var row = el('div', { class: 'sw-react-row' });
    row.appendChild(field('Naam (optioneel)', el('input', { type: 'text', autocomplete: 'name' }), 'sw-react-naam'));
    row.appendChild(field('E-mail (optioneel)', el('input', { type: 'email', autocomplete: 'email' }), 'sw-react-email'));
    sec.appendChild(row);

    sec.appendChild(el('p', { class: 'sw-react-avg', text: 'Uw gegevens worden uitsluitend gebruikt om op uw reactie te reageren en niet voor andere doeleinden.' }));

    var btn = el('button', { type: 'button', class: 'sw-react-btn', text: 'Versturen' });
    sec.appendChild(btn);

    var melding = el('p', { class: 'sw-react-melding', role: 'status', text: 'Dit formulier is nog in ontwikkeling — versturen is nog niet actief.' });
    melding.hidden = true;
    sec.appendChild(melding);

    btn.addEventListener('click', function () { melding.hidden = false; });

    main.appendChild(sec);
  }

  // --- Boot ----------------------------------------------------------------

  function boot() {
    ensureMobileToggle();
    renderNav();
    renderKicker();
    renderTileGrid();
    renderPager();
    renderDossierSelect();
    renderStatusBanner();
    renderBijgewerkt();
    renderStatusFilter();
    wrapTables();
    renderReactieBlok();
    renderIntroModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
