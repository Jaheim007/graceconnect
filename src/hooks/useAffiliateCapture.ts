// Capture and read affiliate ref code from URL → sessionStorage
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const STORAGE_KEY = 'gc_affiliate_ref';

export function useAffiliateCapture() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      sessionStorage.setItem(STORAGE_KEY, ref);
    }
  }, [searchParams]);
}

export function getAffiliateCode(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearAffiliateCode() {
  sessionStorage.removeItem(STORAGE_KEY);
}
