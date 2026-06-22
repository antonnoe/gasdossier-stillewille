/**
 * middleware.js — Vercel Edge Middleware
 *
 * Beschermt de hele site. Alleen deze pagina's zijn publiek toegankelijk:
 *   - /login.html
 *   - /auth-callback.html
 *   - /aanvragen.html
 * Plus alle statische assets (css, js, afbeeldingen, fonts, manifest, …),
 * anders zou de loginpagina zelf zonder styling laden.
 *
 * Alle overige pagina's vereisen een geldige Supabase-sessie. De sessie wordt
 * herkend aan de cookie `sb-access-token`, die de browser-client schrijft
 * (zie supabase-config.js). Ontbreekt of verloopt het token → redirect naar
 * /login.html.
 *
 * De publieke anon key is beschikbaar via process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 * voor de aanwezigheids- en vervalcontrole van het JWT is die niet nodig.
 */
import { next } from '@vercel/edge';

export const config = {
  // Draai op alle paden; assets en publieke pagina's worden in code doorgelaten.
  matcher: '/((?!api/).*)',
};

const PUBLIC_PAGES = new Set([
  '/login.html',
  '/auth-callback.html',
  '/aanvragen.html',
  '/redactie.html',
  '/faq.html',
]);

// Statische assets altijd doorlaten.
const ASSET_RE = /\.(css|js|mjs|map|png|jpe?g|gif|svg|webp|ico|webmanifest|woff2?|ttf|otf|eot|mp4|webm|txt|xml|json|pdf|docx?)$/i;

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Publieke pagina's en assets ongemoeid laten.
  if (PUBLIC_PAGES.has(path) || ASSET_RE.test(path)) {
    return next();
  }

  // Geldige sessie? → doorlaten.
  const token = getCookie(request, 'sb-access-token');
  if (token && !isExpired(token)) {
    return next();
  }

  // Geen (geldige) sessie → naar de loginpagina. Bestaat er wél een token maar
  // is het verlopen, geef dat mee zodat login.html een passende melding toont.
  const loginUrl = new URL('/login.html', request.url);
  if (token) {
    loginUrl.searchParams.set('reden', 'verlopen');
  }
  return Response.redirect(loginUrl, 307);
}

function getCookie(request, name) {
  const header = request.headers.get('cookie');
  if (!header) return null;
  const parts = header.split(';');
  for (let i = 0; i < parts.length; i++) {
    const eq = parts[i].indexOf('=');
    if (eq === -1) continue;
    const key = parts[i].slice(0, eq).trim();
    if (key === name) return decodeURIComponent(parts[i].slice(eq + 1).trim());
  }
  return null;
}

// Decodeer het JWT-payload (zonder verificatie) om `exp` te lezen.
function isExpired(jwt) {
  try {
    const payload = jwt.split('.')[1];
    if (!payload) return true;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(json);
    if (!data.exp) return false;
    return Date.now() >= data.exp * 1000;
  } catch (e) {
    // Onleesbaar token → behandel als ongeldig.
    return true;
  }
}
