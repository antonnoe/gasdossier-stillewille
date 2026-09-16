// supabase/functions/invite-gebruiker/index.ts
//
// Edge Function "invite-gebruiker" — verstuurt een invite-mail aan een
// goedgekeurde aanvrager.
//
// E-mailupdates staan standaard aan (opt-out). Dat is één kolom in
// public.gebruikers; de bewoner zet hem zelf uit op de accountpagina of via
// de afmeldlink onderaan een nieuwsbrief. Er is geen externe maillijst meer:
// de nieuwsbrief wordt verstuurd door de functie "nieuwsbrief-versturen".
//
// Wordt vanuit admin.html aangeroepen (na de RPC invite_gebruiker) via:
//   fetch(SUPABASE_URL + '/functions/v1/invite-gebruiker',
//         { method: 'POST', headers: { Authorization: 'Bearer <jwt>', apikey, … },
//           body: JSON.stringify({ email }) })
//
// Het versturen van de invite gebeurt met de SERVICE_ROLE-sleutel
// (auth.admin.inviteUserByEmail) en kan daarom alleen server-side. Omdat die
// sleutel alle beveiliging omzeilt, controleert de functie eerst of de
// aanroeper zélf een ingelogde beheerder of owner is.
//
// Benodigde omgevingsvariabelen:
//   - SUPABASE_URL                (automatisch)
//   - SUPABASE_SERVICE_ROLE_KEY   (automatisch — geheim!)
//   - SUPABASE_ANON_KEY           (automatisch)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Waar de uitnodigingslink naartoe leidt nadat de gebruiker hem opent.
const INVITE_REDIRECT = 'https://kerndossiers-stillewille.vercel.app/auth-callback.html';

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // 1. Aanroeper authenticeren -----------------------------------------------
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Niet geautoriseerd' }, 401);
  }

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user?.email) {
    return json({ error: 'Niet geautoriseerd' }, 401);
  }
  const callerEmail = userData.user.email;

  // Service-role client: voor de rolcontrole en de invite zelf.
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
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Ongeldige JSON' }, 400);
  }
  const email = (body.email ?? '').trim().toLowerCase();
  if (!email) {
    return json({ error: 'E-mailadres ontbreekt' }, 400);
  }

  // 4. Invite-mail versturen --------------------------------------------------
  let inviteStatus: Record<string, unknown>;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: INVITE_REDIRECT,
  });

  if (error) {
    // Bestaat de gebruiker al in auth? Dan is een invite niet nodig en is de
    // goedkeuring hiermee klaar.
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      inviteStatus = { ok: true, alreadyInvited: true };
    } else {
      return json({ error: 'Invite versturen mislukt: ' + error.message }, 500);
    }
  } else {
    inviteStatus = { ok: true, userId: data?.user?.id ?? null };
  }

  return json(inviteStatus, 200);
});
