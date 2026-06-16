/**
 * home.js — bewoners-landing van de kennisbank
 *
 * Leest /kennisbank/corpus.json en toont de ONDERWERPEN als hoofdingang
 * (gewone-taal-tegels). Een zoekveld is de secundaire ingang: bij een
 * zoekterm verschijnen de bijbehorende stukken als gewone-taal-rijen
 * (begrijpelijke titel + toelichting), zonder redactioneel stoplicht of
 * productie-tags.
 *
 * Uitbreidingspunt voor de latere vraag-antwoord-agent:
 *   window.SW_KENNISBANK = { manifest, documenten, onderwerpen, zoek(term) }
 * De zoek()-functie is bewust losgekoppeld van de weergave, zodat een
 * semantische zoeklaag/agent die later kan vervangen.
 */
(function () {
  'use strict';

  var MANIFEST_URL = '/kennisbank/corpus.json';

  function $(id) { return document.getElementById(id); }
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
    return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  var DOCS = [], ONDERWERPEN = [], LABEL = {};

  function labelFor(key) { return LABEL[key] || key; }

  function haystack(d) {
    return fold([
      d.weergavetitel, d.titel, d.duiding, d.excerpt,
      (d.tags || []).join(' '),
      (d.kernonderwerpen || []).join(' '),
      (d.partij || []).join(' '),
      d.rubriek_primair, (d.rubriek_secundair || []).join(' ')
    ].join(' '));
  }

  // Zoeklaag — losgekoppeld van de weergave (vervangbaar door agent/semantisch).
  function zoek(term) {
    var q = fold(term).trim();
    if (!q) return [];
    var terms = q.split(/\s+/);
    return DOCS.filter(function (d) {
      var hay = haystack(d);
      for (var i = 0; i < terms.length; i++) if (hay.indexOf(terms[i]) === -1) return false;
      return true;
    });
  }

  // ── Onderwerp-tegels ─────────────────────────────────────
  function topicTile(o) {
    return el('a', {
      class: 'kb-topic accent-' + (o.accent || 'green'),
      href: '/kennisbank/onderwerp.html?onderwerp=' + encodeURIComponent(o.key)
    }, [
      el('span', { class: 'kb-topic-icon', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (o.icon || '') + '</svg>' }),
      el('span', { class: 'kb-topic-label', text: o.label }),
      el('p', { class: 'kb-topic-desc', text: o.beschrijving }),
      el('span', { class: 'kb-topic-count', text: o.aantal + (o.aantal === 1 ? ' stuk' : ' stukken') })
    ]);
  }

  function renderTopics() {
    var grid = $('kb-topics');
    grid.innerHTML = '';
    ONDERWERPEN.forEach(function (o) { grid.appendChild(topicTile(o)); });
  }

  // ── Zoekresultaten als gewone-taal-rijen ─────────────────
  function resultRow(d) {
    var row = el('a', { class: 'kb-doc-item',
      href: '/kennisbank/document.html?id=' + encodeURIComponent(d.slug) }, [
      el('h3', { text: d.weergavetitel || d.titel }),
      el('span', { class: 'kb-doc-onderwerp', text: labelFor(d.rubriek_primair) })
    ]);
    if (d.duiding) row.appendChild(el('p', { text: d.duiding }));
    var metaBits = [];
    if (d.datum) metaBits.push(d.datum);
    if (d.bron) metaBits.push(d.bron);
    if (metaBits.length) row.appendChild(el('div', { class: 'kb-doc-meta', text: metaBits.join('  ·  ') }));
    return row;
  }

  function renderResults(term) {
    var results = zoek(term);
    var list = $('kb-resultaten');
    list.innerHTML = '';
    $('kb-zoek-titel').textContent = '“' + term + '”';
    $('kb-resultcount').textContent = results.length
      ? results.length + (results.length === 1 ? ' stuk gevonden' : ' stukken gevonden')
      : 'Geen stukken gevonden. Probeer een ander woord, of kies hieronder een onderwerp.';
    results.forEach(function (d) { list.appendChild(resultRow(d)); });
    if (!results.length) {
      // toon de onderwerpen er weer bij als terugval
      $('kb-onderwerpen-sectie').hidden = false;
    }
  }

  function applyQueryFromState(term) {
    var searching = !!term.trim();
    $('kb-zoek-sectie').hidden = !searching;
    $('kb-onderwerpen-sectie').hidden = searching;
    if (searching) renderResults(term.trim());
    // URL bijwerken (deelbaar)
    var qs = searching ? '?q=' + encodeURIComponent(term.trim()) : location.pathname;
    history.replaceState(null, '', qs);
  }

  function bind() {
    var input = $('kb-q');
    input.addEventListener('input', debounce(function () { applyQueryFromState(input.value); }, 140));
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; applyQueryFromState(''); }
    });
  }

  function init(manifest) {
    DOCS = manifest.documenten || [];
    ONDERWERPEN = manifest.onderwerpen || [];
    ONDERWERPEN.forEach(function (o) { LABEL[o.key] = o.label; });

    window.SW_KENNISBANK = {
      manifest: manifest, documenten: DOCS, onderwerpen: ONDERWERPEN, zoek: zoek
    };

    renderTopics();
    bind();

    // diep-link: ?q= of ?onderwerp= (onderwerp stuurt door naar de onderwerp-pagina)
    var p = new URLSearchParams(location.search);
    var initQ = p.get('q') || '';
    if (initQ) { $('kb-q').value = initQ; applyQueryFromState(initQ); }
  }

  fetch(MANIFEST_URL, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(init)
    .catch(function (err) {
      $('kb-topics').innerHTML = '';
      $('kb-topics').appendChild(el('div', { class: 'kb-empty', style: 'grid-column:1/-1;',
        text: 'De kennisbank kon niet worden geladen (' + err.message + '). Ververs de pagina.' }));
    });
})();
