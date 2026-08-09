import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Microphone → editable text, via the server-side Deepgram proxy.
 * The key never reaches the browser and nothing is ever auto-sent: the
 * transcript lands in the composer where the user can correct it.
 */
export function useVoiceDictation(opts: {
  language: 'fr' | 'en';
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<number | null>(null);
  const inflightRef = useRef(false);

  const encodeWav = (chunks: Float32Array[], sampleRate: number): Blob => {
    const length = chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Float32Array(length);
    let off = 0;
    for (const c of chunks) { merged.set(c, off); off += c.length; }

    // Downsample to 16 kHz mono
    const target = 16000;
    const ratio = sampleRate / target;
    const outLen = Math.floor(merged.length / ratio);
    const pcm = new Int16Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const s = Math.max(-1, Math.min(1, merged[Math.floor(i * ratio)] || 0));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const buffer = new ArrayBuffer(44 + pcm.length * 2);
    const view = new DataView(buffer);
    const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + pcm.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, target, true);
    view.setUint32(28, target * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, pcm.length * 2, true);
    new Int16Array(buffer, 44).set(pcm);
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const transcribe = useCallback(async (blob: Blob, isFinal: boolean) => {
    if (blob.size < 2048) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const form = new FormData();
    form.append('file', blob, 'recording.wav');
    form.append('language', opts.language);

    setTranscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('viral-studio-transcribe', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      if (error) throw error;
      const text = (data as any)?.text;
      if (typeof text === 'string' && text.trim()) opts.onTranscript(text.trim(), isFinal);
    } catch (err: any) {
      opts.onError?.(err?.message || 'Transcription failed');
    } finally {
      setTranscribing(false);
    }
  }, [opts]);

  const cleanup = useCallback(() => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    nodeRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    nodeRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const node = ctx.createScriptProcessor(4096, 1, 1);
      nodeRef.current = node;
      chunksRef.current = [];
      node.onaudioprocess = (e) => {
        chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(node);
      node.connect(ctx.destination);
      setRecording(true);

      // Live (interim) transcript: re-transcribe the running recording.
      timerRef.current = window.setInterval(async () => {
        if (inflightRef.current || !chunksRef.current.length) return;
        inflightRef.current = true;
        try {
          await transcribe(encodeWav(chunksRef.current, ctx.sampleRate), false);
        } finally {
          inflightRef.current = false;
        }
      }, 3500);
    } catch (err: any) {
      cleanup();
      setRecording(false);
      opts.onError?.(err?.name === 'NotAllowedError'
        ? (opts.language === 'fr' ? 'Accès au micro refusé.' : 'Microphone access denied.')
        : (err?.message || 'Microphone unavailable'));
    }
  }, [recording, transcribe, cleanup, opts]);

  const stop = useCallback(async () => {
    if (!recording) return;
    const ctx = ctxRef.current;
    const chunks = chunksRef.current;
    setRecording(false);
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (ctx && chunks.length) {
      const blob = encodeWav(chunks, ctx.sampleRate);
      cleanup();
      if (blob.size < 2048) {
        opts.onError?.(opts.language === 'fr' ? 'Enregistrement vide — réessaie.' : 'Empty recording — try again.');
        return;
      }
      await transcribe(blob, true);
    } else {
      cleanup();
    }
  }, [recording, cleanup, transcribe, opts]);

  return { recording, transcribing, start, stop, toggle: () => (recording ? stop() : start()) };
}
