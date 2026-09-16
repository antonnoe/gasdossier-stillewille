// supabase/functions/nieuwsbrief-versturen/index.ts
//
// Edge Function "nieuwsbrief-versturen" — verstuurt de nieuwsbrief vanuit het
// beheerpaneel via de Resend API.
//
// Aangeroepen vanuit admin.html:
//   sb.functions.invoke('nieuwsbrief-versturen',
//     { body: { onderwerp, tekst, test: true|false } })
//
//   test: true   één mail naar het adres van de aanroeper zelf. Wordt niet
//                vastgelegd en raakt geen enkele bewoner.
//   test: false  naar alle gebruikers met nieuwsbrief = true. Wordt vastgelegd
//                in public.nieuwsbrieven.
//
// De aanroeper moet beheerder of owner zijn. Dat wordt hier server-side
// gecontroleerd met de service-role sleutel, niet in de frontend.
//
// Benodigde secrets (Supabase → Edge Functions → Manage secrets):
//   - RESEND_API_KEY        API-sleutel uit het Resend-dashboard
//   - NIEUWSBRIEF_SECRET    willekeurige lange tekenreeks; ondertekent de
//                           afmeldlinks. Moet gelijk zijn aan het secret van
//                           de functie "nieuwsbrief-afmelden".
// Automatisch beschikbaar: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NIEUWSBRIEF_SECRET = Deno.env.get('NIEUWSBRIEF_SECRET');

// Zelfde afzender als de auth-mails, zodat het domein al geverifieerd is.
const FROM = 'Kerndossiers De Stille Wille <noreply@dossierfrankrijk.nl>';
const SITE = 'https://kerndossiers-stillewille.vercel.app';

// Resend-limieten. De batch-endpoint neemt maximaal 100 mails per aanroep en
// het account mag standaard 10 aanroepen per seconde doen. We blijven daar
// ruim onder: 100 per batch, met een pauze tussen de batches.
const BATCH_SIZE = 100;
const PAUZE_MS = 600;

const ADMIN_ROLES = ['beheerder', 'owner'];

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

function slaap(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Afmeldlink ------------------------------------------------------------
// De link bevat het e-mailadres plus een handtekening. Zonder het secret is
// die handtekening niet na te maken, dus niemand kan een ander afmelden door
// het adres in de URL te veranderen.
async function handtekening(email: string): Promise<string> {
  const sleutel = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(NIEUWSBRIEF_SECRET ?? ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', sleutel, new TextEncoder().encode(email));
  // base64url, zodat de handtekening veilig in een URL past.
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function afmeldLink(email: string): Promise<string> {
  const s = await handtekening(email);
  return SITE + '/afmelden.html?e=' + encodeURIComponent(email) + '&s=' + s;
}

// --- Tekst naar HTML -------------------------------------------------------
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Platte tekst met lege regels als alineascheiding. URLs worden klikbaar.
// Alles wordt eerst ge-escaped, zodat HTML uit het invoerveld nooit als HTML
// in de mail terechtkomt.
function tekstNaarHtml(tekst: string): string {
  return tekst
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((alinea) => {
      const veilig = escapeHtml(alinea.trim()).replace(/\n/g, '<br>');
      const metLinks = veilig.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" style="color:#1F7F4E;">$1</a>',
      );
      return '<p style="margin:0 0 16px;line-height:1.6;">' + metLinks + '</p>';
    })
    .join('\n');
}

function mailHtml(onderwerp: string, tekst: string, afmeld: string): string {
  return [
    '<!doctype html><html lang="nl"><body style="margin:0;padding:0;background:#F7F5EF;">',
    '<div style="max-width:600px;margin:0 auto;padding:32px 24px;',
    'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;',
    'font-size:16px;color:#2B2B2B;">',
    '<div style="border-top:4px solid #1F7F4E;background:#FFFFFF;border:1px solid #DCE8E0;',
    'border-top:4px solid #1F7F4E;border-radius:12px;padding:32px 28px;">',
    '<p style="margin:0 0 6px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;',
    'color:#1F7F4E;font-weight:700;">Kerndossiers · De Stille Wille</p>',
    '<h1 style="margin:0 0 20px;font-size:22px;line-height:1.25;color:#1A1A1A;">',
    escapeHtml(onderwerp), '</h1>',
    tekstNaarHtml(tekst),
    '<p style="margin:28px 0 0;"><a href="', SITE, '" ',
    'style="display:inline-block;background:#1F7F4E;color:#ffffff;text-decoration:none;',
    'padding:12px 22px;border-radius:8px;font-weight:600;">Naar de kerndossiers</a></p>',
    '</div>',
    '<p style="margin:20px 0 0;font-size:12px;color:#7A7A7A;line-height:1.6;text-align:center;">',
    'U ontvangt deze e-mail omdat u toegang heeft tot de kerndossiers van Landgoed De Stille Wille.<br>',
    '<a href="', afmeld, '" style="color:#7A7A7A;">Geen e-mailupdates meer ontvangen</a>',
    '</p>',
    '</div></body></html>',
  ].join('');
}

function mailTekst(tekst: string, afmeld: string): string {
  return tekst.trim() +
    '\n\n---\n' +
    'U ontvangt deze e-mail omdat u toegang heeft tot de kerndossiers van\n' +
    'Landgoed De Stille Wille. Afmelden voor e-mailupdates:\n' + afmeld + '\n';
}

// --- Versturen via Resend --------------------------------------------------
type Bericht = {
  from: string; to: string[]; subject: string; html: string; text: string;
  headers: Record<string, string>;
};

async function verstuurBatch(berichten: Bericht[]): Promise<{ ok: number; fout: string | null }> {
  const resp = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(berichten),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    return { ok: 0, fout: 'Resend gaf status ' + resp.status + ': ' + body.slice(0, 300) };
  }
  return { ok: berichten.length, fout: null };
}

async function bouwBericht(email: string, onderwerp: string, tekst: string): Promise<Bericht> {
  const afmeld = await afmeldLink(email);
  return {
    from: FROM,
    to: [email],
    subject: onderwerp,
    html: mailHtml(onderwerp, tekst, afmeld),
    text: mailTekst(tekst, afmeld),
    // Laat de mailclient zelf een afmeldknop tonen.
    headers: {
      'List-Unsubscribe': '<' + afmeld + '>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!RESEND_API_KEY) {
    return json({ error: 'RESEND_API_KEY ontbreekt in de secrets van deze functie.' }, 500);
  }
  if (!NIEUWSBRIEF_SECRET) {
    return json({ error: 'NIEUWSBRIEF_SECRET ontbreekt in de secrets van deze functie.' }, 500);
  }

  // 1. Aanroeper authenticeren ----------------------------------------------
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Niet geautoriseerd' }, 401);

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user?.email) return json({ error: 'Niet geautoriseerd' }, 401);
  const callerEmail = userData.user.email;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. Rolcontrole ----------------------------------------------------------
  const { data: callerRow, error: rolErr } = await admin
    .from('gebruikers').select('rol').eq('email', callerEmail).maybeSingle();

  if (rolErr) return json({ error: 'Rolcontrole mislukt: ' + rolErr.message }, 500);
  if (!callerRow || !ADMIN_ROLES.includes(callerRow.rol)) {
    return json({ error: 'Geen beheerdersrechten' }, 403);
  }

  // 3. Invoer ---------------------------------------------------------------
  let body: { onderwerp?: string; tekst?: string; test?: boolean };
  try { body = await req.json(); } catch { return json({ error: 'Ongeldige JSON' }, 400); }

  const onderwerp = (body.onderwerp ?? '').trim();
  const tekst = (body.tekst ?? '').trim();
  const isTest = body.test === true;

  if (!onderwerp) return json({ error: 'Onderwerp ontbreekt' }, 400);
  if (!tekst) return json({ error: 'Tekst ontbreekt' }, 400);

  // 4a. Testmail: alleen naar de aanroeper zelf, niets vastleggen -----------
  if (isTest) {
    const bericht = await bouwBericht(callerEmail, '[TEST] ' + onderwerp, tekst);
    const r = await verstuurBatch([bericht]);
    if (r.fout) return json({ error: r.fout }, 502);
    return json({ ok: true, test: true, naar: callerEmail });
  }

  // 4b. Echte verzending ----------------------------------------------------
  const { data: ontvangers, error: ontvErr } = await admin
    .from('gebruikers').select('email').eq('nieuwsbrief', true);

  if (ontvErr) return json({ error: 'Ontvangers ophalen mislukt: ' + ontvErr.message }, 500);

  const adressen = (ontvangers ?? [])
    .map((r: { email: string }) => (r.email || '').trim())
    .filter((e: string) => e.length > 0);

  if (adressen.length === 0) {
    return json({ error: 'Er staat niemand op de lijst met e-mailupdates aan.' }, 400);
  }

  let verstuurd = 0;
  const fouten: string[] = [];

  for (let i = 0; i < adressen.length; i += BATCH_SIZE) {
    const deel = adressen.slice(i, i + BATCH_SIZE);
    const berichten = await Promise.all(
      deel.map((e) => bouwBericht(e, onderwerp, tekst)),
    );
    const r = await verstuurBatch(berichten);
    verstuurd += r.ok;
    if (r.fout) fouten.push(r.fout);
    // Onder de limiet van 10 aanroepen per seconde blijven.
    if (i + BATCH_SIZE < adressen.length) await slaap(PAUZE_MS);
  }

  // 5. Vastleggen -----------------------------------------------------------
  const { error: logErr } = await admin.from('nieuwsbrieven').insert({
    onderwerp,
    tekst,
    aantal_ontvangers: verstuurd,
    aantal_mislukt: adressen.length - verstuurd,
    verzonden_door: callerEmail,
  });

  return json({
    ok: fouten.length === 0,
    verstuurd,
    mislukt: adressen.length - verstuurd,
    fouten: fouten.slice(0, 3),
    logboek: logErr ? 'vastleggen mislukt: ' + logErr.message : 'vastgelegd',
  }, fouten.length === 0 ? 200 : 502);
});
