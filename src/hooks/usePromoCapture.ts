// Promo auto-apply: reads ?promo=CODE from URL and stores in sessionStorage
export function capturePromoFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const promo = params.get('promo') || params.get('code');
  if (promo) {
    sessionStorage.setItem('sv_promo_code', promo.toUpperCase());
  }
}

export function getAutoPromoCode(): string | null {
  return sessionStorage.getItem('sv_promo_code');
}

export function clearAutoPromoCode() {
  sessionStorage.removeItem('sv_promo_code');
}
