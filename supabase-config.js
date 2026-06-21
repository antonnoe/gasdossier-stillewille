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
  window.swSetAuthCookie = function (session) {
    if (session && session.access_token) {
      var maxAge = session.expires_in || 3600;
      document.cookie =
        COOKIE_NAME + '=' + session.access_token +
        '; Path=/; Max-Age=' + maxAge + '; SameSite=Lax; Secure';
    } else {
      document.cookie =
        COOKIE_NAME + '=; Path=/; Max-Age=0; SameSite=Lax; Secure';
    }
  };

  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase JS niet geladen — controleer de CDN-<script> vóór supabase-config.js.');
    return;
  }

  // Implicit flow → het token komt in de URL-hash terecht (#access_token=…),
  // wat auth-callback.html via getSession() verwerkt.
  window.sb = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'implicit',
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
