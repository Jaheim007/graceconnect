/**
 * Viral Studio — conversational front-end onto the EXISTING course pipeline.
 *
 * Gemini credential: this function calls Google Generative Language directly
 * with the project's own `GEMINI_API_KEY` secret (the exact same secret used by
 * `course-from-document` and the rest of the platform's AI features).
 * No Lovable AI Gateway / no Lovable-managed model access is used here.
 *
 * Cost model: chatting is FREE — this function never debits credits.
 * When the model decides enough information was gathered it emits a
 * `start_course_generation` function call; we return it to the client as a
 * *proposal* (with the real cost from `credit_action_pricing` and the user's
 * live balance). Credits are only spent when the user explicitly confirms and
 * the client calls the existing `course-from-document` pipeline, whose output
 * still goes through the normal draft-review flow.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResp, requireAuth } from '../_shared/auth.ts';

const GENERATION_ACTION_KEY = 'ai_course_structure';

type ChatMsg = { role: 'user' | 'assistant'; content: string };

interface Attachment {
  file_url?: string;
  file_name?: string;
  mime?: string;
}

const BOOK_ACTION_KEY = 'generate_book';

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'start_course_generation',
        description:
          'Propose the creation of a course/formation with the existing generation pipeline. Only call this once the topic, the audience and the language are known.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Short course title.' },
            prompt: {
              type: 'STRING',
              description:
                'A rich, self-contained brief for the pipeline: topic, audience, goal, tone, level, key points to cover.',
            },
            language: { type: 'STRING', description: 'fr or en' },
            tier: { type: 'STRING', description: 'standard or premium' },
            level: { type: 'STRING', description: 'beginner, intermediate or advanced' },
            generate_images: { type: 'BOOLEAN', description: 'Generate AI illustrations per lesson (extra credits).' },
            use_document: {
              type: 'BOOLEAN',
              description: 'True when the user uploaded a document that should be converted into the course.',
            },
          },
          required: ['title', 'prompt', 'language', 'tier'],
        },
      },
      {
        name: 'start_book_generation',
        description:
          'Propose the creation of a book / ebook with the existing writing pipeline. Only call this once the topic, the audience and the language are known.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Short book title.' },
            prompt: { type: 'STRING', description: 'Rich brief: topic, promise, audience, angle, key chapters.' },
            language: { type: 'STRING', description: 'fr or en' },
            style: {
              type: 'STRING',
              description: 'ebook, guide, prayers, story, novel, devotional, activity or coloring',
            },
            tone: {
              type: 'STRING',
              description: 'professional, conversational, humorous, spiritual, poetic or academic',
            },
            audience: {
              type: 'STRING',
              description: 'general, children, teens, adults, seniors or professionals',
            },
            chapter_count: { type: 'NUMBER', description: 'Number of chapters (6-14).' },
            use_document: { type: 'BOOLEAN', description: 'True when an uploaded document is the source.' },
          },
          required: ['title', 'prompt', 'language'],
        },
      },
    ],
  },
];

function systemPrompt(assistantName: string, isFr: boolean, attachments: Attachment[]) {
  const doc = attachments.length
    ? `The user has attached: ${attachments.map((a) => a.file_name || a.file_url).join(', ')}. Prefer use_document=true.`
    : 'No document attached. The content will be generated from the conversation brief.';

  return [
    `You are ${assistantName}, the creation assistant of SiteViral.`,
    `You help creators turn an idea into a sellable course/formation OR a book/ebook through natural conversation — never by showing forms.`,
    `Language: reply in ${isFr ? 'French' : 'English'}, but always mirror the language the user writes in.`,
    `First figure out WHAT they want: a course/formation, or a book/ebook.`,
    `Ask ONE short question at a time, and only ask what is still missing: topic, target audience, goal, tone, level, language, and whether they want AI illustrations.`,
    `If the user already gave everything in one message (often by voice), do NOT re-ask — just confirm: "Anything else to add, or should I generate?"`,
    `Keep every reply under 70 words, warm and concrete. Never invent platform features.`,
    `When the essentials are known, call "start_course_generation" (course) or "start_book_generation" (book) with a rich brief instead of writing a long plan.`,
    `Default tier is "standard"; propose "premium" only if the user asks for a deeper/longer course.`,
    `Never claim the content is generated: after the tool call the user must confirm the credit cost, then they land in the normal editor/review flow.`,
    doc,
  ].join('\n');
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const messages: ChatMsg[] = Array.isArray(body?.messages) ? body.messages.slice(-24) : [];
    const attachments: Attachment[] = Array.isArray(body?.attachments) ? body.attachments : [];
    const language = body?.language === 'en' ? 'en' : 'fr';
    const assistantName = typeof body?.assistant_name === 'string' ? body.assistant_name : 'Viral Studio';

    if (!messages.length) return jsonResp({ error: 'messages required' }, 400);

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) return jsonResp({ error: 'GEMINI_API_KEY not configured' }, 500);

    const admin = createClient(auth.supabaseUrl, auth.serviceKey);

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, 6000) }],
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          tools: TOOLS,
          system_instruction: { parts: [{ text: systemPrompt(assistantName, language === 'fr', attachments) }] },
          generationConfig: { temperature: 0.6, maxOutputTokens: 900 },
        }),
      },
    );

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      console.error('[viral-studio-chat] gemini error', res.status, detail);
      return jsonResp({ error: `AI unavailable (${res.status})`, detail }, res.status === 429 ? 429 : 502);
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p: any) => p?.text).filter(Boolean).join('\n').trim();
    const call = parts.find((p: any) => p?.functionCall)?.functionCall;

    const isCourse = call?.name === 'start_course_generation';
    const isBook = call?.name === 'start_book_generation';

    if (!isCourse && !isBook) {
      return jsonResp({ message: text || (language === 'fr' ? 'Peux-tu préciser ?' : 'Could you clarify?') });
    }

    const args = (call.args || {}) as Record<string, unknown>;
    const tier = args.tier === 'premium' ? 'premium' : 'standard';
    const actionKey = isCourse ? GENERATION_ACTION_KEY : BOOK_ACTION_KEY;

    // Cost comes from the SAME pricing table the pipeline debits from.
    const { data: pricing } = await admin
      .from('credit_action_pricing')
      .select('cost_standard, cost_premium, action_label')
      .eq('action_key', actionKey)
      .eq('is_active', true)
      .maybeSingle();

    const cost = pricing
      ? Number(tier === 'premium' ? (pricing as any).cost_premium : (pricing as any).cost_standard)
      : null;

    let balance: number | null = null;
    try {
      const { data: summary } = await admin.rpc('get_credit_summary', { _user_id: auth.userId });
      balance = Number((summary as any)?.balance ?? 0);
    } catch (_e) {
      balance = null;
    }

    const useDocument = args.use_document === true && attachments.length > 0;
    const attachment = attachments[0] || {};
    const docFields = useDocument
      ? { file_url: attachment.file_url, file_name: attachment.file_name, mime: attachment.mime }
      : {};

    const BOOK_STYLES = ['ebook', 'guide', 'prayers', 'story', 'novel', 'devotional', 'activity', 'coloring'];
    const TONES = ['professional', 'conversational', 'humorous', 'spiritual', 'poetic', 'academic'];
    const AUDIENCES = ['general', 'children', 'teens', 'adults', 'seniors', 'professionals'];

    return jsonResp({
      message:
        text ||
        (language === 'fr'
          ? 'Parfait — voici le récapitulatif avant de lancer la génération.'
          : "Great — here's the recap before we generate."),
      proposal: {
        kind: isCourse ? 'course' : 'book',
        action_key: actionKey,
        action_label: (pricing as any)?.action_label || (isCourse ? 'AI course' : 'AI book'),
        cost,
        balance,
        can_afford: cost == null || balance == null ? null : balance >= cost,
        input: {
          source: useDocument ? 'document' : 'prompt',
          title: String(args.title || '').slice(0, 160),
          prompt: String(args.prompt || '').slice(0, 6000),
          language: args.language === 'en' ? 'en' : language,
          tier,
          ...(isCourse
            ? {
                level: ['beginner', 'intermediate', 'advanced'].includes(String(args.level))
                  ? String(args.level)
                  : 'beginner',
                generate_images: args.generate_images === true,
              }
            : {
                style: BOOK_STYLES.includes(String(args.style)) ? String(args.style) : 'ebook',
                tone: TONES.includes(String(args.tone)) ? String(args.tone) : 'professional',
                audience: AUDIENCES.includes(String(args.audience)) ? String(args.audience) : 'general',
                chapter_count: Math.min(14, Math.max(6, Number(args.chapter_count) || 8)),
              }),
          ...docFields,
        },
      },
    });

  } catch (err) {
    console.error('[viral-studio-chat] error', err);
    return jsonResp({ error: (err as Error)?.message || 'Unexpected error' }, 500);
  }
});
