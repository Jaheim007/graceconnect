import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

/**
 * OneSignal integration hook.
 * Loads the OneSignal SDK and provides subscription management.
 * Requires VITE_ONESIGNAL_APP_ID in .env.
 */
export function useOneSignal() {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEnabled = !!ONESIGNAL_APP_ID;

  // Load OneSignal SDK once
  useEffect(() => {
    if (!isEnabled) return;
    if (window.OneSignal) {
      setIsReady(true);
      return;
    }

    // Deferred queue pattern from OneSignal docs
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { enable: false },
      });
      setIsReady(true);

      // Check initial subscription state
      const permission = await OneSignal.Notifications.permission;
      setIsSubscribed(permission);
    });

    return () => {
      // Cleanup not needed — SDK is loaded once
    };
  }, [isEnabled]);

  // Set external user ID when user logs in
  useEffect(() => {
    if (!isReady || !user?.id || !window.OneSignal) return;
    
    window.OneSignalDeferred?.push(async (OneSignal: any) => {
      try {
        await OneSignal.login(user.id);
        // Set email tag for targeting
        if (user.email) {
          await OneSignal.User.addEmail(user.email);
        }
      } catch (err) {
        console.warn('[OneSignal] login error:', err);
      }
    });
  }, [isReady, user?.id, user?.email]);

  const requestPermission = useCallback(async () => {
    if (!isReady || !window.OneSignal) return;
    setLoading(true);
    try {
      window.OneSignalDeferred?.push(async (OneSignal: any) => {
        await OneSignal.Notifications.requestPermission();
        const granted = await OneSignal.Notifications.permission;
        setIsSubscribed(granted);
        setLoading(false);
      });
    } catch (err) {
      console.error('[OneSignal] requestPermission error:', err);
      setLoading(false);
    }
  }, [isReady]);

  const sendTag = useCallback(async (key: string, value: string) => {
    if (!isReady || !window.OneSignal) return;
    window.OneSignalDeferred?.push(async (OneSignal: any) => {
      await OneSignal.User.addTag(key, value);
    });
  }, [isReady]);

  return {
    isEnabled,
    isReady,
    isSubscribed,
    loading,
    requestPermission,
    sendTag,
  };
}
