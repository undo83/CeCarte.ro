// TikTok Pixel — încărcat DOAR după consimțământ de marketing (GDPR).
// Se bazează pe window.cecarteConsent / evenimentul 'cookie-consent' din cookie-consent.js.
// Înlocuiește PIXEL_ID cu ID-ul tău din TikTok Ads Manager → Tools → Events → Web Events.
(function () {
  var PIXEL_ID = 'D8V6L4RC77U79CKEIJ90';
  var loaded = false;

  function loadPixel() {
    if (loaded) return;
    loaded = true;

    !function (w, d, t) {
      w.TiktokAnalyticsObject = t;
      var ttq = w[t] = w[t] || [];
      ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
      ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e };
      ttq.load = function (e, n) {
        var r = "https://analytics.tiktok.com/i18n/pixel/events.js", o = n && n.partner;
        ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r;
        ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
        ttq._o = ttq._o || {}; ttq._o[e] = n || {};
        n = document.createElement("script"); n.type = "text/javascript"; n.async = !0; n.src = r + "?sdkid=" + e + "&lib=" + t;
        e = document.getElementsByTagName("script")[0]; e.parentNode.insertBefore(n, e);
      };
      ttq.load(PIXEL_ID);
      ttq.page();
    }(window, document, 'ttq');
  }

  // Dacă utilizatorul a acceptat deja (din vizite anterioare), pornim acum.
  if (window.cecarteConsent === 'accepted') {
    loadPixel();
  } else {
    // Altfel, așteptăm decizia din banner.
    window.addEventListener('cookie-consent', function (e) {
      if (e.detail === 'accepted') loadPixel();
    });
  }
})();
