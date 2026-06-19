// Banner de consimțământ cookie-uri (GDPR). Memorează alegerea în localStorage.
// Expune window.cecarteConsent = 'accepted' | 'rejected' pentru a porni mai târziu
// pixeli de tracking (TikTok Pixel, Google Analytics) DOAR după acceptare.
(function () {
  const KEY = 'cecarte_cookie_consent';
  const saved = localStorage.getItem(KEY);
  window.cecarteConsent = saved || null;

  // dispatch pentru module care vor să reacționeze la consimțământ
  function emit() { window.dispatchEvent(new CustomEvent('cookie-consent', { detail: window.cecarteConsent })); }

  if (saved) { emit(); return; } // alegere deja făcută

  const bar = document.createElement('div');
  bar.id = 'cookie-bar';
  bar.innerHTML = `
    <style>
      #cookie-bar{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#2b2218;color:#f7efe6;
        padding:14px 18px;display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap;
        font:14px/1.5 'Segoe UI',system-ui,sans-serif;box-shadow:0 -4px 20px rgba(0,0,0,.2)}
      #cookie-bar p{margin:0;max-width:620px}
      #cookie-bar a{color:#e0a458}
      #cookie-bar .btns{display:flex;gap:8px}
      #cookie-bar button{border:none;border-radius:9px;padding:10px 16px;font:600 14px 'Segoe UI',sans-serif;cursor:pointer}
      #cookie-bar .acc{background:#b5512f;color:#fff}
      #cookie-bar .rej{background:transparent;color:#f7efe6;border:1px solid rgba(255,255,255,.3)}
    </style>
    <p>Folosim cookie-uri pentru funcționarea site-ului și, cu acordul tău, pentru statistici și marketing.
       Detalii în <a href="/politica-cookies">Politica de cookies</a>.</p>
    <div class="btns">
      <button class="rej" id="ck-rej">Refuz</button>
      <button class="acc" id="ck-acc">Accept</button>
    </div>`;
  document.body.appendChild(bar);

  function choose(v) { localStorage.setItem(KEY, v); window.cecarteConsent = v; bar.remove(); emit(); }
  document.getElementById('ck-acc').onclick = () => choose('accepted');
  document.getElementById('ck-rej').onclick = () => choose('rejected');
})();
