// supabase/functions/approve-aanvraag/index.ts
//
// Edge Function "approve-aanvraag" — keurt een toegangsaanvraag goed.
//
// Wordt aangeroepen vanuit admin.html via:
//   sb.functions.invoke('approve-aanvraag', { body: { email, naam } })
//
// De functie draait met de SERVICE_ROLE-sleutel (Admin API) en mag daarmee,
// buiten RLS om, een rij in tabel "gebruikers" schrijven. Omdat die sleutel
// alle beveiliging omzeilt, controleert de functie éérst of de aanroeper zélf
// een ingelogde beheerder of owner is.
//
// Stappen:
//   1. Aanroeper authenticeren via het meegestuurde JWT (Authorization-header).
//   2. Controleren dat die gebruiker rol "beheerder" of "owner" heeft.
//   3. De aangevraagde gebruiker toevoegen aan "gebruikers" met rol "gebruiker".
//   4. De bijbehorende aanvraag op status "approved" zetten.
//
// Benodigde omgevingsvariabelen (worden door Supabase automatisch geïnjecteerd):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY   (geheim — nooit in client-side code!)
//   - SUPABASE_ANON_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const ADMIN_ROLES = ['beheerder', 'owner'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // 1. Aanroeper authenticeren ------------------------------------------------
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Niet geautoriseerd' }, 401);
  }

  // Client met het JWT van de aanroeper (om de gebruiker uit te lezen).
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user?.email) {
    return json({ error: 'Niet geautoriseerd' }, 401);
  }
  const callerEmail = userData.user.email;

  // Service-role client: omzeilt RLS voor de rolcontrole en de schrijfacties.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. Rolcontrole: is de aanroeper beheerder/owner? -------------------------
  const { data: callerRow, error: rolErr } = await admin
    .from('gebruikers')
    .select('rol')
    .eq('email', callerEmail)
    .maybeSingle();

  if (rolErr) {
    return json({ error: 'Rolcontrole mislukt: ' + rolErr.message }, 500);
  }
  if (!callerRow || !ADMIN_ROLES.includes(callerRow.rol)) {
    return json({ error: 'Geen beheerdersrechten' }, 403);
  }

  // 3. Invoer valideren -------------------------------------------------------
  let body: { email?: string; naam?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Ongeldige JSON' }, 400);
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const naam = (body.naam ?? '').trim();
  if (!email) {
    return json({ error: 'E-mailadres ontbreekt' }, 400);
  }

  // 4. Gebruiker toevoegen (rol "gebruiker") ---------------------------------
  // Upsert op e-mail zodat een bestaande gebruiker niet dubbel wordt toegevoegd.
  const { error: upsertErr } = await admin
    .from('gebruikers')
    .upsert(
      { email, naam: naam || null, rol: 'gebruiker' },
      { onConflict: 'email', ignoreDuplicates: false },
    );

  if (upsertErr) {
    return json({ error: 'Toevoegen mislukt: ' + upsertErr.message }, 500);
  }

  // 5. Aanvraag op "approved" zetten -----------------------------------------
  const { error: statusErr } = await admin
    .from('aanvragen')
    .update({ status: 'approved' })
    .eq('email', email)
    .eq('status', 'pending');

  if (statusErr) {
    // Gebruiker is wel toegevoegd; status bijwerken faalde. Niet fataal.
    return json(
      { ok: true, warning: 'Gebruiker toegevoegd, maar status bijwerken mislukte: ' + statusErr.message },
      200,
    );
  }

  return json({ ok: true, email, rol: 'gebruiker' }, 200);
});
