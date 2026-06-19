// === CONFIG FIREBASE ===
// Config-ul web Firebase NU e secret (e public prin design, vizibil în orice site Firebase).
// Securitatea vine din Firestore Security Rules + domeniile autorizate, nu din ascunderea acestor valori.
export const firebaseConfig = {
  apiKey: "AIzaSyDhYz2N6e1wCxiKXq9_RbGjH_DuFtRJchA",
  authDomain: "cecarte-ro.firebaseapp.com",
  projectId: "cecarte-ro",
  storageBucket: "cecarte-ro.firebasestorage.app",
  messagingSenderId: "955118196635",
  appId: "1:955118196635:web:4172616ea4f9e192b8f33e",
  measurementId: "G-GW7K9HC8JF"
};

export const isConfigured = !String(firebaseConfig.apiKey).includes("TODO");
