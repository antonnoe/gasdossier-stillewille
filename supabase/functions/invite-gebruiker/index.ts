// supabase/functions/invite-gebruiker/index.ts
//
// Edge Function "invite-gebruiker" — de ENIGE weg om iemand toegang te geven.
//
// Waarom deze functie beide kanten doet
// -------------------------------------
// Toegang hangt aan twee lijsten en die moeten allebei kloppen:
//
//   public.gebruikers  autorisatielijst van de site. Wie hier niet in staat,
//                      wordt na het inloggen alsnog uitgelogd
//                      (zie auth-callback.html).
//   auth.users         het Supabase-account. /login.html gebruikt
//                      signInWithOtp met shouldCreateUser: false en signups
//                      staan uit, dus zonder rij hier komt er geen
//                      toegangslink — hoe netjes de gebruikers-rij ook is.
//
// Tot september 2026 zette het beheerpaneel alleen de rij in gebruikers en
// was de invite-mail een losse, optionele tweede stap. Wie daar tussenuit
// viel, stond wel op de lijst maar kon niet inloggen. Daarom doet deze
// functie nu altijd allebei, in één aanroep, met één antwoord.
//
// Twee modi
// ---------
//   modus 'aanvraag'  (standaard) — keurt een bestaande aanvraag goed.
//                     Naam, categorie en huisnummer komen uit de aanvraag.
//                     RPC: invite_gebruiker(p_email)
//   modus 'handmatig' — verleent toegang zonder aanvraag, met gegevens uit
//                     het formulier "Gebruiker toevoegen" op /admin.html.
//                     RPC: voeg_gebruiker_toe(p_email, p_naam, …)
//
// Beide RPC's zijn SECURITY DEFINER en draaien controleer_toegang(): de
// rolcontrole, de toegangspauze (app_instellingen.toegang_vanaf) en de
// accountlimieten per categorie. Die worden hier bewust NIET nagebouwd —
// de functie roept ze aan namens de ingelogde beheerder, zodat er maar één
// plek is waar die regels staan.
//
// E-mailupdates staan standaard aan (opt-out). Dat is één kolom in
// public.gebruikers; de bewoner zet hem zelf uit op de accountpagina of via
// de afmeldlink onderaan een nieuwsbrief.
//
// Aanroep vanuit admin.html:
//   fetch(SUPABASE_URL + '/functions/v1/invite-gebruiker',
//         { method: 'POST', headers: { Authorization: 'Bearer <jwt>', apikey, … },
//           body: JSON.stringify({ email, modus, naam, categorie, huisnummer }) })
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

// Bestaat het adres al als Supabase-account? inviteUserByEmail meldt dat met
// een tekst die per versie verschilt; daarom op meerdere woorden testen.
function isReedsAccount(bericht: string): boolean {
  const m = bericht.toLowerCase();
  return m.includes('already') || m.includes('registered') || m.includes('exists');
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

  // Client die namens de ingelogde beheerder werkt. Hiermee worden de RPC's
  // aangeroepen, zodat huidige_rol() binnen controleer_toegang() de juiste
  // persoon ziet.
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
  //    De RPC's controleren dit zelf ook. Hier gebeurt het alvast, zodat een
  //    willekeurige ingelogde bezoeker niet eens bij de service-role sleutel
  //    in de buurt komt.
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
  let body: {
    email?: string;
    modus?: string;
    naam?: string;
    categorie?: string;
    huisnummer?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Ongeldige JSON' }, 400);
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email) {
    return json({ error: 'E-mailadres ontbreekt' }, 400);
  }
  const modus = (body.modus ?? 'aanvraag').trim().toLowerCase();
  if (modus !== 'aanvraag' && modus !== 'handmatig') {
    return json({ error: 'Onbekende modus: ' + modus }, 400);
  }

  // 4. Stap 1 — de rij in public.gebruikers ----------------------------------
  //    Via de bestaande RPC's, namens de beheerder. Die doen de rolcontrole,
  //    de toegangspauze en de accountlimieten (controleer_toegang).
  let rpcResultaat: unknown;
  if (modus === 'handmatig') {
    const { data, error } = await callerClient.rpc('voeg_gebruiker_toe', {
      p_email: email,
      p_naam: (body.naam ?? '').trim() || null,
      p_categorie: (body.categorie ?? '').trim() || null,
      p_huisnummer: (body.huisnummer ?? '').trim() || null,
    });
    if (error) {
      return json({ error: error.message, stap: 'gebruiker' }, 400);
    }
    rpcResultaat = data;
  } else {
    const { data, error } = await callerClient.rpc('invite_gebruiker', {
      p_email: email,
    });
    if (error) {
      return json({ error: error.message, stap: 'gebruiker' }, 400);
    }
    rpcResultaat = data;
  }

  // 5. Stap 2 — het Supabase-account in auth.users ---------------------------
  //    Zonder deze stap staat iemand wél op de lijst maar krijgt hij op
  //    /login.html geen toegangslink.
  let authStatus: 'uitgenodigd' | 'bestond_al' | 'mislukt' = 'uitgenodigd';
  let authMelding: string | null = null;
  let userId: string | null = null;

  const { data: inviteData, error: inviteErr } =
    await admin.auth.admin.inviteUserByEmail(email, { redirectTo: INVITE_REDIRECT });

  if (inviteErr) {
    if (isReedsAccount(inviteErr.message || '')) {
      // Het account bestond al. Geen tweede uitnodiging nodig: deze persoon
      // kan gewoon een toegangslink opvragen op /login.html.
      authStatus = 'bestond_al';
    } else {
      authStatus = 'mislukt';
      authMelding = inviteErr.message || 'onbekende fout';
    }
  } else {
    userId = inviteData?.user?.id ?? null;
  }

  // Bewust status 200 als alleen stap 2 faalde: de autorisatie zelf staat er
  // dan wel. admin.html leest `authStatus` en meldt precies wat er nog mist.
  return json({
    ok: authStatus !== 'mislukt',
    email,
    modus,
    gebruiker: rpcResultaat,
    authStatus,
    authMelding,
    userId,
  }, 200);
});
