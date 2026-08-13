import { corsHeaders, jsonResp } from '../_shared/auth.ts';
import { aiGenerateText } from '../_shared/ai-fallback.ts';
import { extractJson } from '../_shared/ai-gemini.ts';

// Simple per-IP daily rate limit. Memory-only across a single edge-function
// instance, but enough to stop casual abuse and keep the preview cheap.
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const history = requestLog.get(ip) || [];
  const recent = history.filter((ts) => now - ts < RATE_LIMIT_MS);
  requestLog.set(ip, recent);
  return recent.length >= MAX_REQUESTS_PER_WINDOW;
}

function recordRequest(ip: string) {
  const now = Date.now();
  const history = requestLog.get(ip) || [];
  history.push(now);
  requestLog.set(ip, history);
}

const prompts: Record<string, { system: string; user: (topic: string) => string }> = {
  fr: {
    system: `Tu es un éditeur et écrivain d'aide à l'auteur. Pour l'idée de livre donnée, propose un titre accrocheur, un sous-titre, un plan de 6 à 8 chapitres et les 300 premiers mots du chapitre 1. Retourne UNIQUEMENT un JSON valide. Pas de markdown, pas de commentaires, pas de texte hors JSON. Les chapitres doivent avoir un titre clair et une phrase de synthèse.`,
    user: (topic) => `Livre à écrire : "${topic}"

Retourne UNIQUEMENT ce JSON:
{
  "title": "Titre accrocheur",
  "subtitle": "Sous-titre percutant",
  "chapters": [
    { "title": "Titre du chapitre 1", "summary": "Une phrase sur ce qu'il contient" },
    ...
  ],
  "openingChapter": "Les 300 premiers mots du chapitre 1, en français, dans un style direct et engageant."
}`,
  },
  en: {
    system: `You are an editor and author assistant. For the given book idea, propose a compelling title, subtitle, a 6-8 chapter outline, and the first 300 words of chapter 1. Return ONLY valid JSON. No markdown, no comments, no text outside JSON. Chapters should have a clear title and a one-sentence summary.`,
    user: (topic) => `Book to write: "${topic}"

Return ONLY this JSON:
{
  "title": "Compelling title",
  "subtitle": "Strong subtitle",
  "chapters": [
    { "title": "Chapter 1 title", "summary": "One sentence about what it covers" },
    ...
  ],
  "openingChapter": "The first 300 words of chapter 1, in English, in a direct and engaging style."
}`,
  },
};

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const { topic, locale } = await req.json();
    if (!topic || typeof topic !== 'string') {
      return jsonResp({ error: 'topic is required' }, 400);
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return jsonResp({ error: 'Daily preview limit reached. Please try again tomorrow.' }, 429);
    }
    recordRequest(ip);

    const lang = locale === 'en' ? 'en' : 'fr';
    const p = prompts[lang];

    let result: any = null;
    let lastRaw = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      lastRaw = await aiGenerateText({
        geminiKey: GEMINI_API_KEY,
        model: 'gemini-2.5-flash-lite',
        system: p.system,
        prompt: p.user(topic),
        maxOutputTokens: 4096,
        jsonMode: true,
      });
      result = extractJson(lastRaw);
      if (result && result.title && Array.isArray(result.chapters) && result.chapters.length > 0) {
        break;
      }
    }

    if (!result || !result.title || !Array.isArray(result.chapters) || result.chapters.length === 0) {
      console.error('[guest-book-outline] Final raw:', lastRaw?.slice(0, 600));
      return jsonResp({ error: 'Failed to generate book preview' }, 500);
    }

    // Keep the opening chapter short to control cost and fit the UI.
    const opening = result.openingChapter
      ? result.openingChapter.slice(0, 1800)
      : '';

    return jsonResp({
      title: result.title,
      subtitle: result.subtitle || '',
      chapters: result.chapters.slice(0, 10),
      openingChapter: opening,
    });
  } catch (e: any) {
    if (e?.status === 429) return jsonResp({ error: e.message || 'Rate limit. Please retry.' }, 429);
    console.error('guest-book-outline error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
