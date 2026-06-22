// footer.js — huishoudelijke footer, site-breed.
//
// Zelfstandig scriptje (geen afhankelijkheden) dat de footer op ELKE pagina
// injecteert, vóór een eventuele <footer class="sw-footer"> (anders onderaan
// de body). Slaat over als er al een .hub-footer staat, zodat het nooit
// dubbel verschijnt. De stijl staat in components.css (op alle pagina's
// ingeladen). Externe links openen in een nieuw tabblad.
(function () {
  'use strict';

  function bouw() {
    if (document.querySelector('.hub-footer')) return;

    // Interne kolommen: lijst van [href, label].
    var kolommen = [
      { titel: 'Het archief', links: [
        ['/overzicht.html', 'Dossieroverzicht'],
        ['/bronnen.html', 'Bronnen'],
        ['/redactie.html', 'Redactioneel protocol'],
        ['/faq.html', 'Veelgestelde vragen']
      ] },
      { titel: 'Toegang & account', links: [
        ['/login.html', 'Inloggen'],
        ['/aanvragen.html', 'Toegang aanvragen'],
        ['/account.html', 'Mijn account'],
        ['/account.html', 'E-mailupdates beheren']
      ] },
      { titel: 'Meedoen', links: [
        ['/#peiling', 'Draagvlak-peiling'],
        ['/#deel', 'Nodig een bewoner uit'],
        ['/#correctie', 'Correctieverzoek indienen'],
        ['mailto:sw-bieb@proton.me?subject=Werkgroep%20SW-Bieb', 'Meehelpen in de werkgroep']
      ] },
      { titel: 'Contact & praktisch', links: [
        ['mailto:sw-bieb@proton.me', 'sw-bieb@proton.me'],
        ['/faq.html#privacy', 'Privacy & gegevens'],
        ['/feed.xml', 'RSS-feed'],
        ['/redactie.html', 'Over dit archief']
      ] }
    ];

    // Externe kolom met uitklap-menu's (pull-downs).
    var extern = {
      titel: 'Elders op het web',
      groepen: [
        { label: 'Stille Wille Wonen', links: [
          ['https://www.stillewille.nl/', 'Website'],
          ['https://www.stillewille.nl/wonen/praktische-info', 'Praktische info'],
          ['https://www.stillewille.nl/wonen/faciliteiten', 'Faciliteiten'],
          ['https://www.stillewille.nl/inloggen', 'Inloggen']
        ] },
        { label: 'Facebook-groep', links: [
          ['https://www.facebook.com/groups/livingtogether', 'Groep openen'],
          ['https://www.facebook.com/groups/livingtogether/files/files', 'Bestanden'],
          ['https://www.facebook.com/groups/livingtogether/members', 'Leden']
        ] },
        { label: 'Gemeente Oirschot', links: [
          ['https://www.oirschot.nl/', 'Website'],
          ['https://oirschot.archiefweb.eu/#search.1782164532705', 'Archief Stille Wille'],
          ['https://www.oirschot.nl/landgoed-de-stille-wille', 'Wijk Stille Wille'],
          ['https://vervoervoormij.nl/gemeente/oirschot/', 'Vervoer vanuit de Stille Wille']
        ] }
      ]
    };

    function el(tag, attrs, kinderen) {
      var n = document.createElement(tag);
      if (attrs) for (var k in attrs) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'text') n.textContent = attrs[k];
        else n.setAttribute(k, attrs[k]);
      }
      if (kinderen) kinderen.forEach(function (c) { if (c) n.appendChild(c); });
      return n;
    }

    function link(href, label) {
      var a = el('a', { href: href, text: label });
      if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      return a;
    }

    var inner = el('div', { class: 'hub-footer-inner' });

    kolommen.forEach(function (c) {
      var col = el('div', { class: 'hub-col' });
      col.appendChild(el('h3', { text: c.titel }));
      var ul = el('ul');
      c.links.forEach(function (l) {
        var li = el('li'); li.appendChild(link(l[0], l[1])); ul.appendChild(li);
      });
      col.appendChild(ul);
      inner.appendChild(col);
    });

    // Externe kolom: elke groep is een <details> pull-down.
    var ecol = el('div', { class: 'hub-col' });
    ecol.appendChild(el('h3', { text: extern.titel }));
    extern.groepen.forEach(function (g) {
      var d = el('details', { class: 'hub-dd' });
      d.appendChild(el('summary', { text: g.label }));
      var ul = el('ul');
      g.links.forEach(function (l) {
        var li = el('li'); li.appendChild(link(l[0], l[1])); ul.appendChild(li);
      });
      d.appendChild(ul);
      ecol.appendChild(d);
    });
    inner.appendChild(ecol);

    var section = el('section', { class: 'hub-footer' });
    section.appendChild(inner);

    var bestaand = document.querySelector('footer.sw-footer');
    if (bestaand && bestaand.parentNode) {
      bestaand.parentNode.insertBefore(section, bestaand);
    } else {
      document.body.appendChild(section);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bouw);
  } else {
    bouw();
  }
})();
