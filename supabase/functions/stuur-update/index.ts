// supabase/functions/stuur-update/index.ts
//
// Edge Function "stuur-update" — verstuurt een e-mailupdate aan alle bewoners
// die zich niet hebben afgemeld (gebruikers.nieuwsbrief = true).
//
// Aangeroepen vanuit admin.html:
//   sb.functions.invoke('stuur-update', { body: { onderwerp, bericht, link } })
//
// Versturen gebeurt via Resend (https://resend.com). Omdat dit de service-role
// sleutel + een mail-API-sleutel vereist, kan het alleen server-side. De
// functie controleert eerst of de aanroeper beheerder/owner is.
//
// Benodigde secrets (Supabase → Edge Functions → Manage secrets):
//   - RESEND_API_KEY   API-sleutel van Resend
//   - MAIL_FROM        afzender, bv. 'Kerndossiers De Stille Wille <updates@jouwdomein.nl>'
//                      (domein moet in Resend geverifieerd zijn)
//   - SITE_URL         (optioneel) basis-URL, standaard de Vercel-URL
// Automatisch beschikbaar: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const MAIL_FROM = Deno.env.get('MAIL_FROM')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://kerndossiers-stillewille.vercel.app';

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

function esc(s: string): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

// Eenvoudige, spaarzame HTML-mail in de huisstijl.
function bouwHtml(onderwerp: string, bericht: string, link: string | null): string {
  const alineas = esc(bericht).split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;">${p.replace(/\n/g, '<br>')}</p>`).join('');
  const knop = link
    ? `<p style="margin:22px 0;"><a href="${esc(link)}" style="background:#1F7F4E;color:#fff;text-decoration:none;font-weight:600;padding:11px 22px;border-radius:8px;display:inline-block;">Bekijk het dossier</a></p>`
    : '';
  const afmeld = `${SITE_URL}/account.html`;
  return `<!doctype html><html lang="nl"><body style="margin:0;background:#FBF7F2;font-family:Arial,Helvetica,sans-serif;color:#222;">
  <div style="max-width:560px;margin:0 auto;padding:28px 24px;">
    <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#1F7F4E;font-weight:700;margin-bottom:10px;">Kerndossiers · De Stille Wille</div>
    <h1 style="font-size:20px;line-height:1.3;margin:0 0 16px;color:#134E2F;">${esc(onderwerp)}</h1>
    ${alineas}
    ${knop}
    <hr style="border:0;border-top:1px solid #d8e6dd;margin:24px 0;">
    <p style="font-size:12px;line-height:1.6;color:#777;margin:0;">
      U ontvangt deze e-mail omdat u toegang heeft tot de kerndossiers van Landgoed De Stille Wille.
      Geen updates meer ontvangen? Zet ze uit op uw <a href="${esc(afmeld)}" style="color:#1F7F4E;">accountpagina</a>.
    </p>
  </div></body></html>`;
}

async function verstuurBatch(berichten: Array<Record<string, unknown>>): Promise<number> {
  let verzonden = 0;
  for (let i = 0; i < berichten.length; i += 100) {
    const chunk = berichten.slice(i, i + 100);
    const resp = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });
    if (!resp.ok) {
      const tekst = await resp.text();
      throw new Error(`Resend-fout (${resp.status}): ${tekst}`);
    }
    verzonden += chunk.length;
  }
  return verzonden;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // 1. Aanroeper authenticeren
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Niet geautoriseerd' }, 401);

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user?.email) return json({ error: 'Niet geautoriseerd' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. Rolcontrole
  const { data: callerRow, error: rolErr } = await admin
    .from('gebruikers').select('rol').eq('email', userData.user.email).maybeSingle();
  if (rolErr) return json({ error: 'Rolcontrole mislukt: ' + rolErr.message }, 500);
  if (!callerRow || !ADMIN_ROLES.includes(callerRow.rol)) return json({ error: 'Geen beheerdersrechten' }, 403);

  // 3. Invoer
  let body: { onderwerp?: string; bericht?: string; link?: string };
  try { body = await req.json(); } catch { return json({ error: 'Ongeldige JSON' }, 400); }
  const onderwerp = (body.onderwerp ?? '').trim();
  const bericht = (body.bericht ?? '').trim();
  const link = (body.link ?? '').trim() || null;
  if (!onderwerp || !bericht) return json({ error: 'Onderwerp en bericht zijn verplicht' }, 400);

  // 4. Ontvangers ophalen (aangemeld = nieuwsbrief true)
  const { data: ontvangers, error: ontvErr } = await admin
    .from('gebruikers').select('email').eq('nieuwsbrief', true);
  if (ontvErr) return json({ error: 'Ontvangers ophalen mislukt: ' + ontvErr.message }, 500);

  const emails = (ontvangers ?? []).map((r) => r.email).filter(Boolean);
  if (!emails.length) return json({ ok: true, verzonden: 0, melding: 'Geen aangemelde ontvangers.' }, 200);

  // 5. Versturen via Resend (per ontvanger een eigen mail; geen zichtbare cc/bcc)
  const html = bouwHtml(onderwerp, bericht, link);
  const berichten = emails.map((to) => ({ from: MAIL_FROM, to: [to], subject: onderwerp, html }));

  try {
    const verzonden = await verstuurBatch(berichten);
    return json({ ok: true, verzonden }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
