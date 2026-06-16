/**
 * document.js — detailpagina van één stuk (bewoners-weergave)
 *
 * Toont het stuk in gewone taal: begrijpelijke titel (weergavetitel),
 * onderwerp-label, korte duiding, een "In dit stuk"-lijstje en de
 * gerenderde markdown. De redactionele informatie — het betrouwbaarheids-
 * stoplicht, de productie-tags en de verificatiepunten — staat subtiel,
 * ingeklapt onder "Over deze bron". De data blijft volledig beschikbaar
 * (window.SW_KENNISBANK_DOC) voor de latere agent.
 */
(function () {
  'use strict';

  var MANIFEST_URL = '/kennisbank/corpus.json';
  var STOPLICHT = { GROEN: 'groen', GEEL: 'geel', ORANJE: 'oranje' };
  var STOPLICHT_TEKST = {
    GROEN: 'Primaire/officiële bron',
    GEEL: 'Afgeleid, toelichtend of een standpunt',
    ORANJE: 'Onbevestigd of ruis (bijv. een matige scan)'
  };

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

  function stripFrontMatter(raw) {
    var m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
    return m ? raw.slice(m[0].length) : raw;
  }
  function stripLeadingH1(md) { return md.replace(/^\s*#\s+.*(\r?\n)+/, ''); }

  function fail(msg) {
    $('kb-title').textContent = 'Niet gevonden';
    $('kb-lede').textContent = msg;
    $('kb-body').innerHTML = '';
    $('kb-body').appendChild(el('a', { class: 'kb-back', href: '/kennisbank/', text: '← Terug naar de kennisbank' }));
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

  // Onderwerp-labels als links naar de onderwerp-pagina's.
  function onderwerpLinks(d) {
    var keys = [];
    if (d.rubriek_primair) keys.push(d.rubriek_primair);
    (d.rubriek_secundair || []).forEach(function (r) { if (keys.indexOf(r) === -1) keys.push(r); });
    if (!keys.length) return null;
    var wrap = el('div', { class: 'kb-onderwerp-links' });
    keys.forEach(function (key) {
      wrap.appendChild(el('a', {
        class: 'kb-onderwerp-link',
        href: '/kennisbank/onderwerp.html?onderwerp=' + encodeURIComponent(key),
        text: labelFor(key)
      }));
    });
    return wrap;
  }

  // Bovenste, bewoners-vriendelijke info naast het stuk.
  function renderMeta(d) {
    var box = $('kb-meta');
    box.innerHTML = '';
    box.appendChild(metaItem('Onderwerp', onderwerpLinks(d)));
    box.appendChild(metaItem('Periode', d.datum || null));
    box.appendChild(metaItem('Afkomstig van', d.bron || null));
    if (d.bron_url) {
      box.appendChild(metaItem('Originele bron',
        el('a', { href: d.bron_url, target: '_blank', rel: 'noopener', text: 'Bekijk op de bronwebsite ↗' })));
    }
    if (d.auteur) box.appendChild(metaItem('Auteur', d.auteur));
  }

  // Subtiele "Over deze bron": stoplicht, herkomst-tags, verificatiepunten.
  function renderHerkomst(d) {
    var box = $('kb-herkomst-body');
    box.innerHTML = '';

    if (d.betrouwbaarheid) {
      var cls = STOPLICHT[d.betrouwbaarheid] || 'geel';
      box.appendChild(el('div', { class: 'kb-meta-item' }, [
        el('span', { class: 'kb-meta-key', text: 'Aard van de bron' }),
        el('span', { class: 'kb-verif-badge kb-verif-badge--' + cls, text: STOPLICHT_TEKST[d.betrouwbaarheid] || d.betrouwbaarheid })
      ]));
    }
    if (d.brontype) box.appendChild(metaItem('Soort document', d.brontype));
    if (d.status) box.appendChild(metaItem('Status', d.status));
    if (d.bestandsnaam) box.appendChild(metaItem('Oorspronkelijk bestand', d.bestandsnaam));

    if (d.verificatiepunten && d.verificatiepunten.length) {
      var ul = el('ul', { style: 'margin:6px 0 0;padding-left:1.1em;' });
      d.verificatiepunten.forEach(function (v) {
        ul.appendChild(el('li', { class: 'kb-herkomst-note', style: 'margin-bottom:6px;', text: v }));
      });
      box.appendChild(el('div', { class: 'kb-meta-item' }, [
        el('span', { class: 'kb-meta-key', text: 'Nog te controleren' }), ul
      ]));
    }
    if (d.tags && d.tags.length) {
      var tags = el('div', { class: 'kb-tags', style: 'margin-top:4px;' });
      d.tags.forEach(function (t) { tags.appendChild(el('span', { class: 'kb-tag', text: t })); });
      box.appendChild(el('div', { class: 'kb-meta-item' }, [
        el('span', { class: 'kb-meta-key', text: 'Trefwoorden' }), tags
      ]));
    }
    box.appendChild(el('p', { class: 'kb-herkomst-note',
      text: 'Dit is een gestructureerde samenvatting/inventarisatie. Raadpleeg voor het volledige beeld de originele bron hierboven.' }));
  }

  function renderKern(d) {
    if (d.kernonderwerpen && d.kernonderwerpen.length) {
      var kl = $('kb-kern-list');
      d.kernonderwerpen.forEach(function (k) { kl.appendChild(el('li', { text: k })); });
      $('kb-kern').hidden = false;
    }
  }

  function renderBody(md) {
    var body = stripLeadingH1(stripFrontMatter(md));
    if (window.marked) {
      if (marked.setOptions) marked.setOptions({ gfm: true, breaks: false });
      var html = marked.parse ? marked.parse(body) : marked(body);
      $('kb-body').innerHTML = html;
      $('kb-body').querySelectorAll('table').forEach(function (t) {
        if (t.parentElement && t.parentElement.classList.contains('sw-table-wrap')) return;
        var wrap = el('div', { class: 'sw-table-wrap' });
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
      });
      $('kb-body').querySelectorAll('a[href^="http"]').forEach(function (a) {
        a.target = '_blank'; a.rel = 'noopener';
      });
    } else {
      $('kb-body').appendChild(el('pre', { text: body }));
    }
  }

  var slug = getParam('id');
  if (!slug) { fail('Geen stuk opgegeven.'); return; }

  fetch(MANIFEST_URL, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('manifest ' + r.status); return r.json(); })
    .then(function (manifest) {
      (manifest.onderwerpen || []).forEach(function (o) { LABEL[o.key] = o.label; });
      var docs = manifest.documenten || [];
      var d = docs.filter(function (x) { return x.slug === slug; })[0];
      if (!d) { fail('Dit stuk staat niet in de kennisbank.'); return; }

      window.SW_KENNISBANK_DOC = d; // hook voor latere agentlaag

      var titel = d.weergavetitel || d.titel;
      document.title = titel + ' · Kennisbank · Kerndossiers Landgoed De Stille Wille';
      $('kb-kicker').textContent = labelFor(d.rubriek_primair) || 'Stuk';
      $('kb-title').textContent = titel;
      $('kb-lede').textContent = d.duiding || '';

      renderMeta(d);
      renderHerkomst(d);
      renderKern(d);

      return fetch('/kennisbank/' + encodeURIComponent(d.bestand), { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('document ' + r.status); return r.text(); })
        .then(renderBody);
    })
    .catch(function (err) { fail('Kon het stuk niet laden (' + err.message + ').'); });
})();
