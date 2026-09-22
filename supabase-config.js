/**
 * supabase-config.js — gedeelde Supabase-client voor de statische site.
 *
 * Laad dit ná de Supabase CDN-bundel:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="/supabase-config.js"></script>
 *
 * De anon key is een publieke sleutel en mag veilig in client-side code staan.
 * (Eén plek beheren i.p.v. dezelfde sleutel in elk HTML-bestand hardcoden.)
 *
 * Naast de client zorgt dit bestand ervoor dat het access-token in een cookie
 * (`sb-access-token`) wordt gespiegeld, zodat de Vercel Edge Middleware de
 * sessie kan controleren. De volledige sessie blijft in localStorage staan
 * zodat tokens automatisch ververst worden.
 */
(function () {
  'use strict';

  window.SUPABASE_URL = 'https://pmnquozexgxhpbpuergj.supabase.co';
  window.SUPABASE_PROJECT_REF = 'pmnquozexgxhpbpuergj';

  // ⚠️ VERVANG dit door de publieke anon key uit het Supabase-dashboard
  //    (Project Settings → API → Project API keys → anon / public).
  window.SUPABASE_ANON_KEY = 'sb_publishable_NMp666YWWKcObtkPD4EvAQ_p3ChGeRk';

  var COOKIE_NAME = 'sb-access-token';

  // Spiegel het access-token naar een cookie zodat de Edge Middleware het ziet.
  // De cookie krijgt bewust een langere levensduur dan het token zelf: zo blijft
  // het (inmiddels verlopen) JWT leesbaar voor de middleware, die dan "verlopen"
  // kan onderscheiden van "niet ingelogd" en naar ?reden=verlopen kan sturen.
  var COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dagen
  window.swSetAuthCookie = function (session) {
    if (session && session.access_token) {
      document.cookie =
        COOKIE_NAME + '=' + session.access_token +
        '; Path=/; Max-Age=' + COOKIE_MAX_AGE + '; SameSite=Lax; Secure';
    } else {
      document.cookie =
        COOKIE_NAME + '=; Path=/; Max-Age=0; SameSite=Lax; Secure';
    }
  };

  // ---------------------------------------------------------------------
  // Bestemming na inloggen
  //
  // De Edge Middleware geeft bij een redirect naar de loginpagina het
  // oorspronkelijke pad mee als ?naar=<pad>. Na het inloggen moet de bezoeker
  // daar weer uitkomen in plaats van steevast op de voorpagina. Omdat die
  // waarde uit de URL komt, wordt hij eerst gekeurd: alleen een pad op deze
  // site is toegestaan. Een absolute URL (https://evil.com) of een
  // protocol-relatieve verwijzing (//evil.com) zou een open redirect zijn.
  //
  // Bij een inloglink per mail komt de bezoeker terug op auth-callback.html,
  // en die pagina krijgt ?naar= niet mee: de link in de mail is los van de
  // oorspronkelijke URL. Daarom wordt de bestemming bij het aanvragen van de
  // link opgeslagen in deze browser, en op de callbackpagina weer gelezen.
  // Opslag kan falen (privémodus, geblokkeerde site-gegevens); dat mag het
  // inloggen nooit tegenhouden, vandaar de try/catch.
  // ---------------------------------------------------------------------
  var BESTEMMING_SLEUTEL = 'sw-naar';
  var STANDAARD_BESTEMMING = '/index.html';

  window.swVeiligPad = function (pad) {
    if (typeof pad !== 'string' || !pad) return null;
    if (pad.charAt(0) !== '/') return null;
    // //evil.com is protocol-relatief; /\evil.com lezen browsers net zo.
    if (pad.charAt(1) === '/' || pad.charAt(1) === '\\') return null;
    return pad;
  };

  window.swBewaarBestemming = function (pad) {
    var veilig = window.swVeiligPad(pad);
    var opslagen = [];
    try { opslagen.push(window.sessionStorage); } catch (e) { /* niet beschikbaar */ }
    try { opslagen.push(window.localStorage); } catch (e) { /* niet beschikbaar */ }
    for (var i = 0; i < opslagen.length; i++) {
      try {
        if (veilig) opslagen[i].setItem(BESTEMMING_SLEUTEL, veilig);
        else opslagen[i].removeItem(BESTEMMING_SLEUTEL);
      } catch (e) { /* vol of geweigerd */ }
    }
  };

  window.swLeesBestemming = function () {
    var pad = null;
    try { pad = window.sessionStorage.getItem(BESTEMMING_SLEUTEL); } catch (e) { /* idem */ }
    if (!pad) {
      try { pad = window.localStorage.getItem(BESTEMMING_SLEUTEL); } catch (e) { /* idem */ }
    }
    return window.swVeiligPad(pad) || STANDAARD_BESTEMMING;
  };

  window.swVergeetBestemming = function () { window.swBewaarBestemming(null); };

  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase JS niet geladen — controleer de CDN-<script> vóór supabase-config.js.');
    return;
  }

  // PKCE in plaats van implicit flow.
  //
  // Bij implicit flow zit het toegangstoken zélf in de link die per e-mail
  // wordt verstuurd. Wie die mail doorstuurt, geeft zijn toegang weg: de
  // ontvanger klikt en zit binnen, ingelogd als de oorspronkelijke bewoner.
  //
  // Met PKCE legt de browser die de link aanvraagt een geheim vast op dít
  // apparaat (de code verifier, in localStorage). De link bevat dan geen
  // token maar een code, en die code is alleen iets waard in combinatie met
  // dat geheim. Klikt iemand anders erop in zijn eigen browser, dan mislukt
  // het inloggen.
  //
  // De prijs: aanvragen en openen moet in dezelfde browser gebeuren. Vraagt
  // een bewoner de link aan op de laptop en opent hij de mail op zijn
  // telefoon, dan werkt het niet. auth-callback.html herkent dat geval en
  // zegt het met zoveel woorden.
  //
  // Let op: uitnodigingsmails (inviteUserByEmail, verstuurd door de Edge
  // Function) worden server-side aangemaakt zonder code verifier. Die
  // komen dus nog wel met een token in de URL-hash binnen. Daarom blijft
  // auth-callback.html allebei de vormen afhandelen.
  window.sb = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    }
  );

  // Houd de cookie in sync met de sessie-status.
  window.sb.auth.onAuthStateChange(function (_event, session) {
    window.swSetAuthCookie(session);
  });

  // ---------------------------------------------------------------------
  // Toegangscontrole na het inloggen
  //
  // Een geldige sessie is niet hetzelfde als toegang. Toegang hangt aan twee
  // lijsten: auth.users (het Supabase-account, waar de inloglink aan hangt)
  // en public.gebruikers (de autorisatielijst van de site). Wie alleen een
  // account heeft, komt langs de Edge Middleware en zou alle dossierpagina's
  // kunnen lezen. Daarom wordt ná het inloggen gecontroleerd of het adres
  // ook op de autorisatielijst staat.
  //
  // De RLS-policy "gebruikers_select_eigen_of_beheer" laat een gewone
  // bewoner precies zijn eigen rij zien (een beheerder of de owner ziet
  // alles), dus geen rij = geen toegang.
  //
  // Zowel auth-callback.html (na de link) als login.html (na een
  // overgetypte code) gebruikt deze functie, zodat de twee wegen naar
  // binnen niet uit elkaar kunnen lopen.
  // ---------------------------------------------------------------------
  window.swControleerToegang = function (email) {
    var adres = (email || '').trim().toLowerCase();
    return window.sb.from('gebruikers').select('email').eq('email', adres).maybeSingle()
      .then(function (g) {
        // Niet kunnen controleren is geen toegang verlenen.
        if (g.error) return { ok: false, reden: 'toegang-controle-fout', detail: g.error.message };
        if (!g.data)  return { ok: false, reden: 'niet-op-lijst' };
        return { ok: true };
      })
      .catch(function (err) {
        return { ok: false, reden: 'toegang-controle-fout', detail: (err && err.message) || String(err) };
      });
  };

  // ---------------------------------------------------------------------
  // Logboek van mislukte inlogpogingen
  //
  // Een bewoner die vastloopt is anders onzichtbaar: hij mailt, belt, of hij
  // geeft het op. Elke mislukte poging schrijft hier een regel, zodat een
  // dagelijkse melding kan laten zien wie er niet binnenkomt en waarom.
  //
  // Dit mag nooit in de weg zitten. De aanroep is "erbij", niet "ervoor":
  // de belofte wordt niet afgewacht en een fout wordt ingeslikt. De tabel
  // begrenst de veldlengtes zelf, maar we korten hier alvast in zodat een
  // lange foutmelding of user agent niet tot een afgewezen insert leidt.
  // ---------------------------------------------------------------------
  window.swMeldInlogFout = function (soort, detail, email) {
    function kort(waarde, max) {
      if (waarde === null || waarde === undefined) return null;
      var t = String(waarde);
      return t.length > max ? t.slice(0, max) : t;
    }
    try {
      window.sb.from('inlog_fouten').insert({
        soort: soort,
        email: kort((email || '').trim().toLowerCase(), 320) || null,
        detail: kort(detail, 500),
        user_agent: kort(navigator.userAgent, 400)
      }).then(function () { /* gelukt of niet, de bezoeker merkt er niets van */ },
              function () { /* idem */ });
    } catch (e) { /* idem */ }
  };
})();
