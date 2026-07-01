// Wrapper de afiliere 2Performant.
// Transformă un URL de produs într-un quicklink trackuit — DOAR pentru merchanții aprobați,
// unde avem codul `unique` al quicklink-ului (generat din „Get Link" în 2Performant).
// Pentru restul, lasă link direct (funcțional, dar fără comision).
//
// `aff_code` e PUBLIC. `unique` = ID-ul quicklink-ului per merchant (NU e secret).

export const AFF_CODE = '921ba67fe';

// domeniu merchant -> codul `unique_code` al programului (din API-ul 2P /affiliate/programs).
// Ține în sync cu TRACKED_DOMAINS din functions/index.js.
export const MERCHANT_QUICKLINK = {
  'librex.ro': '3085d2457',
  'nemira.ro': '9617003d6',
  'bookbite.ro': 'fcad10104',
  'edituracorint.ro': '8dad9830f',
  'littlenest.ro': '026a89a04',
  'bookzone.ro': '50e9adcf3',
  'elefant.ro': '184f69294',
  'litera.ro': '0a8a2c4d9',
  'targulcartii.ro': '0b3cc915f'
};

export function affiliateLink(url) {
  if (!url || url === '#') return url || '#';
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const key = Object.keys(MERCHANT_QUICKLINK).find(d => host === d || host.endsWith('.' + d));
    if (key) {
      return `https://event.2performant.com/events/click?ad_type=quicklink&aff_code=${AFF_CODE}&unique=${MERCHANT_QUICKLINK[key]}&redirect_to=${encodeURIComponent(url)}`;
    }
  } catch (e) { /* URL invalid → link direct */ }
  return url;
}
