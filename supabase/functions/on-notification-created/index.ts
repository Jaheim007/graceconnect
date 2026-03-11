import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Encode bytes to base64url (no padding)
 */
function base64urlEncode(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode base64url to Uint8Array
 */
function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Send a Web Push notification using the Web Push protocol with VAPID.
 * Implements RFC 8291 (Message Encryption) and RFC 8292 (VAPID).
 */
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<{ ok: boolean; status: number; statusText: string }> {
  // Import VAPID private key
  const privateKeyBytes = base64urlDecode(vapidPrivateKey);
  const publicKeyBytes = base64urlDecode(vapidPublicKey);

  // Create VAPID JWT
  const audience = new URL(subscription.endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', typ: 'JWT' };
  const claims = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: 'mailto:noreply@siteviral.com',
  };

  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Import the private key for signing
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: vapidPrivateKey,
    x: base64urlEncode(publicKeyBytes.slice(1, 33)),
    y: base64urlEncode(publicKeyBytes.slice(33, 65)),
  };

  const signingKey = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format if needed
  const sigBytes = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigBytes.length === 64) {
    rawSig = sigBytes;
  } else {
    // DER format — extract r and s
    let offset = 2;
    const rLen = sigBytes[offset + 1];
    const r = sigBytes.slice(offset + 2, offset + 2 + rLen);
    offset = offset + 2 + rLen;
    const sLen = sigBytes[offset + 1];
    const s = sigBytes.slice(offset + 2, offset + 2 + sLen);
    // Pad to 32 bytes each
    const rPad = new Uint8Array(32);
    const sPad = new Uint8Array(32);
    rPad.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
    sPad.set(s.length > 32 ? s.slice(s.length - 32) : s, 32 - Math.min(s.length, 32));
    rawSig = new Uint8Array(64);
    rawSig.set(rPad, 0);
    rawSig.set(sPad, 32);
  }

  const jwt = `${unsignedToken}.${base64urlEncode(rawSig)}`;

  // Encrypt payload using aes128gcm (RFC 8291)
  const userPublicKey = base64urlDecode(subscription.p256dh);
  const userAuth = base64urlDecode(subscription.auth);

  // Generate ephemeral ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', localKeyPair.publicKey)
  );

  // Import subscriber's public key
  const subscriberKey = await crypto.subtle.importKey(
    'raw', userPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: subscriberKey }, localKeyPair.privateKey, 256
    )
  );

  // HKDF for auth secret → IKM
  const authInfo = new TextEncoder().encode('WebPush: info\0');
  const authInfoFull = new Uint8Array(authInfo.length + userPublicKey.length + localPublicKeyRaw.length);
  authInfoFull.set(authInfo);
  authInfoFull.set(userPublicKey, authInfo.length);
  authInfoFull.set(localPublicKeyRaw, authInfo.length + userPublicKey.length);

  const authHkdfKey = await crypto.subtle.importKey('raw', userAuth, 'HKDF', false, ['deriveBits']);
  const prk = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: sharedSecret, info: authInfoFull },
      authHkdfKey, 256
    )
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive CEK and nonce
  const prkKey = await crypto.subtle.importKey('raw', prk, 'HKDF', false, ['deriveBits']);

  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const cek = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo }, prkKey, 128
    )
  );

  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo }, prkKey, 96
    )
  );

  // Pad and encrypt
  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 2);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // delimiter
  // padding byte is already 0

  const encKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce }, encKey, paddedPayload
    )
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted
  const rs = 4096;
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs);

  const header_bytes = new Uint8Array(16 + 4 + 1 + localPublicKeyRaw.length + encrypted.length);
  let pos = 0;
  header_bytes.set(salt, pos); pos += 16;
  header_bytes.set(rsBytes, pos); pos += 4;
  header_bytes[pos] = localPublicKeyRaw.length; pos += 1;
  header_bytes.set(localPublicKeyRaw, pos); pos += localPublicKeyRaw.length;
  header_bytes.set(encrypted, pos);

  // Send the push request
  const vapidPublicB64 = vapidPublicKey;
  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Authorization': `vapid t=${jwt}, k=${vapidPublicB64}`,
    },
    body: header_bytes,
  });

  return { ok: res.ok || res.status === 201, status: res.status, statusText: res.statusText };
}

/**
 * Edge function triggered by pg_net on user_notifications INSERT.
 * Sends email + Web Push for each notification.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const VAPID_PUBLIC_KEY = Deno.env.get('VITE_VAPID_PUBLIC_KEY') || '';
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';

  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json();

    let notification: any = null;
    if (body.record) {
      notification = body.record;
    } else if (body.notification_id) {
      const { data } = await db.from('user_notifications').select('*').eq('id', body.notification_id).single();
      notification = data;
    }

    if (!notification) {
      return new Response(JSON.stringify({ error: 'No notification data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = notification.user_id;
    const title = notification.title || '🔔 Notification';
    const notifBody = notification.body || '';
    const actionUrl = notification.action_url || '/notifications';
    const notifType = notification.notification_type || 'general';

    if (!userId) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no user_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user email
    let userEmail: string | null = null;
    try {
      const { data: { user } } = await db.auth.admin.getUserById(userId);
      userEmail = user?.email || null;
    } catch (e) {
      console.warn('Could not fetch user email:', e);
    }

    // Get user notification preferences
    const { data: prefs } = await db.from('notification_preferences')
      .select('email_enabled, push_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    const emailEnabled = prefs ? prefs.email_enabled !== false : true;
    const pushEnabled = prefs ? prefs.push_enabled !== false : true;

    const results: Record<string, any> = { notification_id: notification.id };

    // ─── 1. SEND EMAIL ───
    // Skip email for content-published notifications — they already have dedicated email templates
    // sent by emailOrgAdmins in onContentPublished. Sending here would cause duplicate emails.
    const SKIP_EMAIL_TYPES = ['new_product', 'new_event', 'new_announcement', 'new_media', 'new_campaign', 'new_program'];
    const skipEmail = SKIP_EMAIL_TYPES.includes(notifType);

    if (userEmail && emailEnabled && !skipEmail) {
      try {
        const emailFnUrl = `${SUPABASE_URL}/functions/v1/send-email`;
        const fullUrl = actionUrl.startsWith('http') ? actionUrl : `https://siteviral.com${actionUrl}`;
        const emailRes = await fetch(emailFnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            template: 'notification_reminder',
            to: userEmail,
            data: { title, body: notifBody, action_url: fullUrl, notification_type: notifType },
          }),
        });
        const emailResult = await emailRes.json();
        results.email = { sent: emailRes.ok, ...emailResult };
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
        results.email = { error: String(emailErr) };
      }
    } else {
      results.email = { skipped: !userEmail ? 'no_email' : 'email_disabled_by_user' };
    }

    // ─── 2. SEND WEB PUSH ───
    if (pushEnabled && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      try {
        // Get all push subscriptions for this user
        const { data: subs } = await db.from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', userId);

        if (subs && subs.length > 0) {
          const pushPayload = JSON.stringify({
            title,
            body: notifBody,
            url: actionUrl,
            tag: notifType,
          });

          let sent = 0;
          let failed = 0;
          const expiredEndpoints: string[] = [];

          for (const sub of subs) {
            try {
              const result = await sendWebPush(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                pushPayload,
                VAPID_PUBLIC_KEY,
                VAPID_PRIVATE_KEY,
              );
              if (result.ok) {
                sent++;
              } else if (result.status === 410 || result.status === 404) {
                // Subscription expired — clean up
                expiredEndpoints.push(sub.endpoint);
                failed++;
              } else {
                console.warn(`Push failed for endpoint: ${result.status} ${result.statusText}`);
                failed++;
              }
            } catch (pushErr) {
              console.error('Individual push error:', pushErr);
              failed++;
            }
          }

          // Clean up expired subscriptions
          if (expiredEndpoints.length > 0) {
            await db.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
          }

          results.push = { sent, failed, total: subs.length, expired_cleaned: expiredEndpoints.length };
        } else {
          results.push = { skipped: 'no_subscriptions' };
        }
      } catch (pushErr) {
        console.error('Web push error:', pushErr);
        results.push = { error: String(pushErr) };
      }
    } else {
      results.push = { skipped: !pushEnabled ? 'push_disabled_by_user' : 'no_vapid_keys' };
    }

    return new Response(JSON.stringify({ ok: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('on-notification-created error:', err);
    return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
