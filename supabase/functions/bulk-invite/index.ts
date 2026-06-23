// supabase/functions/bulk-invite/index.ts
//
// Edge Function "bulk-invite" — eenmalige bulk-actie die voor álle adressen in
// de tabel `gebruikers` die nog géén Supabase Auth account hebben een
// uitnodiging verstuurt via auth.admin.inviteUserByEmail().
//
// Bedoeld om bestaande, handmatig (via SQL) toegevoegde bewoners in één keer een
// inloglink te sturen. Veilig om opnieuw te draaien: adressen die al een
// Auth-account hebben worden overgeslagen, dus er gaan nooit dubbele invites uit.
//
// Wordt aangeroepen vanuit admin.html (knop "Bulk-uitnodigen") via:
//   fetch(SUPABASE_URL + '/functions/v1/bulk-invite',
//         { method: 'POST', headers: { Authorization: 'Bearer <jwt>', apikey, … },
//           body: JSON.stringify({ dryRun: false }) })
//
// Net als invite-gebruiker draait het versturen met de SERVICE_ROLE-sleutel
// (auth.admin.*) en kan het dus alleen server-side. Omdat die sleutel alle
// beveiliging omzeilt, controleert de functie eerst of de aanroeper zélf een
// ingelogde beheerder of owner is.
//
// Body-opties (alle optioneel):
//   - dryRun: true   → niets versturen, alleen tellen wie een invite zou krijgen.
//
// Antwoord (JSON):
//   {
//     ok: true,
//     dryRun: false,
//     totaalGebruikers: 42,     // adressen in de tabel `gebruikers`
//     verstuurd: 30,            // nieuwe invites die verstuurd zijn
//     overgeslagen: 12,         // adressen die al een Auth-account hadden
//     mislukt: 0,               // invites die op een fout stuitten
//     fouten: [{ email, fout }] // detail per mislukte invite
//   }
//
// Benodigde omgevingsvariabelen (allemaal automatisch aanwezig in Supabase):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY   (geheim!)
//   - SUPABASE_ANON_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Waar de uitnodigingslink naartoe leidt nadat de gebruiker hem opent
// (gelijk aan invite-gebruiker).
const INVITE_REDIRECT =
  'https://kerndossiers-stillewille.vercel.app/auth-callback.html';

const ADMIN_ROLES = ['beheerder', 'owner'];

// Korte pauze tussen invites om de e-mail-rate-limit van Supabase te ontzien.
const INVITE_DELAY_MS = 600;

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Alle bestaande Auth-accounts ophalen (gepagineerd) en hun e-mailadressen
// als genormaliseerde Set teruggeven, zodat we ze snel kunnen overslaan.
async function bestaandeAuthEmails(
  admin: ReturnType<typeof createClient>,
): Promise<Set<string>> {
  const emails = new Set<string>();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error('Auth-gebruikers ophalen mislukt: ' + error.message);
    const users = data?.users ?? [];
    for (const u of users) {
      if (u.email) emails.add(u.email.trim().toLowerCase());
    }
    if (users.length < perPage) break;
  }
  return emails;
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

  // Service-role client: voor de rolcontrole, het uitlezen van de tabel en de
  // invites zelf.
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
  if (!callerRow || !ADMIN_ROLES.includes(callerRow.rol as string)) {
    return json({ error: 'Geen beheerdersrechten' }, 403);
  }

  // 3. Invoer ----------------------------------------------------------------
  let body: { dryRun?: boolean } = {};
  try {
    if ((req.headers.get('content-type') ?? '').includes('application/json')) {
      body = await req.json();
    }
  } catch {
    /* lege/ongeldige body → standaardwaarden */
  }
  const dryRun = body.dryRun === true;

  // 4. Adressen uit de tabel `gebruikers` ophalen ----------------------------
  const { data: gebruikers, error: gebrErr } = await admin
    .from('gebruikers')
    .select('email');

  if (gebrErr) {
    return json({ error: 'Gebruikers ophalen mislukt: ' + gebrErr.message }, 500);
  }

  // Genormaliseerd + ontdubbeld.
  const alleEmails = Array.from(
    new Set(
      (gebruikers ?? [])
        .map((g) => (g.email ?? '').trim().toLowerCase())
        .filter((e) => e.length > 0),
    ),
  );

  // 5. Bestaande Auth-accounts ophalen om dubbele invites te voorkomen -------
  let authEmails: Set<string>;
  try {
    authEmails = await bestaandeAuthEmails(admin);
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : String(e) },
      500,
    );
  }

  const teVersturen = alleEmails.filter((e) => !authEmails.has(e));

  // 6. Invites versturen (tenzij dryRun) -------------------------------------
  let verstuurd = 0;
  const fouten: Array<{ email: string; fout: string }> = [];

  if (!dryRun) {
    for (const email of teVersturen) {
      const { error } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: INVITE_REDIRECT,
      });
      if (error) {
        const msg = (error.message || '').toLowerCase();
        // Race/bestaand account alsnog → niet als fout tellen.
        if (
          msg.includes('already') ||
          msg.includes('registered') ||
          msg.includes('exists')
        ) {
          // stilletjes overslaan
        } else {
          fouten.push({ email, fout: error.message });
        }
      } else {
        verstuurd++;
      }
      if (INVITE_DELAY_MS > 0) await sleep(INVITE_DELAY_MS);
    }
  }

  return json(
    {
      ok: true,
      dryRun,
      totaalGebruikers: alleEmails.length,
      verstuurd: dryRun ? 0 : verstuurd,
      // Bij dryRun is "overgeslagen" alles wat al een account heeft;
      // het aantal dat verstuurd zóu worden is teVersturen.length.
      teVersturen: teVersturen.length,
      overgeslagen: alleEmails.length - teVersturen.length,
      mislukt: fouten.length,
      fouten,
    },
    200,
  );
});
