import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useToast } from '@/hooks/use-toast';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function detectBrowserAndDevice(): { browser: string; isMobile: boolean; isIOS: boolean } {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = isIOS || /Android/i.test(ua);
  let browser = 'other';
  if (/CriOS|Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'safari';
  else if (/Firefox/i.test(ua)) browser = 'firefox';
  else if (/Edg/i.test(ua)) browser = 'edge';
  return { browser, isMobile, isIOS };
}

function getNotificationInstructions(): { title: string; description: string } {
  const { browser, isMobile, isIOS } = detectBrowserAndDevice();

  if (isIOS && browser === 'safari') {
    return {
      title: '🔔 Notifications bloquées',
      description: 'Sur iPhone/iPad : Ouvrez Réglages → faites défiler jusqu\'à Safari → Notifications → autorisez ce site.',
    };
  }
  if (isIOS) {
    return {
      title: '🔔 Notifications bloquées',
      description: 'Sur iPhone/iPad : Ouvrez Réglages → Notifications → trouvez votre navigateur → activez « Autoriser les notifications ».',
    };
  }
  if (isMobile && browser === 'chrome') {
    return {
      title: '🔔 Notifications bloquées',
      description: 'Sur Android : Appuyez sur le cadenas 🔒 à gauche de l\'adresse du site → Notifications → Autoriser. Puis rechargez la page.',
    };
  }
  if (browser === 'chrome') {
    return {
      title: '🔔 Notifications bloquées',
      description: 'Dans Chrome : Cliquez sur le cadenas 🔒 à gauche de l\'adresse → « Paramètres du site » → Notifications → Autoriser. Puis rechargez.',
    };
  }
  if (browser === 'firefox') {
    return {
      title: '🔔 Notifications bloquées',
      description: 'Dans Firefox : Cliquez sur l\'icône 🔒 à gauche de l\'adresse → Permissions → cochez « Autoriser les notifications ». Puis rechargez.',
    };
  }
  if (browser === 'safari') {
    return {
      title: '🔔 Notifications bloquées',
      description: 'Dans Safari : Allez dans Safari → Réglages → Sites web → Notifications → trouvez ce site et choisissez « Autoriser ».',
    };
  }
  if (browser === 'edge') {
    return {
      title: '🔔 Notifications bloquées',
      description: 'Dans Edge : Cliquez sur le cadenas 🔒 à gauche de l\'adresse → « Autorisations pour ce site » → Notifications → Autoriser. Puis rechargez.',
    };
  }
  return {
    title: '🔔 Notifications bloquées',
    description: 'Cliquez sur l\'icône cadenas 🔒 à gauche de l\'adresse du site → cherchez « Notifications » → choisissez « Autoriser ». Puis rechargez la page.',
  };
}


export function usePushNotifications() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY;

  // Check existing subscription on mount
  useEffect(() => {
    if (!isSupported || !user) return;
    
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    }).catch(() => {});
  }, [isSupported, user]);

  // Auto-register service worker on mount
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        // Show browser/device-specific instructions
        const instructions = getNotificationInstructions();
        toast({
          title: instructions.title,
          description: instructions.description,
          variant: 'destructive',
          duration: 12000,
        });
        setLoading(false);
        return;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });

      const json = sub.toJSON();
      await db.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
        organization_id: currentOrg?.id || null,
      }, { onConflict: 'endpoint' });

      setIsSubscribed(true);
      toast({ title: '🔔 Notifications push activées !' });
    } catch (err: any) {
      console.error('Push subscription failed:', err);
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, currentOrg, isSupported, toast]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
      setIsSubscribed(false);
      toast({ title: '🔕 Notifications push désactivées' });
    } catch (err: any) {
      console.error('Unsubscribe failed:', err);
    }
  }, [user, toast]);

  return { isSupported, isSubscribed, subscribe, unsubscribe, loading };
}
