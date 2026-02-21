import { useState, useCallback } from 'react';
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

export function usePushNotifications() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY;

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const sub = await (registration as any).pushManager.subscribe({
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
      toast({ title: '🔔 Notifications activées' });
    } catch (err: any) {
      console.error('Push subscription failed:', err);
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, currentOrg, isSupported, toast]);

  return { isSupported, isSubscribed, subscribe, loading };
}
