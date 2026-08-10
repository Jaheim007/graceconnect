/**
 * Viral Studio — conversational front-end onto the EXISTING course pipeline.
 *
 * Gemini credential: this function calls Google Generative Language directly
 * with the project's own `GEMINI_API_KEY` secret (the exact same secret used by
 * `course-from-document` and the rest of the platform's AI features).
 * No Lovable AI Gateway / no Lovable-managed model access is used here.
 *
 * Cost model: each exchange debits a micro-amount (`assistant_chat_message`,
 * 0.05 credit) — small enough to be invisible; never advertised in the UI.
 * When the model decides enough information was gathered it emits a
 * `start_course_generation` function call; we return it to the client as a
 * *proposal* (with the real cost from `credit_action_pricing` and the user's
 * live balance). Credits are only spent when the user explicitly confirms and
 * the client calls the existing `course-from-document` pipeline, whose output
 * still goes through the normal draft-review flow.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResp, requireAuth } from '../_shared/auth.ts';
import { SAFETY_SYSTEM_RULES, moderateMessage, safetyResponse, logSafetyFlag } from '../_shared/ai-safety.ts';
import { consumeCreditsOrThrow } from '../_shared/credits.ts';

/** Micro-cost per assistant exchange — deliberately tiny so it is not felt. */
const CHAT_ACTION_KEY = 'assistant_chat_message';


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
          'Propose the creation of a course/formation with the existing generation pipeline. Only call this once every slot of the course checklist is known (topic, goal, audience, depth, level, teaching style, tone, content language, illustrations).',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Short course title.' },
            prompt: {
              type: 'STRING',
              description:
                'A rich, self-contained brief for the pipeline: topic, audience, goal, tone, level, teaching style, depth and key points to cover.',
            },
            language: { type: 'STRING', description: 'Language of the GENERATED content: fr or en (may differ from the chat language).' },
            tier: { type: 'STRING', description: '"premium" when the user wants a detailed/in-depth course, "standard" for an essential course.' },
            depth: { type: 'STRING', description: 'The user own words about depth, e.g. "detailed", "essential/quick".' },
            level: { type: 'STRING', description: 'beginner, intermediate or advanced' },
            goal: { type: 'STRING', description: 'What the learner should achieve (sell, teach a skill, train a team, educate, faith, authority...).' },
            teaching_style: {
              type: 'STRING',
              description: 'How it should be taught: structured, storytelling, practical/workshop, case studies, Q&A, step-by-step... free text allowed.',
            },
            tone: { type: 'STRING', description: 'Tone of voice — free text allowed (spiritual, academic, friendly, motivational, professional...).' },
            orientation: { type: 'STRING', description: 'Content orientation/worldview inferred from the conversation (neutral, christian, muslim...).' },
            generate_images: { type: 'BOOLEAN', description: 'Generate AI illustrations per lesson (extra credits).' },
            use_document: {
              type: 'BOOLEAN',
              description: 'True when the user uploaded a document that should be converted into the course.',
            },
          },
          required: ['title', 'prompt', 'language', 'tier', 'level', 'teaching_style', 'tone'],
        },
      },
      {
        name: 'start_book_generation',
        description:
          'Propose the creation of a book / ebook with the existing writing pipeline. Only call this once every slot of the book checklist is known (topic, audience, format/style, tone, depth/length, content language).',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Short book title.' },
            prompt: { type: 'STRING', description: 'Rich brief: topic, promise, audience, angle, tone, depth, key chapters.' },
            language: { type: 'STRING', description: 'Language of the GENERATED book: fr or en (may differ from the chat language).' },
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
            depth: { type: 'STRING', description: 'The user own words about depth/length: "detailed" or "essential".' },
            chapter_count: { type: 'NUMBER', description: 'Number of chapters (6-14). Use 10-14 for a detailed book, 6-8 for a short one.' },
            use_document: { type: 'BOOLEAN', description: 'True when an uploaded document is the source.' },
          },
          required: ['title', 'prompt', 'language', 'style', 'tone', 'audience'],
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
    `Chat language: reply in ${isFr ? 'French' : 'English'}, but always mirror the language the user writes in.`,
    '',
    `CONVERSATIONAL STYLE — this is a real chat, not an intake form:`,
    `- Talk like a friendly creative partner texting a friend: short sentences, contractions, natural reactions ("Nice.", "Love that.", "Got it.").`,
    `- Open the conversation casually, e.g. "So, what do you want to do next?" — never a checklist or a menu of fields.`,
    `- React to what they just said in one short beat, THEN ask the next thing. Never fire a bare question with no reaction.`,
    `- Never say "checklist", "field", "step 1/2/3", "required", or number your questions. Never dump several questions as a bulleted list.`,
    `- Weave the missing info into the chat naturally, one thing at a time, and suggest concrete options when it helps them answer fast.`,
    `- Stay conversational all the way until they say generate; only then hand off with the tool call.`,
    '',
    `First figure out WHAT they want: a course/formation, or a book/ebook.`,
    `Ask ONE short question at a time. Never re-ask something already given or clearly implied.`,
    '',
    `YOUR INTERNAL COURSE CHECKLIST (never shown or named to the user) — every slot must be known before you propose:`,
    `1. topic  2. who it is for (audience)  3. what learners should achieve (goal)`,
    `4. DEPTH — ask plainly, e.g. "Do you want a detailed, in-depth course or a shorter essential one?" Map: detailed/in-depth/complete -> tier "premium"; essential/short/quick -> tier "standard". Never pick the tier silently.`,
    `5. level (beginner / intermediate / advanced)`,
    `6. TEACHING STYLE — ask how they want it taught (structured lessons, storytelling, practical workshop, case studies, step-by-step, Q&A...). Accept any custom answer.`,
    `7. tone — offer examples (spiritual, academic, friendly, motivational, professional) and accept any custom tone.`,
    `8. CONTENT LANGUAGE — ask which language the course itself should be written in, even if the chat is in another language ("You're writing in English — should the course be in English or French?").`,
    `9. AI illustrations per lesson (yes/no).`,
    '',
    `YOUR INTERNAL BOOK CHECKLIST (never shown or named to the user) — every slot must be known before you propose:`,
    `1. topic  2. who it is for  3. format/style (ebook, guide, story, devotional, prayers, activity, coloring...)`,
    `4. tone (custom allowed)  5. DEPTH/LENGTH — detailed (10-14 chapters) or essential (6-8 chapters)  6. CONTENT LANGUAGE, asked explicitly like for courses.`,
    '',
    `You may INFER (do not ask) the goal and the content orientation/worldview from the topic and the conversation.`,
    `If the user already gave everything in one message (often by voice), do NOT re-ask — just confirm: "Anything else to add, or should I generate?"`,
    `Group at most two tightly-related micro-questions in one message when it feels natural; otherwise one at a time.`,
    `Keep every reply under 70 words, warm and concrete. Never invent platform features.`,
    `When the checklist is complete, call "start_course_generation" (course) or "start_book_generation" (book) with a rich brief instead of writing a long plan.`,
    `Never claim the content is generated: after the tool call the user must confirm the credit cost, then they land in the normal editor/review flow.`,
    doc,
    '',
    SAFETY_SYSTEM_RULES,
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

    // ── Layer 2: independent moderation of the latest user message.
    // Runs BEFORE we surface any assistant output; its verdict overrides the model.
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const verdict = await moderateMessage({ geminiKey, text: lastUser });
    if (verdict.flagged) {
      await logSafetyFlag({
        admin,
        userId: auth.userId,
        surface: 'viral-studio-chat',
        verdict,
        text: lastUser,
        language,
      });
      return jsonResp({
        message: safetyResponse(verdict.category, language === 'fr', assistantName),
        blocked: true,
        safety_category: verdict.category,
      });
    }

    // ── Micro-debit for the exchange (tiny, silent). Never blocks on system errors.
    try {
      await consumeCreditsOrThrow({
        admin,
        userId: auth.userId,
        actionKey: CHAT_ACTION_KEY,
        tier: 'standard',
        metadata: { surface: 'viral-studio-chat' },
      });
    } catch (err) {
      if ((err as any)?.status === 402) {
        return jsonResp({ error: (err as Error).message }, 402);
      }
      console.warn('[viral-studio-chat] credit debit skipped', err);
    }


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
    // Depth is asked in plain words; premium is only chosen when the user asked for depth.
    const depthWords = String(args.depth ?? '');
    const tier =
      args.tier === 'premium' || /detail|in-?depth|profond|complet|approfond|avanc/i.test(depthWords)
        ? 'premium'
        : 'standard';
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

    const str = (v: unknown, max = 120) => String(v ?? '').trim().slice(0, max);
    const level = ['beginner', 'intermediate', 'advanced'].includes(str(args.level))
      ? str(args.level)
      : 'intermediate';
    const teachingStyle = str(args.teaching_style);
    const courseTone = str(args.tone);
    const goal = str(args.goal);
    const orientation = str(args.orientation);
    const depth = str(args.depth);

    // Same brief enrichment as the manual "Create with AI" dialog: the pipeline
    // only reads the prompt text, so every gathered slot is appended to it.
    const enrichedPrompt = isCourse
      ? [
          String(args.prompt || '').slice(0, 6000),
          goal ? `Goal: ${goal}` : '',
          level ? `Level: ${level}` : '',
          teachingStyle ? `Teaching style: ${teachingStyle}` : '',
          courseTone ? `Tone: ${courseTone}` : '',
          depth ? `Depth: ${depth}` : `Depth: ${tier === 'premium' ? 'detailed' : 'essential'}`,
          orientation ? `Worldview: ${orientation}` : '',
        ].filter(Boolean).join('\n')
      : String(args.prompt || '').slice(0, 6000);

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
          prompt: enrichedPrompt,
          language: args.language === 'en' ? 'en' : language,
          tier,
          ...(isCourse
            ? {
                level,
                teaching_style: teachingStyle || 'structured',
                tone: courseTone || 'professional',
                goal: goal || undefined,
                orientation: orientation || undefined,
                generate_images: args.generate_images === true,
              }
            : {
                style: BOOK_STYLES.includes(str(args.style)) ? str(args.style) : 'ebook',
                tone: TONES.includes(str(args.tone)) ? str(args.tone) : 'professional',
                audience: AUDIENCES.includes(str(args.audience)) ? str(args.audience) : 'general',
                chapter_count: Math.min(
                  14,
                  Math.max(6, Number(args.chapter_count) || (/detail|profond|complet|long/i.test(depth) ? 12 : 8)),
                ),
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
