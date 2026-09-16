// supabase/functions/nieuwsbrief-afmelden/index.ts
//
// Edge Function "nieuwsbrief-afmelden" — zet de schakelaar E-mailupdates uit
// voor iemand die op de afmeldlink onder in een nieuwsbrief klikt, zónder dat
// die persoon hoeft in te loggen.
//
// Aangeroepen vanuit /afmelden.html:
//   POST { e: "<e-mailadres>", s: "<handtekening>" }
//
// De handtekening is een HMAC-SHA256 over het e-mailadres, gezet door de
// functie "nieuwsbrief-versturen" met hetzelfde secret. Zonder dat secret is
// hij niet na te maken, dus niemand kan een ander afmelden door het adres in
// de URL te veranderen. Dat is hier de hele autorisatie.
//
// LET OP bij deployen: deze functie moet zonder JWT bereikbaar zijn, want
// wie zich afmeldt is per definitie niet ingelogd:
//   supabase functions deploy nieuwsbrief-afmelden --no-verify-jwt
//
// Benodigd secret:
//   - NIEUWSBRIEF_SECRET   exact hetzelfde als bij "nieuwsbrief-versturen"
// Automatisch beschikbaar: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const NIEUWSBRIEF_SECRET = Deno.env.get('NIEUWSBRIEF_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handtekening(email: string): Promise<string> {
  const sleutel = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(NIEUWSBRIEF_SECRET ?? ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', sleutel, new TextEncoder().encode(email));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Vergelijking met vaste looptijd, zodat er niets uit de reactietijd af te
// leiden valt over hoever een gokpoging kwam.
function gelijk(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let verschil = 0;
  for (let i = 0; i < a.length; i++) verschil |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return verschil === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!NIEUWSBRIEF_SECRET) {
    return json({ error: 'NIEUWSBRIEF_SECRET ontbreekt in de secrets van deze functie.' }, 500);
  }

  let body: { e?: string; s?: string };
  try { body = await req.json(); } catch { return json({ error: 'Ongeldige JSON' }, 400); }

  // Bewust NIET normaliseren. De handtekening is gezet over het adres exact
  // zoals het in public.gebruikers staat, dus een geldige handtekening
  // garandeert dat deze tekenreeks daar letterlijk voorkomt. Lowercase maken
  // zou de controle laten mislukken bij een adres met hoofdletters, en een
  // vergelijking met ilike zou onveilig zijn: een underscore in een
  // e-mailadres is voor ilike een jokerteken.
  const email = (body.e ?? '').trim();
  const sig = (body.s ?? '').trim();

  if (!email || !sig) return json({ error: 'Onvolledige afmeldlink' }, 400);
  if (!gelijk(sig, await handtekening(email))) {
    return json({ error: 'Deze afmeldlink is niet geldig.' }, 403);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Alleen de nieuwsbrief-vlag, niets anders. Het account blijft ongemoeid.
  const { error } = await admin
    .from('gebruikers').update({ nieuwsbrief: false }).eq('email', email);

  if (error) return json({ error: 'Afmelden mislukt: ' + error.message }, 500);

  // Bewust geen onderscheid tussen "bestond niet" en "afgemeld": zo is via
  // deze functie niet te achterhalen wie er een account heeft.
  return json({ ok: true });
});
