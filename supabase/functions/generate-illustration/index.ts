import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const artStylePrompts: Record<string, string> = {
  children_book: 'children book illustration style, warm colors, friendly characters, soft lighting, storybook feel, gentle and inviting',
  watercolor: 'watercolor painting style, soft washes of color, artistic and elegant, fluid brushstrokes, delicate details',
  cartoon: 'modern cartoon illustration, bold colors, clean lines, fun and engaging, digital art style',
  realistic: 'realistic digital painting, detailed and lifelike, professional book illustration, rich colors and lighting',
  line_art: 'black and white line art for coloring book, clean bold outlines only, NO shading NO fills NO colors NO gradients, thick black contour lines on pure white background, simple shapes suitable for coloring with crayons or markers, large areas to color in, children-friendly coloring page design',
};

const audiencePrompts: Record<string, string> = {
  children: 'age-appropriate for children 6-12 years old, safe and friendly imagery, no scary elements',
  teens: 'suitable for teenagers, modern and dynamic',
  general: 'suitable for all audiences',
  adults: 'sophisticated and mature illustration',
  seniors: 'warm and classic illustration style',
  professionals: 'clean professional illustration',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { bookTitle, chapterTitle, chapterSummary, artStyle, audience, bookStyle } = await req.json();

    if (!chapterTitle) {
      return new Response(JSON.stringify({ error: 'chapterTitle required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stylePrompt = artStylePrompts[artStyle] || artStylePrompts['children_book'];
    const audiencePrompt = audiencePrompts[audience] || audiencePrompts['general'];

    const isColoring = artStyle === 'line_art' || bookStyle === 'coloring';

    const prompt = isColoring
      ? `Create a coloring book page. BLACK AND WHITE LINE ART ONLY.

Book: "${bookTitle || 'Untitled'}"
Page theme: "${chapterTitle}"
Context: ${chapterSummary || chapterTitle}

CRITICAL RULES:
- ONLY black outlines on pure white background
- NO shading, NO fills, NO gray tones, NO colors
- Bold clean contour lines (2-3px thickness)
- Large enclosed areas for children to color in
- Simple, recognizable shapes
- ${audiencePrompt}
- Fun and engaging composition
- NO text in the image
- Style: professional coloring book page, print-ready quality`
      : `Create a beautiful illustration for a book chapter.

Book: "${bookTitle || 'Untitled'}"
Chapter: "${chapterTitle}"
Context: ${chapterSummary || chapterTitle}

Style: ${stylePrompt}
Audience: ${audiencePrompt}

Create a single, captivating illustration that represents the key theme of this chapter. No text in the image. High quality, professional book illustration.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    let aiRes: Response;
    try {
      aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-image-preview',
          messages: [{ role: 'user', content: prompt }],
          modalities: ['image', 'text'],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return new Response(JSON.stringify({ error: 'Generation timeout. Please retry.' }), {
          status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit. Please retry.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await aiRes.text();
      console.error('AI gateway error:', aiRes.status, errText);
      return new Response(JSON.stringify({ error: `AI error (${aiRes.status})` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return new Response(JSON.stringify({ error: 'No image generated' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upload the base64 image to Supabase storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Convert base64 to Uint8Array
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = `illustrations/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.png`;
    const { error: uploadError } = await sb.storage
      .from('org-uploads')
      .upload(fileName, bytes, { contentType: 'image/png', upsert: false });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Fallback: return the base64 data directly
      return new Response(JSON.stringify({ imageUrl: imageData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: publicUrlData } = sb.storage.from('org-uploads').getPublicUrl(fileName);

    return new Response(JSON.stringify({ imageUrl: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-illustration error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
