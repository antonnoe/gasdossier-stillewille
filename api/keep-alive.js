/**
 * /api/keep-alive.js — houdt het Supabase-project wakker.
 *
 * Gratis Supabase-projecten pauzeren na 7 dagen zonder database-activiteit.
 * Staat het project eenmaal op pauze, dan mislukt de magic-link login voor
 * iedereen ("Failed to fetch" op /login.html). Deze function doet één lichte
 * leesquery op public.gebruikers — de tabel waar de hele autorisatie op leunt
 * (zie supabase/sql/rls-policies.sql en BEHEERDERS.md) — en telt daarmee als
 * database-activiteit. Er wordt niets geschreven.
 *
 * Aangeroepen door de Vercel-cron uit vercel.json (dagelijks, 04:00 UTC).
 *
 * Env vars (Vercel → Project Settings → Environment Variables):
 *   SUPABASE_SERVICE_ROLE_KEY  verplicht, geheim. Zelfde sleutel als de
 *                              Edge Functions gebruiken. Nodig omdat RLS op
 *                              gebruikers anders elke rij wegfiltert.
 *   SUPABASE_URL               optioneel; valt terug op de project-URL uit
 *                              supabase-config.js.
 *   CRON_SECRET                optioneel. Staat die gezet, dan eist deze
 *                              route de header Authorization: Bearer <secret>.
 *                              Vercel stuurt die header bij cron-runs
 *                              automatisch mee zodra de env var bestaat.
 *
 * Naast deze route bestaat .github/workflows/supabase-keepalive.yml, die de
 * Auth-API pingt. Bewust allebei: ze falen op verschillende manieren (GitHub
 * schakelt geplande workflows uit na 60 dagen zonder commits; een Vercel-cron
 * niet), en alleen deze route raakt daadwerkelijk de database.
 */
'use strict';

var DEFAULT_SUPABASE_URL = 'https://pmnquozexgxhpbpuergj.supabase.co';

// Bestaat zeker: gedefinieerd in supabase/sql/rls-policies.sql, gevuld door
// supabase/sql/bulk-authoriseer.sql, gelezen door admin.html en account.html.
var TABLE = 'gebruikers';

module.exports = async function handler(req, res) {
  var now = new Date().toISOString();

  // Alleen afschermen als er een secret is ingesteld.
  var secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== 'Bearer ' + secret) {
    res.status(401).json({ ok: false, error: 'Ongeldige of ontbrekende autorisatie', timestamp: now });
    return;
  }

  var baseUrl = (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/+$/, '');
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    res.status(500).json({
      ok: false,
      table: TABLE,
      timestamp: now,
      error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt in de environment variables.'
    });
    return;
  }

  // Lichtste zinvolle leesquery: één rij, één niet-herleidbare kolom.
  var url = baseUrl + '/rest/v1/' + TABLE + '?select=rol&limit=1';

  try {
    var response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      var body = await response.text();
      throw new Error(
        'Supabase antwoordde met status ' + response.status + ': ' + body.slice(0, 300)
      );
    }

    // Body wel uitlezen (zodat de query echt volledig wordt afgehandeld),
    // maar niet teruggeven: er hoeft geen gebruikersdata in de logs te staan.
    await response.json();

    res.status(200).json({ ok: true, table: TABLE, timestamp: now });
  } catch (err) {
    // Bewust status 500: zo is een mislukte run zichtbaar in de Vercel-logs
    // en in het cron-overzicht, in plaats van stilletjes te slagen.
    res.status(500).json({
      ok: false,
      table: TABLE,
      timestamp: now,
      error: err && err.message ? err.message : String(err)
    });
  }
};
