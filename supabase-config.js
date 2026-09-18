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
})();
