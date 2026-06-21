/**
 * chrome.js — Registry-driven page chrome
 *
 * Reads window.SW_DOSSIERS (from dossiers.js) and renders:
 *   - sw-nav         (replaces .sw-nav .sw-nav-inner contents)
 *   - kicker         (replaces .page-kicker contents — keeps the .square)
 *   - tile grid      (fills [data-sw-tile-grid] on the home page)
 *   - pager          (fills [data-sw-pager])
 *   - status badge   ([data-sw-status]) — banner for in-uitvoering / gepland
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

  // --- PWA: service worker + install-prompt --------------------------------
  // Module-niveau, zodat de openings-modal (renderIntroModal) bij swDeferred
  // kan. De service worker blijft network-first geregistreerd; de echte
  // install-prompt (Android/Chrome) wordt opgevangen en bewaard tot de
  // bewoner in de modal op "Op je telefoon zetten" klikt.
  var swDeferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); swDeferred = e; });
  window.addEventListener('appinstalled', function () { swDeferred = null; });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }

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
    'voltooid': 'Bijgewerkt',
    'in-uitvoering': 'In bewerking',
    'gepland': 'Later'
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

    // Titel bovenaan, met volgnummer uit de registry (R = SW_DOSSIERS).
    // Het nummer kleurt mee met het DECORATIEVE tegel-accent, niet met status.
    var n = R.indexOf(d) + 1;
    var head = el('div', { class: 'sw-tile-head' });
    head.appendChild(el('span', { class: 'sw-tile-n', 'aria-hidden': 'true', text: (n < 10 ? '0' + n : String(n)) }));
    head.appendChild(el('h3', { class: 'sw-tile-title', text: d.titel }));
    a.appendChild(head);

    // Status komt ONDER de titel — vorm-gecodeerde stip + herbenoemd label.
    var tb = statusBadge(d);
    if (tb) {
      var meta = el('div', { class: 'sw-tile-meta' });
      meta.appendChild(tb);
      a.appendChild(meta);
    }

    a.appendChild(el('p', { class: 'sw-tile-desc', text: d.omschrijving }));
    return a;
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
      ? { cls: 'callout-yellow', label: 'In bewerking',
          txt: 'Dit dossier is in bewerking. Onderdelen kunnen nog onvolledig zijn; specifieke cijfers, datums en bronverwijzingen worden pas opgenomen na verificatie tegen de primaire bron.' }
      : { cls: 'callout-orange', label: 'Later',
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

  // --- Render: openings-modal (site-breed) --------------------------------
  // Eén bron voor alle pagina's: chrome.js wordt overal ingeladen. De modal
  // verschijnt éénmaal per sessie (zie sessionStorage hieronder); bij een
  // nieuw bezoek (nieuwe tab/sessie) weer. Rustig vormgegeven en snel weg
  // te klikken.
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

    // PWA install-blok — vlak vóór de CTA, maar alleen als de site nog niet
    // als app draait. "Aan de slag" blijft de opvallende primaire knop; de
    // install-knop is secundair gestyled. De knop is nooit dood: lukt de
    // echte prompt niet (iOS, of nog geen beforeinstallprompt), dan tonen we
    // een korte instructie-regel.
    var swStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (!swStandalone) {
      var pwaBtn = el('button', { type: 'button', class: 'pwa-install-btn', text: 'Op je telefoon zetten' });
      var pwaHelp = el('div', { class: 'pwa-ios-help', hidden: '' });
      modal.appendChild(pwaBtn);
      modal.appendChild(pwaHelp);
      pwaBtn.addEventListener('click', function () {
        if (swDeferred) {
          swDeferred.prompt();
          swDeferred = null;
        } else {
          var isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
          pwaHelp.innerHTML = isiOS
            ? 'Tik op de <strong>Deel</strong>-knop en kies <strong>&ldquo;Zet op beginscherm&rdquo;</strong>.'
            : 'Open het menu van je browser (&#x22EE; of &#x2261;) en kies <strong>&ldquo;Toevoegen aan startscherm&rdquo;</strong>.';
          pwaHelp.hidden = false;
        }
      });
    }

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

  // --- Supabase loader (op aanvraag) ---------------------------------------
  // De dossierpagina's laden Supabase niet standaard; voor het reactieblok
  // laden we de CDN-bundel + supabase-config.js dynamisch in en hergebruiken
  // we de gedeelde window.sb client.
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var found = document.querySelector('script[data-dyn="' + src + '"]');
      if (found) {
        if (found.getAttribute('data-loaded')) { resolve(); return; }
        found.addEventListener('load', function () { resolve(); });
        found.addEventListener('error', function () { reject(new Error(src)); });
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = false; // bewaar volgorde: CDN vóór config
      s.setAttribute('data-dyn', src);
      s.addEventListener('load', function () { s.setAttribute('data-loaded', '1'); resolve(); });
      s.addEventListener('error', function () { reject(new Error(src)); });
      document.head.appendChild(s);
    });
  }

  var _sbReady = null;
  function ensureSupabase() {
    if (window.sb) return Promise.resolve(window.sb);
    if (_sbReady) return _sbReady;
    _sbReady = loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')
      .then(function () { return loadScript('/supabase-config.js'); })
      .then(function () { return window.sb; });
    return _sbReady;
  }

  // --- Render: reactieblok (actief, via Supabase) --------------------------
  // Site-breed via chrome.js, onderaan elke .page-main (de homepage heeft
  // geen .page-main en wordt dus overgeslagen). Reacties worden opgeslagen in
  // de tabel "reacties" en zijn direct zichtbaar — geen moderatie.
  function renderReactieBlok() {
    var main = document.querySelector('.page-main');
    if (!main || main.querySelector('.sw-react')) return;

    var pagina = location.pathname;

    var sec = el('section', { class: 'sw-react', 'aria-labelledby': 'sw-react-kop' });

    sec.appendChild(el('h2', { id: 'sw-react-kop', text: 'Reageren op dit dossier' }));
    sec.appendChild(el('p', { class: 'sw-react-intro', text: 'Klopt er iets niet, of mist er informatie? Laat het weten. Uw reactie is direct zichtbaar onder dit dossier.' }));

    function field(labelText, control, id) {
      var wrap = el('div', { class: 'sw-react-field' });
      var lab = el('label', { 'for': id, text: labelText });
      control.setAttribute('id', id);
      wrap.appendChild(lab);
      wrap.appendChild(control);
      return wrap;
    }

    var msgInput = el('textarea', { rows: '5', placeholder: 'Uw reactie…' });
    sec.appendChild(field('Uw bericht', msgInput, 'sw-react-msg-in'));

    var row = el('div', { class: 'sw-react-row' });
    var naamInput = el('input', { type: 'text', autocomplete: 'name' });
    var emailInput = el('input', { type: 'email', autocomplete: 'email' });
    row.appendChild(field('Naam (optioneel)', naamInput, 'sw-react-naam'));
    row.appendChild(field('E-mail (optioneel)', emailInput, 'sw-react-email'));
    sec.appendChild(row);

    sec.appendChild(el('p', { class: 'sw-react-avg', text: 'Uw gegevens worden uitsluitend gebruikt om op uw reactie te reageren en niet voor andere doeleinden.' }));

    var btn = el('button', { type: 'button', class: 'sw-react-btn', text: 'Versturen' });
    sec.appendChild(btn);

    var melding = el('p', { class: 'sw-react-melding', role: 'status' });
    melding.hidden = true;
    sec.appendChild(melding);

    var lijst = el('div', { class: 'sw-react-list' });
    sec.appendChild(lijst);

    main.appendChild(sec);

    function meld(text) { melding.textContent = text; melding.hidden = false; }

    function fmtDatum(iso) {
      try {
        var d = new Date(iso);
        return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) +
               ' om ' + d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      } catch (e) { return ''; }
    }

    function renderItem(r, sb, magVerwijderen) {
      var item = el('div', { class: 'sw-react-item' });
      var head = el('div', { class: 'sw-react-item-head' });
      var naam = (r.naam && String(r.naam).trim()) ? String(r.naam).trim() : 'Anoniem';
      head.appendChild(el('span', { class: 'sw-react-item-naam', text: naam }));

      var meta = el('div', { class: 'sw-react-item-meta' });
      meta.appendChild(el('span', { class: 'sw-react-item-datum', text: fmtDatum(r.aangemaakt) }));

      // Beheerders/owners kunnen een reactie direct hier verwijderen.
      if (magVerwijderen) {
        var del = el('button', {
          type: 'button',
          class: 'sw-react-del',
          title: 'Reactie verwijderen',
          'aria-label': 'Reactie verwijderen',
          text: '×'
        });
        del.addEventListener('click', function () {
          if (!confirm('Deze reactie verwijderen?')) return;
          del.disabled = true;
          sb.from('reacties').delete().eq('id', r.id).then(function (res) {
            if (res.error) { del.disabled = false; alert('Verwijderen mislukt: ' + res.error.message); return; }
            laadReacties(sb, magVerwijderen);
          });
        });
        meta.appendChild(del);
      }

      head.appendChild(meta);
      item.appendChild(head);
      item.appendChild(el('p', { class: 'sw-react-item-bericht', text: r.bericht }));
      return item;
    }

    function laadReacties(sb, magVerwijderen) {
      sb.from('reacties').select('id, naam, bericht, aangemaakt')
        .eq('pagina', pagina)
        .order('aangemaakt', { ascending: true })
        .then(function (res) {
          if (res.error) return;
          var rows = res.data || [];
          lijst.innerHTML = '';
          if (rows.length) {
            lijst.appendChild(el('h3', {
              class: 'sw-react-list-kop',
              text: rows.length === 1 ? '1 reactie' : rows.length + ' reacties'
            }));
          }
          rows.forEach(function (r) { lijst.appendChild(renderItem(r, sb, magVerwijderen)); });
        });
    }

    // Rol van de ingelogde gebruiker bepalen (voor de verwijder-knop).
    function bepaalRol(sb) {
      return sb.auth.getSession().then(function (s) {
        var u = s.data && s.data.session && s.data.session.user;
        if (!u || !u.email) return null;
        return sb.from('gebruikers').select('rol').eq('email', u.email).maybeSingle()
          .then(function (r) { return (r.data && r.data.rol) || null; });
      }).catch(function () { return null; });
    }

    // Vriendelijke dialoog met duidelijk gelabelde knoppen (i.p.v. confirm(),
    // waar "OK"/"Annuleren" verwarrend was). Resolve(true) = anoniem plaatsen,
    // resolve(false) = terug naar het formulier om een naam in te vullen.
    function vraagAnoniem() {
      return new Promise(function (resolve) {
        var overlay = el('div', { class: 'sw-anon-overlay' });
        var dialog = el('div', {
          class: 'sw-anon-dialog', role: 'dialog', 'aria-modal': 'true',
          'aria-labelledby': 'sw-anon-titel'
        });
        dialog.appendChild(el('h3', { id: 'sw-anon-titel', class: 'sw-anon-titel', text: 'Liever met naam?' }));
        dialog.appendChild(el('p', {
          class: 'sw-anon-tekst',
          text: 'U heeft geen naam ingevuld. Wij nodigen u uit uw naam en huisnummer te delen — dat maakt de discussie persoonlijker. U mag ook anoniem reageren.'
        }));
        var rij = el('div', { class: 'sw-anon-knoppen' });
        var btnNaam = el('button', { type: 'button', class: 'sw-anon-btn sw-anon-btn-primary', text: 'Naam invullen' });
        var btnAnon = el('button', { type: 'button', class: 'sw-anon-btn sw-anon-btn-ghost', text: 'Toch anoniem plaatsen' });
        rij.appendChild(btnNaam);
        rij.appendChild(btnAnon);
        dialog.appendChild(rij);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        function sluit(result) {
          document.removeEventListener('keydown', onKey);
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve(result);
        }
        function onKey(e) { if (e.key === 'Escape') sluit(false); }

        btnNaam.addEventListener('click', function () { sluit(false); });
        btnAnon.addEventListener('click', function () { sluit(true); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) sluit(false); });
        document.addEventListener('keydown', onKey);
        btnNaam.focus();
      });
    }

    ensureSupabase().then(function (sb) {
      if (!sb) { meld('Reacties zijn momenteel niet beschikbaar.'); return; }

      bepaalRol(sb).then(function (rol) {
        var magVerwijderen = (rol === 'beheerder' || rol === 'owner');
        laadReacties(sb, magVerwijderen);

        function verstuur(naam) {
          btn.disabled = true;
          var label = btn.textContent;
          btn.textContent = 'Versturen…';
          melding.hidden = true;

          sb.from('reacties').insert({
            bericht: (msgInput.value || '').trim(),
            naam: naam || null,
            email: (emailInput.value || '').trim() || null,
            pagina: pagina
          }).then(function (res) {
            btn.disabled = false;
            btn.textContent = label;
            if (res.error) { meld('Versturen mislukt: ' + res.error.message); return; }
            msgInput.value = '';
            meld('Bedankt! Uw reactie is geplaatst.');
            laadReacties(sb, magVerwijderen);
          });
        }

        btn.addEventListener('click', function () {
          var bericht = (msgInput.value || '').trim();
          if (!bericht) { meld('Schrijf eerst een bericht.'); return; }

          var naam = (naamInput.value || '').trim();
          if (!naam) {
            vraagAnoniem().then(function (anoniem) {
              if (!anoniem) { naamInput.focus(); return; }
              verstuur('');
            });
            return;
          }
          verstuur(naam);
        });
      });
    }).catch(function () {
      meld('Reacties konden niet geladen worden.');
    });
  }

  // --- Zoeken: strook onder de nav -----------------------------------------
  // Een prominente zoekbalk direct onder de navigatie. Submit navigeert naar
  // /zoeken.html?q=… (native GET-form), waar de hele site doorzocht wordt.
  function renderZoek() {
    var nav = document.querySelector('.sw-nav');
    if (!nav || document.querySelector('.sw-zoekbalk')) return;

    var balk = el('div', { class: 'sw-zoekbalk' });

    var form = el('form', { class: 'sw-zoek', role: 'search', action: '/zoeken.html', method: 'get' });

    var veld = el('div', { class: 'sw-zoek-veld' });
    var input = el('input', {
      type: 'search', name: 'q', class: 'sw-zoek-input',
      placeholder: 'Zoek in dit dossier…', 'aria-label': 'Zoek in dit dossier',
      autocomplete: 'off'
    });
    var btn = el('button', { type: 'submit', class: 'sw-zoek-btn' });
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    btn.appendChild(document.createTextNode('Zoeken'));

    veld.appendChild(input);
    veld.appendChild(btn);
    form.appendChild(veld);
    form.appendChild(el('p', { class: 'sw-zoek-hint', text: 'Druk Enter of klik om te zoeken.' }));

    balk.appendChild(form);
    nav.parentNode.insertBefore(balk, nav.nextSibling);

    // Lege zoekopdracht blokkeren; anders laat het native GET-form navigeren.
    form.addEventListener('submit', function (e) {
      if (!(input.value || '').trim()) { e.preventDefault(); input.focus(); }
    });
  }

  // --- Boot ----------------------------------------------------------------

  function boot() {
    ensureMobileToggle();
    renderNav();
    renderZoek();
    renderKicker();
    renderTileGrid();
    renderPager();
    renderDossierSelect();
    renderStatusBanner();
    renderBijgewerkt();
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
