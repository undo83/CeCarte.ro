// Inițializare Firebase „lazy": încarcă SDK-ul din CDN doar dacă există config.
// Centralizat aici ca să adăugăm ușor module noi (auth, storage, functions) mai târziu.
import { firebaseConfig, isConfigured } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.0';
let _app = null, _db = null;

export { isConfigured };

export async function getApp() {
  if (!isConfigured) return null;
  if (_app) return _app;
  const { initializeApp } = await import(`${SDK}/firebase-app.js`);
  _app = initializeApp(firebaseConfig);
  return _app;
}

export async function getDb() {
  if (!isConfigured) return null;
  if (_db) return _db;
  const app = await getApp();
  const { getFirestore } = await import(`${SDK}/firebase-firestore.js`);
  _db = getFirestore(app);
  return _db;
}

// Helper reutilizabil pentru module: importă funcțiile Firestore de care ai nevoie
export async function firestore() {
  return import(`${SDK}/firebase-firestore.js`);
}

let _auth = null;
export async function getAuth() {
  if (!isConfigured) return null;
  if (_auth) return _auth;
  const app = await getApp();
  const { getAuth: _init } = await import(`${SDK}/firebase-auth.js`);
  _auth = _init(app);
  return _auth;
}

// Helper reutilizabil: importă funcțiile de auth (signInWithPopup, GoogleAuthProvider, etc.)
export async function authMod() {
  return import(`${SDK}/firebase-auth.js`);
}
