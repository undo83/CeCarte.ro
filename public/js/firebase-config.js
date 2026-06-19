// === CONFIG FIREBASE ===
// Completează din Firebase Console -> Project settings -> "Your apps" -> Web app (</>)
// Cât timp valorile conțin "TODO", site-ul funcționează pe date statice (fallback),
// deci poți dezvolta fără un proiect Firebase real. Când completezi -> devine live.
export const firebaseConfig = {
  apiKey: "TODO",
  authDomain: "cecarte-ro.firebaseapp.com",
  projectId: "cecarte-ro",
  storageBucket: "cecarte-ro.appspot.com",
  messagingSenderId: "TODO",
  appId: "TODO"
};

export const isConfigured = !String(firebaseConfig.apiKey).includes("TODO");
