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

export async function loadBooks() {
  const db = await getDb();
  if (!db) return STATIC_BOOKS;
  try {
    const { collection, getDocs, query, orderBy } = await firestore();
    const snap = await getDocs(query(collection(db, 'books'), orderBy('order')));
    const books = snap.docs.map(d => d.data());
    return books.length ? books : STATIC_BOOKS;
  } catch (e) {
    console.warn('Firestore indisponibil, folosesc datele statice:', e);
    return STATIC_BOOKS;
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
