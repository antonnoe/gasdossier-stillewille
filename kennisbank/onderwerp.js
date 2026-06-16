/**
 * onderwerp.js — één onderwerp (rubriek) in gewone taal
 *
 * Toont een korte, neutrale beschrijving van het onderwerp en de
 * onderliggende stukken met begrijpelijke titels — zonder redactioneel
 * stoplicht of productie-tags. Voor het onderwerp "Wie is wie (partijen)"
 * verschijnt bovendien een neutraal partijen-glossarium.
 */
(function () {
  'use strict';

  var MANIFEST_URL = '/kennisbank/corpus.json';
  var WIE_IS_WIE_KEY = 'Stakeholders & organisatie';

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
  function getParam(name) { return new URLSearchParams(location.search).get(name) || ''; }

  var LABEL = {};
  function labelFor(key) { return LABEL[key] || key; }

  function inOnderwerp(d, key) {
    return d.rubriek_primair === key || (d.rubriek_secundair || []).indexOf(key) !== -1;
  }

  function fail(msg) {
    $('kb-onderwerp-titel').textContent = 'Onderwerp niet gevonden';
    $('kb-onderwerp-lede').textContent = msg;
  }

  function docRow(d, currentKey) {
    var row = el('a', { class: 'kb-doc-item',
      href: '/kennisbank/document.html?id=' + encodeURIComponent(d.slug) }, [
      el('h3', { text: d.weergavetitel || d.titel })
    ]);
    // toon het hoofd-onderwerp alleen als dat afwijkt van de huidige pagina
    if (d.rubriek_primair && d.rubriek_primair !== currentKey) {
      row.appendChild(el('span', { class: 'kb-doc-onderwerp', text: 'vooral: ' + labelFor(d.rubriek_primair) }));
    } else {
      row.appendChild(el('span', {}));
    }
    if (d.duiding) row.appendChild(el('p', { text: d.duiding }));
    var metaBits = [];
    if (d.datum) metaBits.push(d.datum);
    if (d.bron) metaBits.push(d.bron);
    if (metaBits.length) row.appendChild(el('div', { class: 'kb-doc-meta', text: metaBits.join('  ·  ') }));
    return row;
  }

  function renderPartijen(partijenInfo, docs, key) {
    if (!partijenInfo) return;
    // toon alleen partijen die in dit corpus voorkomen
    var voorkomend = {};
    docs.forEach(function (d) { (d.partij || []).forEach(function (p) { voorkomend[p] = true; }); });
    var box = $('kb-partijen');
    var keys = Object.keys(partijenInfo).filter(function (p) { return voorkomend[p]; });
    if (!keys.length) return;
    keys.forEach(function (p) {
      var info = partijenInfo[p];
      box.appendChild(el('div', { class: 'kb-partij-item' }, [
        el('div', { class: 'kb-partij-naam', text: info.naam || p }),
        el('div', { class: 'kb-partij-rol', text: info.rol || '' })
      ]));
    });
    $('kb-partijen-sectie').hidden = false;
    $('kb-stukken-kicker').textContent = 'Stukken waarin deze partijen voorkomen';
  }

  function init(manifest) {
    var key = getParam('onderwerp');
    var onderwerpen = manifest.onderwerpen || [];
    onderwerpen.forEach(function (o) { LABEL[o.key] = o.label; });
    var o = onderwerpen.filter(function (x) { return x.key === key; })[0];
    if (!o) { fail('Dit onderwerp bestaat niet. Ga terug naar het overzicht.'); return; }

    document.title = o.label + ' · Kennisbank · Kerndossiers Landgoed De Stille Wille';
    $('kb-onderwerp-titel').textContent = o.label;
    $('kb-onderwerp-lede').textContent = o.beschrijving || '';

    var docs = (manifest.documenten || []).filter(function (d) { return inOnderwerp(d, key); });
    // primaire stukken eerst, dan op weergavetitel
    docs.sort(function (a, b) {
      var ap = a.rubriek_primair === key ? 0 : 1;
      var bp = b.rubriek_primair === key ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return (a.weergavetitel || '').localeCompare(b.weergavetitel || '', 'nl');
    });

    window.SW_KENNISBANK_ONDERWERP = { key: key, onderwerp: o, documenten: docs }; // agent-hook

    if (key === WIE_IS_WIE_KEY) renderPartijen(manifest.partijen_info, manifest.documenten || [], key);

    $('kb-onderwerp-count').textContent = docs.length
      ? docs.length + (docs.length === 1 ? ' stuk' : ' stukken')
      : 'Aan dit onderwerp zijn nog geen stukken gekoppeld.';
    var list = $('kb-onderwerp-docs');
    docs.forEach(function (d) { list.appendChild(docRow(d, key)); });
  }

  fetch(MANIFEST_URL, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(init)
    .catch(function (err) { fail('Kon dit onderwerp niet laden (' + err.message + ').'); });
})();
