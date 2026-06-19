# CeCarte.ro — Afiliere Cărți prin Video (2Performant)

> Proiect SEPARAT de orice altă idee din folderul `BusinessAI`.
> Model: recenzii video de cărți → reclame TikTok → landing CeCarte → linkuri afiliere 2Performant.
> Stack: **Firebase** (Hosting + Firestore), arhitectură modulară.
> Actualizat: 2026-06-19

---

## 1. Decizii blocate

| Element | Decizie |
|---|---|
| Brand / domeniu | **CeCarte.ro** |
| Nișă | Cărți & lectură (BookTok) |
| Canal principal | TikTok Ads (video scurt) + landing propriu |
| Monetizare | Afiliere 2Performant (mai mulți merchanți) |
| Strategie geo | Drum A: RO acum, nume internațional-ready, extindere globală mai târziu |
| Arhitectură | 1 domeniu, mulți merchanți (fără dependență de unul) |
| Tech stack | Firebase Hosting + Firestore (extensibil cu module) |
| Regulă de aur | FĂRĂ brand bidding, FĂRĂ direct linking |

## 2. Structura proiectului

```
cecarte/
├── firebase.json            # config Hosting + Firestore
├── .firebaserc              # ID proiect (placeholder: cecarte-ro)
├── firestore.rules          # reguli securitate (books public, restul admin)
├── firestore.indexes.json
├── README.md
└── public/                  # ← Firebase Hosting servește acest folder
    ├── index.html           # landing mobile-first (destinația reclamelor)
    ├── admin/
    │   └── oferte.html      # instrument intern comparare oferte (înlocuiește Excel)
    └── js/
        ├── firebase-config.js  # CONFIG (completezi din consolă)
        ├── firebase-init.js    # init lazy Firebase (reutilizabil)
        └── books.js            # cărți (Firestore + fallback static) + salvare lead-uri
```

> **Modular by design:** cărțile vin din colecția Firestore `books` (cu fallback static dacă Firebase nu e configurat încă). Lead-urile din newsletter se scriu în `leads`. Adaugi module noi (auth, storage, functions) reutilizând `firebase-init.js`.

## 3. Setup Firebase (de făcut o singură dată)

1. Creează proiect: https://console.firebase.google.com → „Add project" → numește-l `cecarte-ro` (sau alt id; actualizează `.firebaserc`).
2. Activează **Firestore Database** (mod production) și **Hosting**.
3. Project settings → „Your apps" → Web (`</>`) → copiază configul în `public/js/firebase-config.js` (înlocuiește valorile `TODO`).
4. Login + deploy din folderul `cecarte/`:
   ```bash
   firebase login
   firebase use cecarte-ro
   firebase deploy
   ```
5. Conectează domeniul `cecarte.ro`: Hosting → „Add custom domain".

> Până completezi configul, site-ul rulează pe **date statice** (fallback) — poți dezvolta local fără proiect Firebase.

### Test local
```bash
cd cecarte
firebase emulators:start        # sau: npx serve public
```

## 4. Merchanți de cărți pe 2Performant (de completat)

Promovăm MAI MULȚI ca să nu depindem de unul. Compară-i în `public/admin/oferte.html`:
- [ ] Cărturești — prima ofertă (EPC 14.63€, conv 5.39%, 9% + 1 leu/lead, cookie 31z)
- [ ] Libris
- [ ] Elefant
- [ ] (alții din categoria Books)

## 5. Funnel

```
Video TikTok → Reclamă → Landing CeCarte → Buton afiliat → Merchant → Comision
                              │
                         Captură email (Firestore `leads`) → promovări repetate
```

## 6. Producția video (bottleneck real)

- Faceless / AI: voiceover + vizual copertă + animație text (20-40s).
- Hook puternic în primele 2 secunde.
- CTA final: „Link în bio/descriere" → cecarte.ro.
- Claude scrie scripturile (hook + corp + CTA) per carte.

## 7. Conformitate

- Disclosure afiliere pe landing (inclus) + în descrierea TikTok.
- Politică de confidențialitate + cookie consent (de adăugat).
- Respectă termenii fiecărui program 2P înainte de reclame.

## 8. Următorii pași

- [ ] Cumpără domeniul `cecarte.ro`
- [ ] Creează proiectul Firebase + completează configul + primul `firebase deploy`
- [ ] Completează profilul 2P cu `cecarte.ro` ca traffic source
- [ ] Adaugă 3-5 merchanți în `oferte.html`, alege top 2
- [ ] Înscrie-te în programele alese (Join Program)
- [ ] Primele 3 scripturi video (de la Claude) + prima campanie TikTok
