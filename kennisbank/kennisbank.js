/**
 * kennisbank.js — overzichtspagina van de corpus
 *
 * Leest /kennisbank/corpus.json (gegenereerd door build.mjs uit de YAML
 * front-matter van elk corpusbestand) en rendert een filterbare lijst.
 * Filters: vrije tekst (titel/tags/kernonderwerpen), rubriek, partij,
 * betrouwbaarheid. De filterstaat staat in de URL-query, zodat een view
 * deelbaar is en een latere zoeklaag/agent dezelfde parameters kan zetten.
 *
 * Uitbreidingspunt: window.SW_KENNISBANK bevat na laden de volledige manifest
 * (window.SW_KENNISBANK.documenten) en de actieve filterstaat — een hook voor
 * een toekomstige zoek-/agentlaag. De renderlaag is bewust gescheiden van de
 * filterlaag (applyFilters()), zodat die vervangen kan worden zonder de UI.
 */
(function () {
  'use strict';

  var MANIFEST_URL = '/kennisbank/corpus.json';
  var STOPLICHT = { GROEN: 'groen', GEEL: 'geel', ORANJE: 'oranje' };
  var STOPLICHT_LABEL = { GROEN: 'Groen', GEEL: 'Geel', ORANJE: 'Oranje' };

  var els = {
    q:    document.getElementById('kb-q'),
    rubriek: document.getElementById('kb-rubriek'),
    partij:  document.getElementById('kb-partij'),
    betr:    document.getElementById('kb-betrouwbaarheid'),
    count:   document.getElementById('kb-count'),
    reset:   document.getElementById('kb-reset'),
    grid:    document.getElementById('kb-grid')
  };

  var state = { q: '', rubriek: '', partij: '', betrouwbaarheid: [] };
  var DOCS = [];

  // ── Helpers ──────────────────────────────────────────────
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (kids) kids.forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function fold(s) {
    return (s || '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function haystack(d) {
    return fold([
      d.titel, d.excerpt, d.bron, d.brontype, d.auteur,
      (d.tags || []).join(' '),
      (d.kernonderwerpen || []).join(' '),
      (d.partij || []).join(' '),
      d.rubriek_primair, (d.rubriek_secundair || []).join(' ')
    ].join(' '));
  }

  // ── URL-staat (deelbaar + agent-vriendelijk) ─────────────
  function readUrl() {
    var p = new URLSearchParams(location.search);
    state.q = p.get('q') || '';
    state.rubriek = p.get('rubriek') || '';
    state.partij = p.get('partij') || '';
    var b = p.get('betrouwbaarheid') || '';
    state.betrouwbaarheid = b ? b.split(',').map(function (x) { return x.toUpperCase(); }) : [];
  }

  function writeUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.rubriek) p.set('rubriek', state.rubriek);
    if (state.partij) p.set('partij', state.partij);
    if (state.betrouwbaarheid.length) p.set('betrouwbaarheid', state.betrouwbaarheid.join(','));
    var qs = p.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  }

  // ── Filterlaag (los van rendering — vervangbaar door zoeklaag) ──
  function applyFilters() {
    var q = fold(state.q).trim();
    var terms = q ? q.split(/\s+/) : [];
    return DOCS.filter(function (d) {
      if (state.rubriek) {
        var inRub = d.rubriek_primair === state.rubriek ||
                    (d.rubriek_secundair || []).indexOf(state.rubriek) !== -1;
        if (!inRub) return false;
      }
      if (state.partij && (d.partij || []).indexOf(state.partij) === -1) return false;
      if (state.betrouwbaarheid.length &&
          state.betrouwbaarheid.indexOf(d.betrouwbaarheid) === -1) return false;
      if (terms.length) {
        var hay = haystack(d);
        for (var i = 0; i < terms.length; i++) if (hay.indexOf(terms[i]) === -1) return false;
      }
      return true;
    });
  }

  // ── Rendering ────────────────────────────────────────────
  function badge(b) {
    if (!b) return null;
    var cls = STOPLICHT[b] || 'geel';
    return el('span', { class: 'kb-verif-badge kb-verif-badge--' + cls, text: STOPLICHT_LABEL[b] || b });
  }

  function card(d) {
    var top = el('div', { class: 'kb-card-top' }, [
      el('span', { class: 'kb-card-rubriek', text: d.rubriek_primair || '—' }),
      badge(d.betrouwbaarheid)
    ]);

    var meta = el('div', { class: 'kb-card-meta' });
    if (d.brontype) meta.appendChild(el('span', { text: d.brontype }));
    if (d.datum) { meta.appendChild(el('span', { class: 'dot', text: '·' })); meta.appendChild(el('span', { text: d.datum })); }
    (d.partij || []).forEach(function (p) { meta.appendChild(el('span', { class: 'kb-partij', text: p })); });

    var tags = el('div', { class: 'kb-tags' });
    (d.tags || []).slice(0, 5).forEach(function (t) { tags.appendChild(el('span', { class: 'kb-tag', text: t })); });

    return el('a', { class: 'kb-card', href: '/kennisbank/document.html?id=' + encodeURIComponent(d.slug) }, [
      top,
      el('h3', { text: d.titel }),
      d.excerpt ? el('p', { class: 'kb-card-excerpt', text: d.excerpt }) : null,
      tags.childNodes.length ? tags : null,
      meta
    ]);
  }

  function render() {
    var results = applyFilters();
    els.grid.innerHTML = '';

    var total = DOCS.length;
    els.count.innerHTML = '<strong>' + results.length + '</strong> van ' + total +
      ' document' + (total === 1 ? '' : 'en');

    if (!results.length) {
      els.grid.appendChild(el('div', { class: 'kb-empty',
        text: 'Geen documenten gevonden voor deze filters. Pas de filters aan of wis ze.' }));
    } else {
      results.forEach(function (d) { els.grid.appendChild(card(d)); });
    }

    // hook voor latere zoek-/agentlaag
    window.SW_KENNISBANK.state = state;
    window.SW_KENNISBANK.resultaten = results;
  }

  // ── Filter-UI vullen + binden ────────────────────────────
  function fillSelect(sel, values, current) {
    values.forEach(function (v) {
      var o = el('option', { value: v, text: v });
      if (v === current) o.selected = true;
      sel.appendChild(o);
    });
  }

  function buildChips(values) {
    values.forEach(function (b) {
      var cls = STOPLICHT[b] || 'geel';
      var on = state.betrouwbaarheid.indexOf(b) !== -1;
      var chip = el('button', {
        type: 'button',
        class: 'kb-chip kb-chip--' + cls,
        'data-on': on ? 'true' : 'false',
        'data-val': b,
        'aria-pressed': on ? 'true' : 'false',
        text: STOPLICHT_LABEL[b] || b
      });
      chip.addEventListener('click', function () {
        var idx = state.betrouwbaarheid.indexOf(b);
        if (idx === -1) state.betrouwbaarheid.push(b); else state.betrouwbaarheid.splice(idx, 1);
        var nowOn = state.betrouwbaarheid.indexOf(b) !== -1;
        chip.setAttribute('data-on', nowOn ? 'true' : 'false');
        chip.setAttribute('aria-pressed', nowOn ? 'true' : 'false');
        writeUrl(); render();
      });
      els.betr.appendChild(chip);
    });
  }

  function debounce(fn, ms) {
    var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function bind() {
    els.q.value = state.q;
    els.q.addEventListener('input', debounce(function () {
      state.q = els.q.value; writeUrl(); render();
    }, 120));
    els.rubriek.addEventListener('change', function () {
      state.rubriek = els.rubriek.value; writeUrl(); render();
    });
    els.partij.addEventListener('change', function () {
      state.partij = els.partij.value; writeUrl(); render();
    });
    els.reset.addEventListener('click', function () {
      state = { q: '', rubriek: '', partij: '', betrouwbaarheid: [] };
      els.q.value = ''; els.rubriek.value = ''; els.partij.value = '';
      els.betr.querySelectorAll('.kb-chip').forEach(function (c) {
        c.setAttribute('data-on', 'false'); c.setAttribute('aria-pressed', 'false');
      });
      writeUrl(); render();
    });
  }

  // ── Init ─────────────────────────────────────────────────
  function init(manifest) {
    DOCS = manifest.documenten || [];
    window.SW_KENNISBANK = { manifest: manifest, documenten: DOCS, state: state };

    var facetten = manifest.facetten || {};
    // toon alleen rubrieken/partijen die echt voorkomen, in schema-volgorde
    var usedRub = {}, usedPar = {};
    DOCS.forEach(function (d) {
      if (d.rubriek_primair) usedRub[d.rubriek_primair] = true;
      (d.rubriek_secundair || []).forEach(function (r) { usedRub[r] = true; });
      (d.partij || []).forEach(function (p) { usedPar[p] = true; });
    });
    var rubrieken = (facetten.rubrieken || []).filter(function (r) { return usedRub[r]; });
    var partijen  = (facetten.partijen || []).filter(function (p) { return usedPar[p]; });
    var betr      = facetten.betrouwbaarheid || ['GROEN', 'GEEL', 'ORANJE'];

    readUrl();
    fillSelect(els.rubriek, rubrieken, state.rubriek);
    fillSelect(els.partij, partijen, state.partij);
    buildChips(betr);
    bind();
    render();
  }

  fetch(MANIFEST_URL, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(init)
    .catch(function (err) {
      els.grid.innerHTML = '';
      els.grid.appendChild(el('div', { class: 'kb-empty',
        text: 'De corpus kon niet worden geladen (' + err.message + '). Ververs de pagina.' }));
    });
})();
