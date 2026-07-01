// Google Analytics 4 — încărcat DOAR după consimțământ (cookie-uri de statistică, GDPR).
// Se bazează pe window.cecarteConsent / evenimentul 'cookie-consent' din cookie-consent.js.
// ID-ul (measurementId) e public; vine din același cont Firebase (G-GW7K9HC8JF).
(function () {
  var GA_ID = 'G-GW7K9HC8JF';
  var loaded = false;

  function loadGA() {
    if (loaded) return;
    loaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  // Dacă utilizatorul a acceptat deja (din vizite anterioare), pornim acum.
  if (window.cecarteConsent === 'accepted') {
    loadGA();
  } else {
    // Altfel, așteptăm decizia din banner.
    window.addEventListener('cookie-consent', function (e) {
      if (e.detail === 'accepted') loadGA();
    });
  }
})();
