/**
 * Deepgram Voice Agent proxy — PRIVATE internal test (allowlisted UID only).
 *
 * Why a proxy instead of a browser → Deepgram connection:
 *  - DEEPGRAM_API_KEY never reaches the browser.
 *  - GEMINI_API_KEY never reaches the browser: the agent's reasoning ("think")
 *    runs on OUR OWN Gemini key through Gemini's OpenAI-compatible endpoint,
 *    NOT on Deepgram's bundled/managed model connection. Billing and behaviour
 *    therefore stay consistent with the rest of the platform's AI features.
 *  - It lets us run the SAME independent moderation pass as the chat version on
 *    every user utterance BEFORE the agent is allowed to answer it.
 *
 * Speech-to-text: Deepgram Flux multilingual (`flux-general-multi`, the Flux/V2 listen API) so
 * EN/FR are auto-detected and can be switched mid-call. NOTE: the deprecated
 * `agent.language` field must NOT be sent with Flux — Deepgram rejects it.
 */
import { corsHeaders, jsonResp, requireAuth } from '../_shared/auth.ts';
import { canUseVoiceAgent } from '../_shared/voice-agent-access.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  SAFETY_SYSTEM_RULES,
  moderateMessage,
  safetyResponse,
  logSafetyFlag,
} from '../_shared/ai-safety.ts';

const LISTEN_MODEL = Deno.env.get('DEEPGRAM_FLUX_MODEL') || 'flux-general-multi';
const THINK_MODEL = Deno.env.get('VOICE_AGENT_THINK_MODEL') || 'gemini-2.5-flash';
const AGENT_URL = 'wss://agent.deepgram.com/v1/agent/converse';

function agentPrompt(assistantName: string, isFr: boolean) {
  return `You are ${assistantName}, the voice assistant of the SiteViral platform.
You help creators (often pastors, teachers, coaches in French-speaking Africa)
turn an idea into a course/formation or a book on their platform.

Speak naturally and briefly — this is a spoken conversation, 1-3 short sentences
per turn, no markdown, no lists, no emoji. Ask one question at a time until you
know: the topic, the audience, the language, the tone and the depth. Then
summarise the brief out loud and tell the user to confirm so it can be sent to
the generation pipeline. Never claim you generated anything yourself.

Follow the language the user speaks. If they switch between French and English,
switch with them. Default language: ${isFr ? 'French' : 'English'}.

${SAFETY_SYSTEM_RULES}`;
}

function settings(assistantName: string, isFr: boolean, geminiKey: string) {
  return {
    type: 'Settings',
    audio: {
      input: { encoding: 'linear16', sample_rate: 24000 },
      output: { encoding: 'linear16', sample_rate: 24000, container: 'none' },
    },
    agent: {
      listen: { provider: { type: 'deepgram', model: LISTEN_MODEL } },
      think: {
        // OUR OWN Gemini key, via Gemini's OpenAI-compatible surface.
        provider: { type: 'open_ai', model: THINK_MODEL, temperature: 0.6 },
        endpoint: {
          url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
          headers: { authorization: `Bearer ${geminiKey}` },
        },
        prompt: agentPrompt(assistantName, isFr),
      },
      speak: {
        provider: {
          type: 'deepgram',
          model: isFr ? 'aura-2-pandora-en' : 'aura-2-thalia-en',
        },
      },
      greeting: isFr
        ? `Bonjour, je suis ${assistantName}. Dis-moi ce que tu veux créer.`
        : `Hi, I'm ${assistantName}. Tell me what you'd like to create.`,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const isWs = (req.headers.get('upgrade') || '').toLowerCase() === 'websocket';

  // Browsers cannot set headers on a WebSocket handshake → the JWT arrives as a
  // query param, and is verified with the exact same verifier as every other
  // function (no bypass path).
  const token = url.searchParams.get('token') || (req.headers.get('Authorization') || '').replace('Bearer ', '');
  const auth = await requireAuth(new Request('http://local/', { headers: { Authorization: `Bearer ${token}` } }));
  if (auth instanceof Response) {
    return isWs ? new Response('Unauthorized', { status: 401 }) : auth;
  }

  // ── Single centralized access gate.
  if (!canUseVoiceAgent(auth.userId)) {
    return isWs ? new Response('Not found', { status: 404 }) : jsonResp({ error: 'Not found' }, 404);
  }

  const dgKey = Deno.env.get('DEEPGRAM_API_KEY');
  const geminiKey = Deno.env.get('GEMINI_API_KEY');

  if (!isWs) {
    // Tiny capability probe used by the UI before opening the socket.
    return jsonResp({
      ok: true,
      allowed: true,
      listen_model: LISTEN_MODEL,
      think: { provider: 'google_gemini_own_key', model: THINK_MODEL, configured: !!geminiKey },
      deepgram_configured: !!dgKey,
    });
  }

  if (!dgKey) return new Response('DEEPGRAM_API_KEY not configured', { status: 501 });
  if (!geminiKey) return new Response('GEMINI_API_KEY not configured', { status: 501 });

  const isFr = url.searchParams.get('language') !== 'en';
  const assistantName = url.searchParams.get('assistant_name') || 'Viral Studio';

  const { socket: client, response } = Deno.upgradeWebSocket(req);
  const admin = createClient(auth.supabaseUrl, auth.serviceKey);

  let upstream: WebSocket | null = null;
  const pending: (string | ArrayBuffer)[] = [];

  const openUpstream = () => {
    // Deepgram accepts the key through the WS subprotocol pair ["token", key].
    upstream = new WebSocket(AGENT_URL, ['token', dgKey]);
    upstream.binaryType = 'arraybuffer';

    upstream.onopen = () => {
      upstream!.send(JSON.stringify(settings(assistantName, isFr, geminiKey)));
      for (const m of pending) upstream!.send(m as any);
      pending.length = 0;
    };

    upstream.onmessage = async (ev) => {
      if (client.readyState !== WebSocket.OPEN) return;

      if (typeof ev.data !== 'string') {
        client.send(ev.data); // agent audio → browser
        return;
      }

      client.send(ev.data);

      // ── Layer 2: independent moderation of what the USER actually said.
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.type === 'ConversationText' && msg?.role === 'user' && typeof msg?.content === 'string') {
          const text = msg.content.trim();
          if (!text) return;
          const verdict = await moderateMessage({ geminiKey, text });
          if (!verdict.flagged) return;

          await logSafetyFlag({
            admin,
            userId: auth.userId,
            surface: 'voice-agent',
            verdict,
            text,
            language: isFr ? 'fr' : 'en',
          });

          const spoken = safetyResponse(verdict.category, isFr, assistantName)
            .replace(/\*\*/g, '')
            .replace(/^•\s*/gm, '');

          // Stop whatever the model was saying and speak the canonical safety
          // response instead — the classifier verdict always wins.
          upstream?.send(JSON.stringify({ type: 'InjectAgentMessage', content: spoken }));
          client.send(JSON.stringify({ type: 'SafetyBlocked', category: verdict.category, message: spoken }));
        }
      } catch (_e) {
        /* non-JSON control frame — ignore */
      }
    };

    upstream.onerror = (e) => {
      console.error('[voice-agent] upstream error', (e as any)?.message || e);
      try { client.send(JSON.stringify({ type: 'ProxyError', message: 'Deepgram connection error' })); } catch {}
    };

    upstream.onclose = (e) => {
      try { client.close(1000, `upstream ${e.code}`); } catch {}
    };
  };

  client.binaryType = 'arraybuffer';
  client.onopen = openUpstream;
  client.onmessage = (ev) => {
    const payload = ev.data as string | ArrayBuffer;
    if (upstream && upstream.readyState === WebSocket.OPEN) upstream.send(payload as any);
    else if (pending.length < 200) pending.push(payload);
  };
  client.onclose = () => { try { upstream?.close(); } catch {} };
  client.onerror = () => { try { upstream?.close(); } catch {} };

  return response;
});
