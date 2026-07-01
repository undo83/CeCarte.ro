// Modul „cărți": încearcă Firestore (colecția `books`), altfel cade pe datele statice.
// Ca să adaugi o carte: fie un document în Firestore, fie un obiect în STATIC_BOOKS.
import { getDb, firestore } from './firebase-init.js';

export const STATIC_BOOKS = [
  {
    title: "Titlul cărții #1",
    author: "Autor necunoscut",
    genre: "Ficțiune",
    emoji: "📖",
    rating: 5,
    blurb: "Cartea care te ține treaz până la 3 dimineața.",
    merchants: [
      { name: "Cărturești", url: "#", primary: true },
      { name: "Libris", url: "#" },
      { name: "Elefant", url: "#" }
    ]
  },
  {
    title: "Titlul cărții #2",
    author: "Autor necunoscut",
    genre: "Dezvoltare personală",
    emoji: "📕",
    rating: 4,
    blurb: "Obiceiuri mici, schimbări mari.",
    merchants: [
      { name: "Cărturești", url: "#", primary: true },
      { name: "Libris", url: "#" }
    ]
  },
  {
    title: "Titlul cărții #3",
    author: "Autor necunoscut",
    genre: "Thriller",
    emoji: "📗",
    rating: 5,
    blurb: "Un final pe care nu-l vezi venind.",
    merchants: [
      { name: "Cărturești", url: "#", primary: true },
      { name: "Elefant", url: "#" }
    ]
  }
];

// Slug pentru paginile dedicate (ex. /privighetoarea). Normalizează diacriticele românești.
export function slugify(s) {
  return (s || '').toString().toLowerCase()
    .replace(/[șş]/g, 's').replace(/[țţ]/g, 't')
    .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
}

// Găsește cartea după slug: câmpul explicit `slug` dacă există, altfel slug derivat din titlu.
export function findBookBySlug(books, slug) {
  const s = slugify(slug);
  if (!s) return null;
  return (books || []).find(b => slugify(b.slug || b.title) === s) || null;
}

// Cache local pentru afișare instantă (stale-while-revalidate).
const BOOKS_CACHE_KEY = 'cecarte_books_v1';

export function getCachedBooks() {
  try {
    const raw = localStorage.getItem(BOOKS_CACHE_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) && arr.length ? arr : null;
  } catch { return null; }
}

function cacheBooks(books) {
  try { localStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify(books)); } catch {}
}

export async function loadBooks() {
  const db = await getDb();
  if (!db) return getCachedBooks() || STATIC_BOOKS;
  try {
    const { collection, getDocs, query, orderBy } = await firestore();
    const snap = await getDocs(query(collection(db, 'books'), orderBy('order')));
    const books = snap.docs.map(d => {
      const data = d.data();
      const ts = data.createdAt;
      // Normalizează la milisecunde (Timestamp Firestore nu supraviețuiește JSON-ului din cache)
      const createdAt = ts && typeof ts.toMillis === 'function' ? ts.toMillis()
        : (typeof ts === 'number' ? ts : null);
      return { ...data, createdAt };
    });
    if (books.length) { cacheBooks(books); return books; }
    return STATIC_BOOKS;
  } catch (e) {
    console.warn('Firestore indisponibil, folosesc cache/date statice:', e);
    return getCachedBooks() || STATIC_BOOKS;
  }
}

export async function saveLead(email) {
  const db = await getDb();
  if (!db) { console.info('Lead (fără Firebase):', email); return false; }
  try {
    const { collection, addDoc, serverTimestamp } = await firestore();
    await addDoc(collection(db, 'leads'), { email, createdAt: serverTimestamp(), source: 'landing' });
    return true;
  } catch (e) {
    console.warn('Nu am putut salva lead-ul:', e);
    return false;
  }
}
