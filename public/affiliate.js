/*!
 * SiteViral Affiliate Cloud — browser SDK (v1)
 *
 * Drop this on ANY website (SiteViral or not) to capture ambassador referrals:
 *   <script src="https://siteviral.com/affiliate.js" data-program="my-program" defer></script>
 *
 * What it does:
 *   1. Reads ?ref=CODE (or ?aff=CODE) from the URL
 *   2. Stores it for 7 days (cookie + localStorage, last click wins)
 *   3. Pings the SiteViral click endpoint (no API key needed, origin allow-listed)
 *   4. Exposes window.SiteViralAffiliate.getCode() so your checkout can send
 *      the code to your own backend, which then calls POST /v1/conversions
 *      with your secret API key.
 *
 * Never put your sv_live_ API key in the browser.
 */
(function () {
  var ENDPOINT = 'https://api.siteviral.com/functions/v1/affiliate-api/v1/click';
  var COOKIE = 'sv_aff';
  var STORAGE = 'sv_affiliate_ref';
  var DAYS = 7;

  var script = document.currentScript ||
    (function () {
      var all = document.getElementsByTagName('script');
      return all[all.length - 1];
    })();
  var program = (script && script.getAttribute('data-program')) || '';

  function setCookie(value) {
    var expires = new Date(Date.now() + DAYS * 864e5).toUTCString();
    document.cookie = COOKIE + '=' + encodeURIComponent(value) +
      ';expires=' + expires + ';path=/;SameSite=Lax';
  }

  function readCookie() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function store(code) {
    setCookie(code);
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ code: code, ts: Date.now(), program: program }));
    } catch (e) { /* private mode */ }
  }

  function getCode() {
    var c = readCookie();
    if (c) return c;
    try {
      var raw = localStorage.getItem(STORAGE);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Date.now() - parsed.ts < DAYS * 864e5) return parsed.code;
        localStorage.removeItem(STORAGE);
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function trackClick(code) {
    if (!program || !code) return;
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: program, code: code }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) { /* ignore */ }
  }

  var params = new URLSearchParams(window.location.search);
  var incoming = params.get('ref') || params.get('aff');
  if (incoming) {
    store(incoming);       // last click wins
    trackClick(incoming);
  }

  window.SiteViralAffiliate = {
    program: program,
    getCode: getCode,
    /** Manually attribute a code (e.g. from your own landing logic). */
    setCode: function (code) { if (code) { store(code); trackClick(code); } },
    /** Append the stored code to any outbound URL. */
    decorate: function (url) {
      var code = getCode();
      if (!code) return url;
      return url + (url.indexOf('?') === -1 ? '?' : '&') + 'ref=' + encodeURIComponent(code);
    },
    clear: function () {
      document.cookie = COOKIE + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
      try { localStorage.removeItem(STORAGE); } catch (e) {}
    },
  };
})();
