/**
 * SiteViral Embed Widget v1.0
 * Usage:
 *   <div data-siteviral-product="PRODUCT_ID"
 *        data-siteviral-text="Acheter maintenant"
 *        data-siteviral-color="#d4920a"
 *        data-siteviral-ref="AFFILIATE_CODE">
 *   </div>
 *   <script src="https://siteviral.com/embed.js" defer></script>
 */
(function() {
  'use strict';

  var BASE = 'https://siteviral.com';

  // Detect if running on preview/dev
  var scripts = document.querySelectorAll('script[src*="embed.js"]');
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].getAttribute('src') || '';
    if (src.indexOf('localhost') !== -1 || src.indexOf('lovable.app') !== -1) {
      var m = src.match(/^(https?:\/\/[^\/]+)/);
      if (m) BASE = m[1];
    }
  }

  var IFRAME_ID_PREFIX = 'siteviral-checkout-';
  var overlay = null;

  function createButton(el) {
    var productId = el.getAttribute('data-siteviral-product');
    if (!productId) return;

    var text = el.getAttribute('data-siteviral-text') || 'Acheter maintenant';
    var color = el.getAttribute('data-siteviral-color') || '#d4920a';
    var ref = el.getAttribute('data-siteviral-ref') || '';
    var size = el.getAttribute('data-siteviral-size') || 'medium';

    var btn = document.createElement('button');
    btn.textContent = text;
    btn.setAttribute('type', 'button');

    var padding = size === 'small' ? '8px 16px' : size === 'large' ? '16px 32px' : '12px 24px';
    var fontSize = size === 'small' ? '13px' : size === 'large' ? '16px' : '14px';

    btn.style.cssText = 'display:inline-flex;align-items:center;gap:8px;padding:' + padding +
      ';background:' + color + ';color:#fff;font-weight:700;font-size:' + fontSize +
      ';border-radius:8px;border:none;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'transition:opacity 0.2s,transform 0.1s;box-shadow:0 2px 8px rgba(0,0,0,0.15);';

    btn.addEventListener('mouseenter', function() { btn.style.opacity = '0.9'; btn.style.transform = 'scale(1.02)'; });
    btn.addEventListener('mouseleave', function() { btn.style.opacity = '1'; btn.style.transform = 'scale(1)'; });

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      openCheckout(productId, color, ref);
    });

    // Add powered-by
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:inline-flex;flex-direction:column;align-items:center;gap:4px;';
    wrapper.appendChild(btn);

    var powered = document.createElement('a');
    powered.href = BASE;
    powered.target = '_blank';
    powered.rel = 'noopener';
    powered.textContent = '⚡ SiteViral';
    powered.style.cssText = 'font-size:10px;color:#999;text-decoration:none;font-family:sans-serif;';
    wrapper.appendChild(powered);

    el.innerHTML = '';
    el.appendChild(wrapper);
  }

  function openCheckout(productId, color, ref) {
    if (overlay) return;

    var url = BASE + '/embed/checkout/' + productId + '?color=' + encodeURIComponent(color);
    if (ref) url += '&ref=' + encodeURIComponent(ref);

    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:999999;' +
      'background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;' +
      'animation:svFadeIn 0.2s ease;';

    var iframe = document.createElement('iframe');
    iframe.id = IFRAME_ID_PREFIX + productId;
    iframe.src = url;
    iframe.style.cssText = 'width:100%;max-width:480px;height:90vh;max-height:700px;border:none;' +
      'border-radius:16px;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,0.3);' +
      'animation:svSlideUp 0.3s ease;';
    iframe.allow = 'payment';

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeCheckout();
    });

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  function closeCheckout() {
    if (overlay) {
      document.body.removeChild(overlay);
      overlay = null;
      document.body.style.overflow = '';
    }
  }

  // Listen for messages from iframe
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.source !== 'siteviral-embed') return;
    if (e.data.type === 'close') closeCheckout();
    if (e.data.type === 'purchase_complete') {
      closeCheckout();
      // Dispatch custom event for integrators
      var evt = new CustomEvent('siteviral:purchase', { detail: { productId: e.data.productId } });
      document.dispatchEvent(evt);
    }
  });

  // Inject animations
  var style = document.createElement('style');
  style.textContent = '@keyframes svFadeIn{from{opacity:0}to{opacity:1}}' +
    '@keyframes svSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(style);

  // Init
  function init() {
    var elements = document.querySelectorAll('[data-siteviral-product]');
    for (var i = 0; i < elements.length; i++) {
      createButton(elements[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
