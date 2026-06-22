// supabase/functions/laposta-sync/index.ts
//
// Edge Function "laposta-sync" — koppelt de aan/uit-schakelaar op de
// accountpagina aan een Laposta-mailinglijst.
//
// Aangeroepen vanuit account.html door een ingelogde bewoner voor zijn EIGEN
// inschrijving:
//   sb.functions.invoke('laposta-sync', { body: { aan: true | false } })
//
// De functie haalt het e-mailadres uit het JWT (niet uit de body), zodat
// niemand een ander kan in-/uitschrijven. Vervolgens:
//   aan  = lid toevoegen aan de Laposta-lijst (single opt-in) en member-id
//          opslaan in gebruikers.laposta_id
//   uit  = lid afmelden (DELETE) via het opgeslagen member-id
// Daarnaast wordt gebruikers.nieuwsbrief bijgewerkt als lokale spiegel.
//
// Benodigde secrets (Supabase → Edge Functions → Manage secrets):
//   - LAPOSTA_API_KEY   API-sleutel uit Laposta (Instellingen → API)
//   - LAPOSTA_LIST_ID   id van de mailinglijst waarop bewoners komen
// Automatisch beschikbaar: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const LAPOSTA_API_KEY = Deno.env.get('LAPOSTA_API_KEY')!;
const LAPOSTA_LIST_ID = Deno.env.get('LAPOSTA_LIST_ID')!;

const LAPOSTA_BASE = 'https://api.laposta.nl/v2';
const LAPOSTA_AUTH = 'Basic ' + btoa(LAPOSTA_API_KEY + ':');

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

function form(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&');
}

// Voegt het lid toe (of werkt het bij) en geeft het Laposta member-id terug.
// ignore_doubleoptin: bewoners zijn al geverifieerd, dus geen bevestigingsmail.
async function lapostaUpsert(email: string, ip: string, stil: boolean): Promise<string> {
  const body: Record<string, string> = {
    list_id: LAPOSTA_LIST_ID,
    email,
    ip,
    'options[ignore_doubleoptin]': 'true',
  };
  if (stil) body['options[suppress_email_welcome]'] = 'true';

  const resp = await fetch(`${LAPOSTA_BASE}/member`, {
    method: 'POST',
    headers: { 'Authorization': LAPOSTA_AUTH, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`Laposta toevoegen (${resp.status}): ${JSON.stringify(data)}`);
  const id = data?.member?.member_id ?? data?.member?.id;
  if (!id) throw new Error('Laposta gaf geen member_id terug');
  return String(id);
}

async function lapostaDelete(memberId: string): Promise<void> {
  const resp = await fetch(
    `${LAPOSTA_BASE}/member/${encodeURIComponent(memberId)}?` + form({ list_id: LAPOSTA_LIST_ID }),
    { method: 'DELETE', headers: { 'Authorization': LAPOSTA_AUTH } },
  );
  if (!resp.ok && resp.status !== 404) {
    const data = await resp.text();
    throw new Error(`Laposta afmelden (${resp.status}): ${data}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // 1. Aanroeper authenticeren — e-mail komt uit het JWT, niet uit de body.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Niet geautoriseerd' }, 401);

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user?.email) return json({ error: 'Niet geautoriseerd' }, 401);
  const email = userData.user.email;

  // 2. Invoer
  let body: { aan?: boolean };
  try { body = await req.json(); } catch { return json({ error: 'Ongeldige JSON' }, 400); }
  const aan = body.aan === true;

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || '0.0.0.0';
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    if (aan) {
      // Aanmelden: toevoegen aan Laposta + member-id bewaren.
      const memberId = await lapostaUpsert(email, ip, false);
      const { error } = await admin.from('gebruikers')
        .update({ nieuwsbrief: true, laposta_id: memberId }).eq('email', email);
      if (error) return json({ error: 'Opslaan mislukt: ' + error.message }, 500);
    } else {
      // Afmelden: member-id ophalen (of stil aanmaken om het id te krijgen) en verwijderen.
      const { data: row } = await admin.from('gebruikers')
        .select('laposta_id').eq('email', email).maybeSingle();
      let memberId = row?.laposta_id as string | null;
      if (!memberId) memberId = await lapostaUpsert(email, ip, true);
      await lapostaDelete(memberId);
      const { error } = await admin.from('gebruikers')
        .update({ nieuwsbrief: false, laposta_id: memberId }).eq('email', email);
      if (error) return json({ error: 'Opslaan mislukt: ' + error.message }, 500);
    }
    return json({ ok: true, aan }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
