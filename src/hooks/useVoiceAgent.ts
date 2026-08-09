import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type VoiceTurn = { role: 'user' | 'assistant'; content: string; blocked?: boolean };

const SAMPLE_RATE = 24000;

/**
 * Browser side of the Deepgram Voice Agent test.
 * Audio in: 24 kHz mono linear16 frames. Audio out: raw linear16 played back
 * through a small scheduled queue. Everything goes through our own edge-function
 * proxy — no Deepgram or Gemini key exists in the browser.
 */
export function useVoiceAgent(opts: { language: 'fr' | 'en'; assistantName: string }) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inCtxRef = useRef<AudioContext | null>(null);
  const outCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playHeadRef = useRef(0);
  const mutedRef = useRef(false);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const teardown = useCallback(() => {
    try { wsRef.current?.close(); } catch {}
    wsRef.current = null;
    nodeRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    inCtxRef.current?.close().catch(() => {});
    outCtxRef.current?.close().catch(() => {});
    nodeRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    inCtxRef.current = null;
    outCtxRef.current = null;
    playHeadRef.current = 0;
    setSpeaking(false);
  }, []);

  const stop = useCallback(() => { teardown(); setStatus('idle'); }, [teardown]);

  useEffect(() => () => teardown(), [teardown]);

  const playPcm = useCallback((buf: ArrayBuffer) => {
    const ctx = outCtxRef.current;
    if (!ctx) return;
    const pcm = new Int16Array(buf);
    if (!pcm.length) return;
    const audio = ctx.createBuffer(1, pcm.length, SAMPLE_RATE);
    const ch = audio.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 0x8000;
    const src = ctx.createBufferSource();
    src.buffer = audio;
    src.connect(ctx.destination);
    const now = ctx.currentTime;
    const at = Math.max(now + 0.05, playHeadRef.current);
    src.start(at);
    playHeadRef.current = at + audio.duration;
    setSpeaking(true);
    src.onended = () => {
      if (outCtxRef.current && playHeadRef.current - outCtxRef.current.currentTime < 0.08) setSpeaking(false);
    };
  }, []);

  const start = useCallback(async () => {
    if (status === 'connecting' || status === 'live') return;
    setError(null);
    setStatus('connecting');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Session expired — sign in again.');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const base = import.meta.env.VITE_SUPABASE_URL.replace(/^http/, 'ws');
      const url = `${base}/functions/v1/voice-agent?token=${encodeURIComponent(token)}&language=${opts.language}&assistant_name=${encodeURIComponent(opts.assistantName)}`;
      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = async () => {
        setStatus('live');
        const outCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
        outCtxRef.current = outCtx;
        const inCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
        inCtxRef.current = inCtx;
        const source = inCtx.createMediaStreamSource(stream);
        sourceRef.current = source;
        const node = inCtx.createScriptProcessor(4096, 1, 1);
        nodeRef.current = node;
        node.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const pcm = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const s = mutedRef.current ? 0 : Math.max(-1, Math.min(1, input[i]));
            pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          ws.send(pcm.buffer);
        };
        source.connect(node);
        node.connect(inCtx.destination);
      };

      ws.onmessage = (ev) => {
        if (typeof ev.data !== 'string') { playPcm(ev.data as ArrayBuffer); return; }
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'ConversationText' && msg.content) {
            setTurns((prev) => [...prev, { role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content }]);
          } else if (msg.type === 'SafetyBlocked') {
            setTurns((prev) => [...prev, { role: 'assistant', content: msg.message, blocked: true }]);
          } else if (msg.type === 'UserStartedSpeaking') {
            playHeadRef.current = 0;
            setSpeaking(false);
          } else if (msg.type === 'Error' || msg.type === 'ProxyError') {
            setError(msg.description || msg.message || 'Voice agent error');
          }
        } catch {}
      };

      ws.onerror = () => { setError('Connection error'); setStatus('error'); };
      ws.onclose = () => { teardown(); setStatus((s) => (s === 'error' ? 'error' : 'idle')); };
    } catch (err: any) {
      teardown();
      setStatus('error');
      setError(err?.name === 'NotAllowedError' ? 'Microphone access denied.' : err?.message || 'Unable to start');
    }
  }, [status, opts.language, opts.assistantName, playPcm, teardown]);

  return { status, error, turns, speaking, muted, setMuted, start, stop, clear: () => setTurns([]) };
}
