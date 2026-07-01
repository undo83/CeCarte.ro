// Cloud Functions CeCarte — integrare 2Performant (server-side; credențialele rămân secrete).
// `searchProducts`: caută o carte în feed-urile merchanților aprobați → pentru auto-fill în admin.
//
// Secrete (se setează o singură dată):
//   firebase functions:secrets:set TP_EMAIL
//   firebase functions:secrets:set TP_PASS

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const TP_EMAIL = defineSecret('TP_EMAIL');
const TP_PASS = defineSecret('TP_PASS');

const BASE = 'https://api.2performant.com';
const UA = 'CeCarte/1.0 (+https://cecarte.ro)';
const ADMIN_EMAIL = 'alex@rsjoomla.com';
const AFF_CODE = '921ba67fe';

// Domenii pe care site-ul le poate transforma în link de afiliere
// (trebuie ținute în sync cu MERCHANT_QUICKLINK din public/js/affiliate.js).
const TRACKED_DOMAINS = new Set([
  'librex.ro', 'nemira.ro', 'bookbite.ro', 'edituracorint.ro', 'littlenest.ro',
  'bookzone.ro', 'elefant.ro', 'litera.ro', 'targulcartii.ro'
]);

async function signIn() {
  const res = await fetch(`${BASE}/users/sign_in.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ user: { email: TP_EMAIL.value().trim(), password: TP_PASS.value().trim() } })
  });
  const at = res.headers.get('access-token');
  if (!at) throw new HttpsError('unauthenticated', `2P sign-in eșuat (status ${res.status})`);
  return { 'access-token': at, client: res.headers.get('client'), uid: res.headers.get('uid'), 'User-Agent': UA };
}

function affiliateUrl(unique, url) {
  return `https://event.2performant.com/events/click?ad_type=quicklink&aff_code=${AFF_CODE}&unique=${unique}&redirect_to=${encodeURIComponent(url)}`;
}

const norm = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

// Extrage domeniul (fără www) dintr-un URL sau dintr-un nume care arată deja ca un domeniu.
function toDomain(raw) {
  const s = (raw || '').toString().trim();
  if (!s) return '';
  try {
    return new URL(s.startsWith('http') ? s : 'https://' + s).hostname.replace(/^www\./, '');
  } catch {
    return /\.[a-z]{2,}$/i.test(s) ? s.replace(/^www\./, '') : '';
  }
}

// Hartă domeniu -> { unique, name }, construită live din programele acceptate (unique_code din API).
async function getProgramsByDomain(auth) {
  const res = await fetch(`${BASE}/affiliate/programs.json?filter[relation]=accepted&perpage=100`, { headers: auth });
  if (!res.ok) return {};
  const j = await res.json();
  const map = {};
  for (const p of (j.programs || j.data || [])) {
    const domain = toDomain(p.base_url || p.main_url || p.name);
    if (domain && p.unique_code) map[domain] = { unique: p.unique_code, name: (p.name || domain).trim() };
  }
  return map;
}

// ID-urile tuturor feed-urilor de produs disponibile în cont.
async function getAllFeedIds(auth) {
  const res = await fetch(`${BASE}/affiliate/product_feeds.json?perpage=100`, { headers: auth });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.product_feeds || j.productFeeds || j.data || []).map(f => f.id).filter(Boolean);
}

export const searchProducts = onCall(
  { secrets: [TP_EMAIL, TP_PASS], cors: true, region: 'europe-west1', maxInstances: 5, timeoutSeconds: 60 },
  async (req) => {
    if (req.auth?.token?.email !== ADMIN_EMAIL) {
      throw new HttpsError('permission-denied', 'Doar adminul poate căuta produse.');
    }
    const query = (req.data?.query || '').toString().trim();
    if (query.length < 2) throw new HttpsError('invalid-argument', 'Caută cel puțin 2 caractere.');

    const auth = await signIn();
    const qn = norm(query);
    const words = qn.split(/\s+/).filter(w => w.length > 1);

    // Descoperă automat programele (pentru unique_code) și toate feed-urile de produs.
    const [byDomain, feedIds] = await Promise.all([getProgramsByDomain(auth), getAllFeedIds(auth)]);

    // 2P filtrează (fuzzy) cu filter[query], DAR e sensibil la diacritice, iar titlurile din feed
    // sunt fără diacritice — trimitem interogarea normalizată; precizia o dă filtrarea locală.
    const perFeed = await Promise.all(feedIds.map(async (id) => {
      try {
        const url = `${BASE}/affiliate/product_feeds/${id}/products.json?filter[query]=${encodeURIComponent(qn)}&perpage=20`;
        const res = await fetch(url, { headers: auth });
        if (!res.ok) return [];
        const j = await res.json();
        return j.products || [];
      } catch { return []; }
    }));

    const seen = new Set();
    const results = [];
    for (const products of perFeed) {
      for (const p of products) {
        if (!p.url || !p.title || seen.has(p.url)) continue;
        const tn = norm(p.title);
        const relevant = tn.includes(qn) || (words.length > 0 && words.every(w => tn.includes(w)));
        if (!relevant) continue;
        seen.add(p.url);
        let host = '';
        try { host = new URL(p.url).hostname; } catch {}
        const domain = toDomain(host);
        const prog = byDomain[domain];
        results.push({
          merchant: prog?.name || domain || '(necunoscut)',
          domain,
          title: p.title,
          brand: p.brand || '',
          category: p.category || '',
          price: p.price != null ? Number(p.price) : null,
          oldPrice: p.old_price != null ? Number(p.old_price) : null,
          image: Array.isArray(p.structured_image_urls) ? p.structured_image_urls[0] : null,
          url: p.url,
          affiliateUrl: prog ? affiliateUrl(prog.unique, p.url) : p.url,
          tracked: TRACKED_DOMAINS.has(domain),
          active: p.active !== false
        });
      }
    }
    // Trackuiți (cu comision) întâi, apoi activi.
    results.sort((a, b) => (Number(b.tracked) - Number(a.tracked)) || (Number(b.active) - Number(a.active)));
    return { query, count: results.length, results: results.slice(0, 30) };
  }
);

// listPartners: întoarce programele 2P acceptate (partenerii afiliați) + dacă sunt deja trackuiți.
export const listPartners = onCall(
  { secrets: [TP_EMAIL, TP_PASS], cors: true, region: 'europe-west1', maxInstances: 5 },
  async (req) => {
    if (req.auth?.token?.email !== ADMIN_EMAIL) {
      throw new HttpsError('permission-denied', 'Doar adminul poate vedea partenerii.');
    }
    const auth = await signIn();
    const res = await fetch(`${BASE}/affiliate/programs.json?filter[relation]=accepted&perpage=100`, { headers: auth });
    if (!res.ok) throw new HttpsError('unavailable', `2P programs eșuat (status ${res.status})`);
    const j = await res.json();
    const progs = j.programs || j.data || [];

    const partners = progs.map(p => {
      const domain = toDomain(p.base_url || p.main_url || p.name);
      return {
        name: (p.name || domain || '(necunoscut)').trim(),
        domain,
        status: p.status || p.relation || 'accepted',
        feeds: p.product_feeds_count ?? null,
        tracked: domain ? TRACKED_DOMAINS.has(domain) : false
      };
    });
    partners.sort((a, b) => (Number(b.tracked) - Number(a.tracked)) || a.name.localeCompare(b.name));
    return { count: partners.length, partners };
  }
);
