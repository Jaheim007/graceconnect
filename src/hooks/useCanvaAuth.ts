import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CANVA_TOKEN_KEY = 'sv_canva_token';
const CANVA_REFRESH_KEY = 'sv_canva_refresh';
const CANVA_EXPIRES_KEY = 'sv_canva_expires';

interface CanvaToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
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
      const redirectUri = 'https://siteviral.com/canva/callback';
      const state = crypto.randomUUID();
      sessionStorage.setItem('canva_oauth_state', state);

      const { data, error } = await supabase.functions.invoke('canva-auth?action=authorize', {
        body: { redirect_uri: redirectUri, state },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Failed to get authorize URL');

      // Redirect to Canva
      window.location.href = data.authorize_url;
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
      const redirectUri = 'https://siteviral.com/canva/callback';

      const { data, error } = await supabase.functions.invoke('canva-auth?action=token', {
        body: { code, redirect_uri: redirectUri },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Token exchange failed');

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
    if (!refresh) {
      disconnect();
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('canva-auth?action=refresh', {
        body: { refresh_token: refresh },
      });

      if (error || !data?.ok) {
        disconnect();
        return null;
      }

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

    if (token && expires && Date.now() < Number(expires) - 60000) {
      return token;
    }

    // Token expired or about to expire, try refresh
    return await refreshToken();
  }, [refreshToken]);

  return {
    isConnected,
    canvaToken,
    loading,
    startAuth,
    exchangeCode,
    getValidToken,
    disconnect,
  };
}
