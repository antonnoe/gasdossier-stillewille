// supabase/scripts/controleer-pkce.mjs
//
// Bewijst op de echte site dat de inlogpagina op PKCE draait.
//
// Hoe: open /login.html in een verse browser, vul een adres in, klik op
// "Stuur toegangslink" en vang het verzoek af dat de pagina naar Supabase
// stuurt. Staat daar een code_challenge in, dan legt de browser een geheim
// vast op dit apparaat en is de link in de mail waardeloos voor iemand
// anders. Staat die er niet in, dan draait de pagina nog op de oude flow en
// zit het toegangstoken gewoon in de link.
//
// Let op: dit verstuurt een echte mail naar het opgegeven adres. Gebruik een
// adres van jezelf.
//
// Gebruik: node supabase/scripts/controleer-pkce.mjs <site-url> <e-mailadres>

import { chromium } from 'playwright';

const SITE = process.argv[2];
const ADRES = process.argv[3];

if (!SITE || !ADRES) {
  console.error('Gebruik: node controleer-pkce.mjs <site-url> <e-mailadres>');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();

let otpVerzoek = null;
page.on('request', (req) => {
  if (req.method() === 'POST' && req.url().includes('/auth/v1/otp')) {
    otpVerzoek = req.postData() || '';
  }
});

await page.goto(SITE + '/login.html', { waitUntil: 'domcontentloaded' });
await page.fill('#email', ADRES);
await page.click('#submit-btn');

// Even ruimte geven voor het netwerkverzoek en het antwoord.
await page.waitForTimeout(5000);

const melding = (await page.textContent('#msg').catch(() => '')) || '';
// Het adres niet loggen; alleen of de pagina iets meldde.
console.log('melding op de pagina:', melding.replace(ADRES, '<adres>') || '(geen)');

await browser.close();

if (!otpVerzoek) {
  console.log('Er ging geen verzoek naar /auth/v1/otp. De pagina deed niets.');
  process.exit(1);
}

let body;
try { body = JSON.parse(otpVerzoek); } catch { body = {}; }

const heeftChallenge = Boolean(body.code_challenge);
const methode = body.code_challenge_method || '(geen)';

console.log('code_challenge aanwezig:', heeftChallenge);
console.log('code_challenge_method :', methode);
console.log('create_user           :', body.create_user);

if (!heeftChallenge) {
  console.log('PKCE staat NIET aan: de link in de mail bevat het token zelf en werkt overal.');
  process.exit(1);
}
if (body.create_user !== false) {
  console.log('create_user staat niet op false; de pagina zou nieuwe accounts kunnen aanmaken.');
  process.exit(1);
}
console.log('PKCE staat aan. Een doorgestuurde link werkt niet in een andere browser.');
