import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { module_id, program_id, course_title, module_title, language, question_count, tier } = await req.json();

    // Fetch lesson content for context
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    const { data: lessons } = await admin.from("program_lessons")
      .select("title, content")
      .eq("module_id", module_id)
      .order("display_order", { ascending: true });

    const lessonContext = (lessons || [])
      .map((l: any) => `### ${l.title}\n${(l.content || "").replace(/<[^>]+>/g, " ").slice(0, 1500)}`)
      .join("\n\n");

    // Premium tier gets 15-20 questions, standard gets 10
    const isPremium = tier === 'premium';
    const defaultCount = isPremium ? 18 : 10;
    const count = question_count || defaultCount;
    const LANG_MAP: Record<string, string> = { fr: 'French', en: 'English', es: 'Spanish', pt: 'Portuguese', ar: 'Arabic', sw: 'Swahili' };
    const lang = LANG_MAP[language] || LANG_MAP['fr'];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        tools: [{
          type: "function",
          function: {
            name: "generate_quiz",
            description: "Generate quiz questions for a training module",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      question_type: { type: "string", enum: ["mcq", "true_false", "fill_blank"] },
                      options: { type: "array", items: { type: "string" } },
                      correct_index: { type: "integer" },
                      correct_text: { type: "string" },
                      explanation: { type: "string" },
                    },
                    required: ["question", "question_type", "correct_index", "explanation"],
                  },
                },
              },
              required: ["questions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_quiz" } },
        messages: [
          {
            role: "system",
            content: `You are a professional quiz generator for online courses. Generate exactly ${count} questions in ${lang}. Mix question types: mostly MCQ (70%), some true/false (20%), and fill-in-the-blank (10%). Each MCQ must have 4 options. For true_false, options should be ["True","False"] or ["Vrai","Faux"]. For fill_blank, set correct_text to the answer. Always provide a brief explanation.`,
          },
          {
            role: "user",
            content: `Course: ${course_title}\nModule: ${module_title}\n\nLesson content:\n${lessonContext.slice(0, 8000)}\n\nGenerate ${count} quiz questions based on this content.`,
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI generation failed");
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const { questions } = JSON.parse(toolCall.function.arguments);

    // Get or create quiz for this module
    let { data: quiz } = await admin.from("program_quizzes")
      .select("id")
      .eq("module_id", module_id)
      .maybeSingle();

    if (!quiz) {
      const { data: newQuiz } = await admin.from("program_quizzes")
        .insert({ module_id, title: `Quiz - ${module_title}`, passing_score: 60, quiz_type: "module_end" })
        .select("id")
        .single();
      quiz = newQuiz;
    }

    if (!quiz) throw new Error("Failed to create quiz");

    // Get existing question count for ordering
    const { data: existing } = await admin.from("quiz_questions").select("id").eq("quiz_id", quiz.id);
    const startOrder = (existing || []).length;

    // Insert questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await admin.from("quiz_questions").insert({
        quiz_id: quiz.id,
        question: q.question,
        question_type: q.question_type || "mcq",
        options: q.options || [],
        correct_index: q.correct_index || 0,
        correct_text: q.correct_text || null,
        explanation: q.explanation || null,
        display_order: startOrder + i,
      });
    }

    return new Response(JSON.stringify({ ok: true, count: questions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
