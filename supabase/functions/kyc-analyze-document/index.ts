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
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    ).auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    const { submission_id, doc_front_url, doc_back_url, selfie_url, selfie_with_doc_url, doc_type } = await req.json();
    if (!submission_id && !doc_front_url) throw new Error("Missing required fields");

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    // Helper to get signed URL for private bucket images
    async function getAccessibleUrl(url: string): Promise<string> {
      if (!url) return "";
      // If it's already a data URL or public URL, use as-is
      if (url.startsWith("data:") || !url.includes("/kyc-documents/")) return url;
      
      // Extract path from URL
      const pathMatch = url.match(/kyc-documents\/(.+)$/);
      if (!pathMatch) return url;
      
      const { data } = await supabase.storage
        .from("kyc-documents")
        .createSignedUrl(pathMatch[1], 300); // 5 min
      return data?.signedUrl || url;
    }

    // Get accessible URLs for all documents
    const [frontUrl, backUrl, selfieAccessUrl, selfieDocUrl] = await Promise.all([
      getAccessibleUrl(doc_front_url || ""),
      getAccessibleUrl(doc_back_url || ""),
      getAccessibleUrl(selfie_url || ""),
      getAccessibleUrl(selfie_with_doc_url || ""),
    ]);

    // Build multi-image analysis prompt
    const imageContents: any[] = [];
    
    if (frontUrl) {
      imageContents.push(
        { type: "text", text: "=== DOCUMENT FRONT ===" },
        { type: "image_url", image_url: { url: frontUrl } }
      );
    }
    if (backUrl) {
      imageContents.push(
        { type: "text", text: "=== DOCUMENT BACK ===" },
        { type: "image_url", image_url: { url: backUrl } }
      );
    }
    if (selfieAccessUrl) {
      imageContents.push(
        { type: "text", text: "=== SELFIE ===" },
        { type: "image_url", image_url: { url: selfieAccessUrl } }
      );
    }
    if (selfieDocUrl) {
      imageContents.push(
        { type: "text", text: "=== SELFIE WITH DOCUMENT ===" },
        { type: "image_url", image_url: { url: selfieDocUrl } }
      );
    }

    const systemPrompt = `You are an expert identity verification AI analyst. You analyze identity documents (national ID cards, passports, driver's licenses) for a KYC/KYB compliance platform.

Your job is to:
1. **OCR**: Extract all readable text from the document (name, date of birth, document number, expiry date, nationality, etc.)
2. **Quality Check**: Assess photo quality (blur, lighting, glare, cropping, readability)
3. **Face Matching**: Compare the face on the ID document with the selfie and the selfie-with-document photo
4. **Fraud Detection**: Look for signs of tampering, digital editing, screenshots, photocopies, expired documents, inconsistencies

You MUST respond using the provided tool schema. Be thorough but fair. Score from 0-100.`;

    const analysisPrompt = `Analyze this ${doc_type || "identity document"} submission for KYC verification.

Images provided:
- Document front (required)
${backUrl ? "- Document back" : ""}
${selfieAccessUrl ? "- Selfie of the person" : ""}
${selfieDocUrl ? "- Selfie holding the document" : ""}

Perform full analysis: OCR extraction, quality assessment, face comparison, and fraud detection.
Respond in French for all human-readable fields (quality_summary, fraud_notes, recommendations).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [...imageContents, { type: "text", text: analysisPrompt }] },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_kyc_analysis",
              description: "Submit the complete KYC document analysis results",
              parameters: {
                type: "object",
                properties: {
                  confidence_score: {
                    type: "number",
                    description: "Overall confidence score 0-100. 90+ = very confident, 70-89 = acceptable, 50-69 = needs review, <50 = suspicious"
                  },
                  ocr_data: {
                    type: "object",
                    description: "Extracted text from the document",
                    properties: {
                      full_name: { type: "string", description: "Full name on the document" },
                      date_of_birth: { type: "string", description: "Date of birth (DD/MM/YYYY)" },
                      document_number: { type: "string", description: "Document ID number" },
                      expiry_date: { type: "string", description: "Expiry date if visible" },
                      nationality: { type: "string", description: "Nationality or country" },
                      gender: { type: "string", description: "Gender if visible" },
                      issue_date: { type: "string", description: "Issue date if visible" },
                      issuing_authority: { type: "string", description: "Issuing authority if visible" },
                      address: { type: "string", description: "Address if visible" },
                      other_fields: { type: "object", description: "Any other extracted fields" }
                    },
                    required: ["full_name"]
                  },
                  quality_assessment: {
                    type: "object",
                    properties: {
                      doc_front_quality: { type: "string", enum: ["excellent", "good", "acceptable", "poor", "unreadable"], description: "Front photo quality" },
                      doc_back_quality: { type: "string", enum: ["excellent", "good", "acceptable", "poor", "unreadable", "not_provided"], description: "Back photo quality" },
                      selfie_quality: { type: "string", enum: ["excellent", "good", "acceptable", "poor", "not_provided"], description: "Selfie quality" },
                      selfie_with_doc_quality: { type: "string", enum: ["excellent", "good", "acceptable", "poor", "not_provided"], description: "Selfie with doc quality" },
                      issues: { type: "array", items: { type: "string" }, description: "List of quality issues found (in French)" }
                    },
                    required: ["doc_front_quality", "issues"]
                  },
                  face_match: {
                    type: "object",
                    properties: {
                      id_vs_selfie: { type: "string", enum: ["match", "likely_match", "uncertain", "mismatch", "not_available"], description: "Face comparison between ID photo and selfie" },
                      id_vs_selfie_with_doc: { type: "string", enum: ["match", "likely_match", "uncertain", "mismatch", "not_available"], description: "Face comparison between ID and selfie-with-doc" },
                      notes: { type: "string", description: "Face matching notes (in French)" }
                    },
                    required: ["id_vs_selfie"]
                  },
                  fraud_detection: {
                    type: "object",
                    properties: {
                      risk_level: { type: "string", enum: ["none", "low", "medium", "high", "critical"], description: "Overall fraud risk" },
                      flags: { type: "array", items: { type: "string" }, description: "Fraud flags detected (in French)" },
                      is_screenshot: { type: "boolean", description: "Whether document appears to be a screenshot" },
                      is_photocopy: { type: "boolean", description: "Whether document appears to be a photocopy" },
                      is_expired: { type: "boolean", description: "Whether document appears expired" },
                      tampering_detected: { type: "boolean", description: "Whether digital tampering is detected" }
                    },
                    required: ["risk_level", "flags"]
                  },
                  quality_summary: { type: "string", description: "Brief human-readable summary in French" },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Recommended actions for the reviewer (in French)"
                  }
                },
                required: ["confidence_score", "ocr_data", "quality_assessment", "face_match", "fraud_detection", "quality_summary", "recommendations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "submit_kyc_analysis" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants pour l'analyse IA." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured analysis");
    }

    let analysis: any;
    try {
      analysis = typeof toolCall.function.arguments === "string" 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
    } catch {
      throw new Error("Failed to parse AI analysis");
    }

    // Store analysis results in kyc_submissions if submission_id provided
    if (submission_id) {
      await supabase.from("kyc_submissions").update({
        ai_confidence_score: analysis.confidence_score,
        ai_ocr_data: analysis.ocr_data,
        ai_quality_assessment: analysis.quality_assessment,
        ai_face_match: analysis.face_match,
        ai_fraud_detection: analysis.fraud_detection,
        ai_summary: analysis.quality_summary,
        ai_recommendations: analysis.recommendations,
        ai_analyzed_at: new Date().toISOString(),
      }).eq("id", submission_id);
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "kyc.ai_analysis",
      resource_type: "kyc_submission",
      resource_id: submission_id || "direct",
      metadata: {
        confidence_score: analysis.confidence_score,
        fraud_risk: analysis.fraud_detection?.risk_level,
        face_match: analysis.face_match?.id_vs_selfie,
      },
    });

    // Auto-notify superadmins on low score or fraud flags
    const isHighRisk = analysis.confidence_score < 50 ||
      analysis.fraud_detection?.risk_level === 'high' ||
      analysis.fraud_detection?.risk_level === 'critical' ||
      analysis.fraud_detection?.tampering_detected ||
      analysis.fraud_detection?.is_screenshot;

    if (isHighRisk && submission_id) {
      // Get org name for context
      const orgName = submission_id ? await (async () => {
        const { data: sub } = await supabase.from("kyc_submissions")
          .select("organization_id, organizations!left(name)")
          .eq("id", submission_id).single();
        return (sub?.organizations as any)?.name || "Inconnue";
      })() : "Inconnue";

      // Get all superadmin user IDs
      const { data: superadmins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (superadmins && superadmins.length > 0) {
        const alerts = superadmins.map((sa: any) => ({
          user_id: sa.user_id,
          title: `🚨 Alerte vérification – Score ${analysis.confidence_score}%`,
          body: `La soumission KYC de "${orgName}" a un score IA de ${analysis.confidence_score}% avec risque ${analysis.fraud_detection?.risk_level || 'inconnu'}. Vérification manuelle recommandée.`,
          notification_type: "kyc_fraud_alert",
          action_url: "/superadmin/kyc",
        }));
        await supabase.from("user_notifications").insert(alerts);
      }
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("kyc-analyze error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
