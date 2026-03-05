import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // --- Auth ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError('Unauthorized', 401);
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonError('Unauthorized', 401);

    const { policy_profile_id, content_text, params } = await req.json();
    if (!policy_profile_id) return jsonError('policy_profile_id required', 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // --- Load policy ---
    const { data: policy, error: polErr } = await admin
      .from('ai_policy_profiles')
      .select('*')
      .eq('id', policy_profile_id)
      .single();

    if (polErr || !policy) return jsonError('Policy profile not found', 404);

    const rules = policy.rules_json || {};
    const flags: string[] = [];
    const reasons: string[] = [];
    const textToCheck = ((content_text || '') + ' ' + JSON.stringify(params || {})).toLowerCase();

    // --- Banned words ---
    if (rules.banned_words && Array.isArray(rules.banned_words)) {
      for (const word of rules.banned_words) {
        if (textToCheck.includes(word.toLowerCase())) {
          flags.push(`banned_word:${word}`);
          reasons.push(`Contient le mot interdit: ${word}`);
        }
      }
    }

    // --- Kids safety (violence) ---
    if (rules.max_violence === 0) {
      const violenceWords = ['violence', 'sang', 'mort', 'tuer', 'arme', 'blood', 'kill', 'murder', 'weapon', 'gun', 'knife'];
      for (const w of violenceWords) {
        if (textToCheck.includes(w)) {
          flags.push('kids_safety:violence');
          reasons.push('Contenu contenant des termes liés à la violence');
          break;
        }
      }
    }

    // --- Kids safety (sexual) ---
    if (rules.max_sexual === 0) {
      const sexualWords = ['sexuel', 'sexual', 'nude', 'nudité', 'explicit', 'pornograph'];
      for (const w of sexualWords) {
        if (textToCheck.includes(w)) {
          flags.push('kids_safety:sexual');
          reasons.push('Contenu inapproprié pour les enfants');
          break;
        }
      }
    }

    // --- Kids safety (horror) ---
    if (rules.max_horror === 0) {
      const horrorWords = ['horreur', 'horror', 'terreur', 'cauchemar', 'nightmare', 'demon', 'démon', 'zombie'];
      for (const w of horrorWords) {
        if (textToCheck.includes(w)) {
          flags.push('kids_safety:horror');
          reasons.push('Contenu effrayant détecté');
          break;
        }
      }
    }

    // --- Religious sensitivity ---
    if (rules.no_blasphemy) {
      const blasphemyWords = ['blasphème', 'blasphemy', 'hérésie', 'heresy'];
      for (const w of blasphemyWords) {
        if (textToCheck.includes(w)) {
          flags.push('religious:blasphemy');
          reasons.push('Contenu potentiellement blasphématoire détecté');
          break;
        }
      }
    }

    // --- No hate speech ---
    if (rules.no_hate_speech) {
      const hateWords = ['racisme', 'racism', 'haine', 'hate', 'discrimination', 'xenophob'];
      for (const w of hateWords) {
        if (textToCheck.includes(w)) {
          flags.push('safety:hate_speech');
          reasons.push('Contenu potentiellement haineux détecté');
          break;
        }
      }
    }

    // --- Age-appropriate language ---
    if (rules.age_appropriate_language) {
      const adultWords = ['alcool', 'alcohol', 'drogue', 'drug', 'tabac', 'cigarette', 'cannabis'];
      for (const w of adultWords) {
        if (textToCheck.includes(w)) {
          flags.push('kids_safety:adult_themes');
          reasons.push('Thème adulte détecté dans un contenu enfant');
          break;
        }
      }
    }

    const allowed = flags.length === 0;

    return new Response(JSON.stringify({
      allowed,
      flags,
      reasons,
      policy_name: policy.name,
      requires_human_review: policy.requires_human_review,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('ai-policy-check error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
