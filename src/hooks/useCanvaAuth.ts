import { useState, useCallback } from 'react';
import { canvaExchangeCode, canvaRefreshToken } from '@/lib/canva/canva.functions';


const CANVA_TOKEN_KEY = 'sv_canva_token';
const CANVA_REFRESH_KEY = 'sv_canva_refresh';
const CANVA_EXPIRES_KEY = 'sv_canva_expires';

const CANVA_CLIENT_ID = 'OC-AaBNLr9XS5P3';
const CANVA_REDIRECT_URI = 'https://siteviral.com/canva/callback';
const CANVA_SCOPES = 'asset:read design:content:read design:meta:read profile:read design:content:write asset:write folder:read';

// ── PKCE helpers ──
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, length);
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function useCanvaAuth() {
  const [canvaToken, setCanvaToken] = useState<string | null>(() => {
    const token = localStorage.getItem(CANVA_TOKEN_KEY);
    const expires = localStorage.getItem(CANVA_EXPIRES_KEY);
    if (token && expires && Date.now() < Number(expires)) return token;
    return null;
  });
  const [loading, setLoading] = useState(false);

  const isConnected = !!canvaToken;

  const saveTokens = useCallback((data: { access_token: string; refresh_token: string; expires_in: number }) => {
    const expiresAt = Date.now() + data.expires_in * 1000;
    localStorage.setItem(CANVA_TOKEN_KEY, data.access_token);
    localStorage.setItem(CANVA_REFRESH_KEY, data.refresh_token);
    localStorage.setItem(CANVA_EXPIRES_KEY, String(expiresAt));
    setCanvaToken(data.access_token);
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(CANVA_TOKEN_KEY);
    localStorage.removeItem(CANVA_REFRESH_KEY);
    localStorage.removeItem(CANVA_EXPIRES_KEY);
    setCanvaToken(null);
  }, []);

  const startAuth = useCallback(async () => {
    setLoading(true);
    try {
      // Generate PKCE code_verifier (43-128 chars)
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = crypto.randomUUID();

      // Store for callback
      sessionStorage.setItem('canva_code_verifier', codeVerifier);
      sessionStorage.setItem('canva_oauth_state', state);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: CANVA_CLIENT_ID,
        redirect_uri: CANVA_REDIRECT_URI,
        scope: CANVA_SCOPES,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        state,
      });

      window.location.href = `https://www.canva.com/api/oauth/authorize?${params.toString()}`;
    } catch (e: any) {
      console.error('Canva auth error:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const exchangeCode = useCallback(async (code: string) => {
    setLoading(true);
    try {
      const codeVerifier = sessionStorage.getItem('canva_code_verifier');
      if (!codeVerifier) throw new Error('Missing PKCE code_verifier');

      const data = await canvaExchangeCode({
        data: { code, redirect_uri: CANVA_REDIRECT_URI, code_verifier: codeVerifier },
      });

      sessionStorage.removeItem('canva_code_verifier');

      saveTokens(data);
      return true;
    } catch (e: any) {
      console.error('Canva token exchange error:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [saveTokens]);

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem(CANVA_REFRESH_KEY);
    if (!refresh) { disconnect(); return null; }

    try {
      const data = await canvaRefreshToken({ data: { refresh_token: refresh } });
      if (!data?.access_token) { disconnect(); return null; }
      saveTokens(data);
      return data.access_token;
    } catch {
      disconnect();
      return null;
    }
  }, [saveTokens, disconnect]);


  const getValidToken = useCallback(async (): Promise<string | null> => {
    const expires = localStorage.getItem(CANVA_EXPIRES_KEY);
    const token = localStorage.getItem(CANVA_TOKEN_KEY);
    if (token && expires && Date.now() < Number(expires) - 60000) return token;
    return await refreshToken();
  }, [refreshToken]);

  return { isConnected, canvaToken, loading, startAuth, exchangeCode, getValidToken, disconnect };
}
