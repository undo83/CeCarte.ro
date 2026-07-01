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

// feed_id -> merchant + unique_code (din explorarea API-ului)
const FEEDS = [
  { id: 1836, merchant: 'Librex',      domain: 'librex.ro',        unique: '3085d2457' },
  { id: 8521, merchant: 'Bookbite',    domain: 'bookbite.ro',      unique: 'fcad10104' },
  { id: 1374, merchant: 'Nemira',      domain: 'nemira.ro',        unique: '9617003d6' },
  { id: 7046, merchant: 'Corint',      domain: 'edituracorint.ro', unique: '8dad9830f' },
  { id: 9163, merchant: 'Little Nest', domain: 'littlenest.ro',    unique: '026a89a04' }
];

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

export const searchProducts = onCall(
  { secrets: [TP_EMAIL, TP_PASS], cors: true, region: 'europe-west1', maxInstances: 5 },
  async (req) => {
    if (req.auth?.token?.email !== ADMIN_EMAIL) {
      throw new HttpsError('permission-denied', 'Doar adminul poate căuta produse.');
    }
    const query = (req.data?.query || '').toString().trim();
    if (query.length < 2) throw new HttpsError('invalid-argument', 'Caută cel puțin 2 caractere.');

    const auth = await signIn();
    const qn = norm(query);
    const words = qn.split(/\s+/).filter(w => w.length > 1);
    const seen = new Set();
    const results = [];

    for (const f of FEEDS) {
      try {
        // 2P filtrează (fuzzy) cu filter[query], DAR e sensibil la diacritice, iar titlurile din
        // feed sunt stocate fără diacritice ("canta", nu "cântă"). Trimitem interogarea normalizată
        // (fără diacritice) ca să prindem titlul; precizia o dă filtrarea locală de mai jos.
        const url = `${BASE}/affiliate/product_feeds/${f.id}/products.json?filter[query]=${encodeURIComponent(qn)}&perpage=25`;
        const res = await fetch(url, { headers: auth });
        if (!res.ok) continue;
        const j = await res.json();
        for (const p of (j.products || [])) {
          if (!p.url || !p.title) continue;
          const tn = norm(p.title);
          const relevant = tn.includes(qn) || (words.length > 0 && words.every(w => tn.includes(w)));
          if (!relevant || seen.has(p.url)) continue;
          seen.add(p.url);
          results.push({
            merchant: f.merchant,
            title: p.title,
            brand: p.brand || '',
            category: p.category || '',
            price: p.price != null ? Number(p.price) : null,
            oldPrice: p.old_price != null ? Number(p.old_price) : null,
            image: Array.isArray(p.structured_image_urls) ? p.structured_image_urls[0] : null,
            url: p.url,
            affiliateUrl: affiliateUrl(f.unique, p.url),
            active: p.active !== false
          });
        }
      } catch (e) { /* sari peste feed dacă pică */ }
    }

    results.sort((a, b) => (b.active === a.active ? 0 : b.active ? 1 : -1));
    return { query, count: results.length, results: results.slice(0, 24) };
  }
);

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

    const feedDomains = new Set(FEEDS.map(f => f.domain));
    const partners = progs.map(p => {
      const domain = toDomain(p.base_url || p.url || p.site_url || p.name);
      return {
        name: p.name || domain || '(necunoscut)',
        domain,
        status: p.status || p.relation || 'accepted',
        feeds: p.product_feeds_count ?? null,
        tracked: domain ? feedDomains.has(domain) : false
      };
    });
    partners.sort((a, b) => (Number(b.tracked) - Number(a.tracked)) || a.name.localeCompare(b.name));
    return { count: partners.length, partners };
  }
);
