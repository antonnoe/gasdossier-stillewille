// supabase/scripts/backup-via-api.mjs
//
// Backup van de Supabase-inhoud via de API, met de service-role sleutel.
//
// Waarom niet met pg_dump: dat vraagt een werkende databaseverbinding
// (SUPABASE_DB_URL) en die bleef in september 2026 hangen op de
// wachtwoordcontrole van de pooler. De service-role sleutel werkt wél en
// komt bij dezelfde gegevens. Wat deze backup niet meeneemt is de
// structuur: tabellen, functies en RLS-policies. Die staan in de
// repository (supabase/schema.sql, supabase/sql/, supabase/migrations/).
// Samen is dat genoeg om het project opnieuw op te bouwen.
//
// Uitvoer, in out/:
//   <tabel>.json      alle rijen per tabel
//   auth-users.json   de Supabase-accounts (e-mail, tijdstippen, id)
//   manifest.json     wat er is geëxporteerd, met aantallen
//
// Op stdout komen alleen aantallen. Persoonsgegevens staan in de bestanden,
// die de workflow als artifact bewaart.

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn allebei nodig.');
  process.exit(1);
}

// Alle tabellen uit supabase/schema.sql.
const TABELLEN = [
  'gebruikers',
  'aanvragen',
  'app_instellingen',
  'reacties',
  'correctieverzoeken',
  'peiling',
  'nieuwsbrieven',
];

const PAGINA = 1000;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// PostgREST geeft maximaal een paar duizend rijen per keer; daarom in porties.
async function haalTabel(naam) {
  const rijen = [];
  for (let start = 0; ; start += PAGINA) {
    const { data, error } = await sb
      .from(naam)
      .select('*')
      .range(start, start + PAGINA - 1);
    if (error) throw new Error(`${naam}: ${error.message}`);
    rijen.push(...(data ?? []));
    if (!data || data.length < PAGINA) break;
  }
  return rijen;
}

async function haalAuthGebruikers() {
  const alles = [];
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: PAGINA });
    if (error) throw new Error('auth.users: ' + error.message);
    const users = data?.users ?? [];
    // Alleen de velden die je bij een herstel nodig hebt. Tokens en
    // interne velden slaan we bewust niet op.
    alles.push(...users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      invited_at: u.invited_at ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
      last_sign_in_at: u.last_sign_in_at ?? null,
    })));
    if (users.length < PAGINA) break;
  }
  return alles;
}

async function main() {
  mkdirSync('out', { recursive: true });
  const manifest = { gemaakt_op: new Date().toISOString(), aantallen: {} };
  let fouten = 0;

  for (const tabel of TABELLEN) {
    try {
      const rijen = await haalTabel(tabel);
      writeFileSync(`out/${tabel}.json`, JSON.stringify(rijen, null, 2));
      manifest.aantallen[tabel] = rijen.length;
      console.log(`${tabel.padEnd(20)}: ${rijen.length} rijen`);
    } catch (err) {
      fouten++;
      manifest.aantallen[tabel] = 'MISLUKT';
      console.log(`${tabel.padEnd(20)}: MISLUKT — ${err.message}`);
    }
  }

  try {
    const users = await haalAuthGebruikers();
    writeFileSync('out/auth-users.json', JSON.stringify(users, null, 2));
    manifest.aantallen['auth.users'] = users.length;
    console.log(`${'auth.users'.padEnd(20)}: ${users.length} accounts`);
  } catch (err) {
    fouten++;
    manifest.aantallen['auth.users'] = 'MISLUKT';
    console.log(`${'auth.users'.padEnd(20)}: MISLUKT — ${err.message}`);
  }

  writeFileSync('out/manifest.json', JSON.stringify(manifest, null, 2));

  // Een lege gebruikerslijst betekent bijna altijd dat er iets mis is met de
  // sleutel, niet dat er geen bewoners zijn. Dan liever falen dan een lege
  // backup wegschrijven die er goed uitziet.
  if (!manifest.aantallen.gebruikers) {
    console.log('De tabel gebruikers is leeg of onleesbaar; dit is geen bruikbare backup.');
    process.exit(1);
  }
  if (fouten) process.exit(1);
  console.log('Backup compleet.');
}

main().catch((err) => { console.error(err.message || String(err)); process.exit(1); });
