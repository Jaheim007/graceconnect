import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTION_KEY = 'ai_module_flashcards';

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { module_id, module_title, course_title, language, tier, card_count } = await req.json();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const creditTier = normalizeTier(tier);

    // Fetch lesson content for context
    const { data: lessons } = await admin.from("program_lessons")
      .select("title, content")
      .eq("module_id", module_id)
      .order("display_order", { ascending: true });

    const lessonContext = (lessons || [])
      .map((l: any) => `### ${l.title}\n${(l.content || "").replace(/<[^>]+>/g, " ").slice(0, 1500)}`)
      .join("\n\n");

    const count = card_count || (creditTier === 'premium' ? 15 : 8);
    const LANG_MAP: Record<string, string> = { fr: 'French', en: 'English', es: 'Spanish', pt: 'Portuguese', ar: 'Arabic', sw: 'Swahili' };
    const lang = LANG_MAP[language] || LANG_MAP['fr'];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const result = await consumeCreditsWithRefund({
      admin,
      userId: user.id,
      actionKey: ACTION_KEY,
      tier: creditTier,
      idempotencyKey: `flashcards-${module_id}-${Date.now()}`,
      metadata: { module_id, module_title, tier: creditTier },
      action: async () => {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            tools: [{
              type: "function",
              function: {
                name: "generate_flashcards",
                description: "Generate flashcards for a training module",
                parameters: {
                  type: "object",
                  properties: {
                    flashcards: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          front_text: { type: "string", description: "Question or term (front of card)" },
                          back_text: { type: "string", description: "Answer or definition (back of card)" },
                        },
                        required: ["front_text", "back_text"],
                      },
                    },
                  },
                  required: ["flashcards"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "generate_flashcards" } },
            messages: [
              {
                role: "system",
                content: `You are a professional flashcard generator for online courses. Generate exactly ${count} flashcards in ${lang}. Each flashcard should have a clear, concise question/term on the front and a comprehensive answer/definition on the back. Focus on key concepts, definitions, and important facts from the lesson content. Make them useful for memorization and review.`,
              },
              {
                role: "user",
                content: `Course: ${course_title}\nModule: ${module_title}\n\nLesson content:\n${lessonContext.slice(0, 8000)}\n\nGenerate ${count} flashcards based on this content.`,
              },
            ],
          }),
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error("AI error:", aiResp.status, errText);
          if (aiResp.status === 429) throw new Error("Rate limited, try again later");
          if (aiResp.status === 402) throw new Error("Credits exhausted");
          throw new Error("AI generation failed");
        }

        const aiData = await aiResp.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) throw new Error("No tool call in response");

        const { flashcards } = JSON.parse(toolCall.function.arguments);

        // Get existing flashcard count for ordering
        const { data: existing } = await admin.from("module_flashcards").select("id").eq("module_id", module_id);
        const startOrder = (existing || []).length;

        // Insert flashcards
        for (let i = 0; i < flashcards.length; i++) {
          const fc = flashcards[i];
          await admin.from("module_flashcards").insert({
            module_id,
            front_text: fc.front_text,
            back_text: fc.back_text,
            display_order: startOrder + i,
          });
        }

        return { count: flashcards.length };
      },
    });

    return new Response(JSON.stringify({ ok: true, ...(result as any) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Error:", e);
    const status = (e as any).status || 500;
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
