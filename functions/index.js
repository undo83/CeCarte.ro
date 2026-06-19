// Cloud Functions CeCarte — integrare 2Performant (server-side, cheia rămâne secretă).
// `searchProducts`: caută produse în feed-urile merchanților aprobați → pentru auto-fill în admin.
//
// Secretele (email/parolă/cheie 2P) se setează cu:
//   firebase functions:secrets:set TP_EMAIL
//   firebase functions:secrets:set TP_PASS
//   firebase functions:secrets:set TP_KEY

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const TP_EMAIL = defineSecret('TP_EMAIL');
const TP_PASS = defineSecret('TP_PASS');
const TP_KEY = defineSecret('TP_KEY');

const BASE = 'https://api.2performant.com';
const UA = 'CeCarte/1.0 (+https://cecarte.ro)';
const ADMIN_EMAIL = 'alex@rsjoomla.com';

// Header-ul exact pentru cheia API se confirmă din explorare; placeholder deocamdată.
const KEY_HEADER = null; // ex: 'perpetual-token'

async function signIn() {
  const headers = { 'Content-Type': 'application/json', 'User-Agent': UA };
  if (KEY_HEADER) headers[KEY_HEADER] = TP_KEY.value();
  const res = await fetch(`${BASE}/users/sign_in.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user: { email: TP_EMAIL.value(), password: TP_PASS.value() } })
  });
  const at = res.headers.get('access-token');
  if (!at) throw new HttpsError('unauthenticated', `2P sign-in eșuat (status ${res.status})`);
  return { 'access-token': at, client: res.headers.get('client'), uid: res.headers.get('uid'), 'User-Agent': UA };
}

async function apiGet(path, auth) {
  const res = await fetch(`${BASE}${path}`, { headers: auth });
  if (!res.ok) throw new HttpsError('internal', `2P GET ${path} → ${res.status}`);
  return res.json();
}

// === Căutare produse (se FINALIZEAZĂ după explorarea API-ului) ===
export const searchProducts = onCall(
  { secrets: [TP_EMAIL, TP_PASS, TP_KEY], cors: true, region: 'europe-west1', maxInstances: 5 },
  async (req) => {
    if (req.auth?.token?.email !== ADMIN_EMAIL) {
      throw new HttpsError('permission-denied', 'Doar adminul poate căuta produse.');
    }
    const query = (req.data?.query || '').toString().trim();
    if (!query) throw new HttpsError('invalid-argument', 'Lipsește textul de căutare.');

    const auth = await signIn();
    // TODO (după explorare): descoperă feed-urile aprobate + caută `query` în produse
    //   → returnează [{ merchant, title, price, image, url }]
    return { query, results: [], note: 'scaffold — se finalizează după explorarea API-ului' };
  }
);
