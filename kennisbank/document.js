/**
 * document.js — detailpagina van één corpusdocument
 *
 * Haalt de metadata uit /kennisbank/corpus.json (op slug ?id=...) en het
 * rauwe markdown-bestand op, strip de YAML front-matter en de eerste H1
 * (titel staat al in de page-header), en rendert de body met marked binnen
 * de bestaande .page-main-prozastijl. Metadata, kernonderwerpen en
 * verificatiepunten worden apart en zichtbaar getoond.
 */
(function () {
  'use strict';

  var MANIFEST_URL = '/kennisbank/corpus.json';
  var STOPLICHT = { GROEN: 'groen', GEEL: 'geel', ORANJE: 'oranje' };
  var STOPLICHT_LABEL = { GROEN: 'Groen — primaire/officiële bron', GEEL: 'Geel — afgeleid/toelichtend of standpunt', ORANJE: 'Oranje — onbevestigd/ruis' };

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

  function getParam(name) {
    return new URLSearchParams(location.search).get(name) || '';
  }

  function stripFrontMatter(raw) {
    var m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
    return m ? raw.slice(m[0].length) : raw;
  }

  // verwijder de eerste H1 (dubbel met de page-title)
  function stripLeadingH1(md) {
    return md.replace(/^\s*#\s+.*(\r?\n)+/, '');
  }

  function fail(msg) {
    $('kb-title').textContent = 'Niet gevonden';
    $('kb-lede').textContent = msg;
    $('kb-body').innerHTML = '';
    var back = el('a', { class: 'kb-back', href: '/kennisbank/', text: '← Terug naar de kennisbank' });
    $('kb-body').appendChild(back);
  }

  function metaItem(key, valNode) {
    if (!valNode) return null;
    return el('div', { class: 'kb-meta-item' }, [
      el('span', { class: 'kb-meta-key', text: key }),
      (typeof valNode === 'string')
        ? el('div', { class: 'kb-meta-val', text: valNode })
        : el('div', { class: 'kb-meta-val' }, [valNode])
    ]);
  }

  function chipRow(items, cls) {
    if (!items || !items.length) return null;
    var wrap = el('div', { class: 'kb-tags' });
    items.forEach(function (t) { wrap.appendChild(el('span', { class: cls, text: t })); });
    return wrap;
  }

  function renderMeta(d) {
    var box = $('kb-meta');
    box.innerHTML = '';

    if (d.betrouwbaarheid) {
      var cls = STOPLICHT[d.betrouwbaarheid] || 'geel';
      box.appendChild(metaItem('Betrouwbaarheid',
        el('span', { class: 'kb-verif-badge kb-verif-badge--' + cls,
          text: STOPLICHT_LABEL[d.betrouwbaarheid] || d.betrouwbaarheid })));
    }
    box.appendChild(metaItem('Rubriek', d.rubriek_primair || null));
    if (d.rubriek_secundair && d.rubriek_secundair.length)
      box.appendChild(metaItem('Ook in', d.rubriek_secundair.join(' · ')));
    box.appendChild(metaItem('Partij', chipRow(d.partij, 'kb-partij')));
    box.appendChild(metaItem('Brontype', d.brontype || null));
    box.appendChild(metaItem('Datum / periode', d.datum || null));
    box.appendChild(metaItem('Status', d.status || null));
    box.appendChild(metaItem('Bron', d.bron || null));
    if (d.bron_url) {
      box.appendChild(metaItem('Bron-URL',
        el('a', { href: d.bron_url, target: '_blank', rel: 'noopener', text: d.bron_url })));
    }
    if (d.bestandsnaam) box.appendChild(metaItem('Bestandsnaam', d.bestandsnaam));
    if (d.auteur) box.appendChild(metaItem('Auteur', d.auteur));
    box.appendChild(metaItem('Trefwoorden', chipRow(d.tags, 'kb-tag')));
    box.appendChild(metaItem('Bronbestand', d.bestand || null));
  }

  function renderSidecontent(d) {
    if (d.kernonderwerpen && d.kernonderwerpen.length) {
      var kl = $('kb-kern-list');
      d.kernonderwerpen.forEach(function (k) { kl.appendChild(el('li', { text: k })); });
      $('kb-kern').hidden = false;
    }
    if (d.verificatiepunten && d.verificatiepunten.length) {
      var vl = $('kb-verif-list');
      d.verificatiepunten.forEach(function (v) { vl.appendChild(el('li', { text: v })); });
      $('kb-verif').hidden = false;
    }
  }

  function renderBody(md) {
    var body = stripLeadingH1(stripFrontMatter(md));
    if (window.marked) {
      if (marked.setOptions) marked.setOptions({ gfm: true, breaks: false });
      var html = marked.parse ? marked.parse(body) : marked(body);
      $('kb-body').innerHTML = html;
      // tabellen scrollbaar maken op smal scherm
      $('kb-body').querySelectorAll('table').forEach(function (t) {
        if (t.parentElement && t.parentElement.classList.contains('sw-table-wrap')) return;
        var wrap = el('div', { class: 'sw-table-wrap' });
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
      });
      // externe links veilig openen
      $('kb-body').querySelectorAll('a[href^="http"]').forEach(function (a) {
        a.target = '_blank'; a.rel = 'noopener';
      });
    } else {
      $('kb-body').appendChild(el('pre', { text: body }));
    }
  }

  var slug = getParam('id');
  if (!slug) { fail('Geen document opgegeven.'); return; }

  fetch(MANIFEST_URL, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('manifest ' + r.status); return r.json(); })
    .then(function (manifest) {
      var docs = manifest.documenten || [];
      var d = docs.filter(function (x) { return x.slug === slug; })[0];
      if (!d) { fail('Dit document staat niet in de corpus.'); return; }

      window.SW_KENNISBANK_DOC = d; // hook voor latere agentlaag

      document.title = d.titel + ' · Kennisbank · Kerndossiers Landgoed De Stille Wille';
      $('kb-kicker').textContent = d.rubriek_primair || 'Document';
      $('kb-title').textContent = d.titel;
      $('kb-lede').textContent = d.excerpt || '';

      renderMeta(d);
      renderSidecontent(d);

      return fetch('/kennisbank/' + encodeURIComponent(d.bestand), { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('document ' + r.status); return r.text(); })
        .then(renderBody);
    })
    .catch(function (err) { fail('Kon het document niet laden (' + err.message + ').'); });
})();
