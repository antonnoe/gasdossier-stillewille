// supabase/scripts/herstel-scheefstand.mjs
//
// Eenmalig herstel van de scheefstand tussen de twee lijsten waar toegang
// aan hangt. Draait vanuit de workflow "Toegang herstellen"; heeft de
// service-role sleutel nodig en kan daarom niet vanuit de browser.
//
// Wat het doet
// ------------
//   1. Leest public.gebruikers en auth.users en vergelijkt ze.
//   2. Voor elk adres dat ALLEEN in gebruikers staat: een Supabase-account
//      aanmaken met createUser({ email, email_confirm: true }). Bewust géén
//      uitnodigingsmail: deze mensen zijn al geautoriseerd en vragen zelf een
//      toegangslink op via /login.html.
//   3. Voor elk adres dat ALLEEN in auth.users staat: rapporteren, verder
//      niets. Verwijderen gebeurt met de hand, na een blik van een mens.
//   4. Openstaande aanvragen van adressen die inmiddels in gebruikers staan,
//      op 'approved' zetten.
//
// Met --dry-run wordt er niets geschreven.
//
// De uitvoer op stdout bevat GEEN e-mailadressen (workflow-logs zijn
// leesbaar voor iedereen met repository-toegang). De volledige lijst gaat
// naar out/herstel-rapport.json, dat de workflow als artifact bewaart.
//
// Wil je de status van één specifiek adres apart terugzien, geef dat dan mee
// in de omgevingsvariabele VOLG_ADRES. Het adres staat dan wél in de
// workflow-invoer, dus gebruik dat alleen als dat geen bezwaar is; het komt
// bewust niet in dit bestand te staan.

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
// Optioneel: één adres waarvan de status apart wordt gerapporteerd.
const VOLG_ADRES = (process.env.VOLG_ADRES || '').trim().toLowerCase();

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn allebei nodig.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const norm = (e) => (e || '').trim().toLowerCase();

// auth.users komt gepagineerd binnen; doorlopen tot een lege pagina.
async function alleAuthGebruikers() {
  const alles = [];
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error('listUsers mislukt: ' + error.message);
    const users = data?.users ?? [];
    alles.push(...users);
    if (users.length < 1000) break;
  }
  return alles;
}

async function main() {
  const { data: gebruikers, error: gErr } = await sb
    .from('gebruikers')
    .select('email, naam, rol, categorie, huisnummer');
  if (gErr) throw new Error('gebruikers lezen mislukt: ' + gErr.message);

  const authUsers = await alleAuthGebruikers();

  const authOpEmail = new Map();
  for (const u of authUsers) {
    if (u.email) authOpEmail.set(norm(u.email), u);
  }
  const gebruikersEmails = new Set(gebruikers.map((g) => norm(g.email)));

  const inBeide = [];
  const alleenGebruikers = [];
  for (const g of gebruikers) {
    const e = norm(g.email);
    const u = authOpEmail.get(e);
    if (u) {
      inBeide.push({ email: e, rol: g.rol, categorie: g.categorie,
                     last_sign_in_at: u.last_sign_in_at ?? null });
    } else {
      alleenGebruikers.push({ email: e, naam: g.naam, rol: g.rol,
                              categorie: g.categorie, huisnummer: g.huisnummer });
    }
  }
  const alleenAuth = authUsers
    .filter((u) => u.email && !gebruikersEmails.has(norm(u.email)))
    .map((u) => ({ email: norm(u.email), created_at: u.created_at,
                   invited_at: u.invited_at ?? null,
                   last_sign_in_at: u.last_sign_in_at ?? null }));

  console.log('in beide lijsten      :', inBeide.length);
  console.log('alleen in gebruikers  :', alleenGebruikers.length);
  console.log('alleen in auth.users  :', alleenAuth.length);

  // --- Stap 2: ontbrekende auth-accounts aanmaken --------------------------
  const aangemaakt = [];
  const mislukt = [];
  for (const g of alleenGebruikers) {
    if (DRY_RUN) { aangemaakt.push({ email: g.email, dryRun: true }); continue; }
    const { data, error } = await sb.auth.admin.createUser({
      email: g.email,
      email_confirm: true,
    });
    if (error) {
      mislukt.push({ email: g.email, fout: error.message });
    } else {
      aangemaakt.push({ email: g.email, userId: data?.user?.id ?? null });
    }
  }
  console.log('accounts aangemaakt   :', aangemaakt.length, DRY_RUN ? '(dry-run)' : '');
  if (mislukt.length) console.log('accounts mislukt      :', mislukt.length);

  // --- Stap 4: openstaande aanvragen van geautoriseerden afhandelen --------
  const { data: pending, error: aErr } = await sb
    .from('aanvragen')
    .select('id, email, status, created_at')
    .eq('status', 'pending');
  if (aErr) throw new Error('aanvragen lezen mislukt: ' + aErr.message);

  const afTeHandelen = (pending ?? []).filter((a) => gebruikersEmails.has(norm(a.email)));
  const goedgekeurd = [];
  for (const a of afTeHandelen) {
    if (DRY_RUN) { goedgekeurd.push({ id: a.id, email: norm(a.email), dryRun: true }); continue; }
    const { error } = await sb.from('aanvragen').update({ status: 'approved' }).eq('id', a.id);
    if (error) {
      mislukt.push({ email: norm(a.email), fout: 'aanvraag bijwerken: ' + error.message });
    } else {
      goedgekeurd.push({ id: a.id, email: norm(a.email) });
    }
  }
  console.log('aanvragen goedgekeurd :', goedgekeurd.length, DRY_RUN ? '(dry-run)' : '');

  // --- Status van één specifiek adres, als daarom gevraagd is -------------
  let volg = null;
  if (VOLG_ADRES) {
    const vAuth = authOpEmail.get(VOLG_ADRES) ?? null;
    const vAanvragen = (pending ?? []).filter((a) => norm(a.email) === VOLG_ADRES);
    volg = {
      staatInAuth: Boolean(vAuth),
      authAangemaakt: vAuth?.created_at ?? null,
      uitgenodigdOp: vAuth?.invited_at ?? null,
      emailBevestigdOp: vAuth?.email_confirmed_at ?? null,
      lastSignIn: vAuth?.last_sign_in_at ?? null,
      staatInGebruikers: gebruikersEmails.has(VOLG_ADRES),
      accountNuAangemaakt: aangemaakt.some((a) => a.email === VOLG_ADRES),
      openstaandeAanvragen: vAanvragen.length,
      aanvraagGoedgekeurd: goedgekeurd.some((a) => a.email === VOLG_ADRES),
    };
    // Alleen de statusvelden, niet het adres zelf.
    console.log('gevolgd adres         :', JSON.stringify(volg));
  }

  mkdirSync('out', { recursive: true });
  writeFileSync('out/herstel-rapport.json', JSON.stringify({
    dryRun: DRY_RUN,
    tijdstip: new Date().toISOString(),
    groepen: { inBeide, alleenGebruikers, alleenAuth },
    aangemaakt, goedgekeurd, mislukt, volg,
  }, null, 2));
  console.log('rapport geschreven naar out/herstel-rapport.json');

  if (mislukt.length) process.exit(1);
}

main().catch((err) => { console.error(err.message || String(err)); process.exit(1); });
