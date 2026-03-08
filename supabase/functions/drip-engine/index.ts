import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Drip Engine — sends timed onboarding emails based on user signup date.
 * 
 * Schedule: Invoked hourly via pg_cron.
 * 
 * Sequences:
 *   J+0: Welcome (handled by automated-emails on signup)
 *   J+1: "Create your first product"
 *   J+3: "Your store is almost ready"
 *   J+7: "Ambassadors are waiting for you"
 *   J+14: "3 tips for your first sale" (only if no sale yet)
 */

interface DripStep {
  day: number;
  key: string;
  subject_fr: string;
  body_fr: string;
  condition?: "no_product" | "no_sale" | "no_affiliate" | null;
}

const DRIP_STEPS: DripStep[] = [
  {
    day: 1,
    key: "drip_j1_create_product",
    subject_fr: "🚀 Créez votre premier produit en 5 minutes",
    body_fr: `Bonjour {{name}},

Bienvenue sur SiteViral ! Vous avez fait le premier pas hier. Maintenant, passons à l'action.

Créer votre premier produit numérique est gratuit et prend moins de 5 minutes :

1. Ouvrez le Studio IA → https://siteviral.com/ecrire
2. Choisissez un sujet qui vous passionne
3. Laissez l'IA structurer votre contenu
4. Publiez et commencez à vendre !

💡 Astuce : les ebooks et guides pratiques se vendent le mieux sur notre plateforme.

À très vite,
L'équipe SiteViral`,
    condition: "no_product",
  },
  {
    day: 3,
    key: "drip_j3_store_ready",
    subject_fr: "🏪 Votre boutique est presque prête !",
    body_fr: `Bonjour {{name}},

Votre compte SiteViral est créé depuis 3 jours. Il ne manque plus que quelques étapes pour que votre boutique soit opérationnelle :

✅ Compte créé
{{checklist}}

Chaque étape prend moins de 2 minutes. Cliquez ici pour continuer : https://siteviral.com/admin

Des créateurs comme vous gagnent déjà de l'argent chaque jour sur SiteViral. Ne manquez pas cette opportunité !

L'équipe SiteViral`,
    condition: null,
  },
  {
    day: 7,
    key: "drip_j7_ambassadors",
    subject_fr: "🤝 Des ambassadeurs veulent promouvoir vos produits",
    body_fr: `Bonjour {{name}},

Saviez-vous que SiteViral dispose d'un réseau d'ambassadeurs prêts à promouvoir vos produits ?

Quand vous activez le programme d'affiliation, des centaines de personnes peuvent partager vos produits sur WhatsApp, Facebook et Instagram — et vous ne payez une commission que quand ils génèrent une vente.

🔥 C'est le moyen le plus rapide de multiplier vos ventes sans publicité.

Activez l'affiliation maintenant : https://siteviral.com/admin/affiliation

L'équipe SiteViral`,
    condition: "no_affiliate",
  },
  {
    day: 14,
    key: "drip_j14_first_sale_tips",
    subject_fr: "💡 3 astuces pour votre première vente",
    body_fr: `Bonjour {{name}},

Vous n'avez pas encore réalisé votre première vente ? Pas de panique — voici 3 astuces qui fonctionnent :

1. **Partagez sur WhatsApp** — Envoyez votre lien produit dans 5 groupes WhatsApp pertinents. C'est le canal #1 de ventes sur SiteViral.

2. **Ajoutez une belle couverture** — Les produits avec une image de couverture se vendent 3x plus. Utilisez le générateur IA intégré.

3. **Offrez un prix d'introduction** — Créez un code promo de lancement (-20%) pour vos premiers clients. Ça crée l'urgence.

Accédez à votre tableau de bord : https://siteviral.com/admin

L'équipe SiteViral`,
    condition: "no_sale",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    let totalSent = 0;

    for (const step of DRIP_STEPS) {
      // Find users who signed up exactly `step.day` days ago (±12h window)
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - step.day);
      const windowStart = new Date(targetDate.getTime() - 12 * 60 * 60 * 1000).toISOString();
      const windowEnd = new Date(targetDate.getTime() + 12 * 60 * 60 * 1000).toISOString();

      // Get eligible users
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, display_name, email")
        .gte("created_at", windowStart)
        .lte("created_at", windowEnd)
        .limit(200);

      if (!profiles || profiles.length === 0) continue;

      for (const profile of profiles) {
        if (!profile.email) continue;

        // Check if this drip was already sent
        const { data: existing } = await sb
          .from("email_logs")
          .select("id")
          .eq("recipient", profile.email)
          .eq("template", step.key)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Apply conditions
        if (step.condition === "no_product") {
          const { count } = await sb
            .from("digital_products")
            .select("*", { count: "exact", head: true })
            .eq("created_by", profile.id);
          if ((count || 0) > 0) continue;
        }

        if (step.condition === "no_sale") {
          const { count } = await sb
            .from("product_purchases")
            .select("*", { count: "exact", head: true })
            .eq("status", "completed")
            .in("product_id", 
              (await sb.from("digital_products").select("id").eq("created_by", profile.id)).data?.map((p: any) => p.id) || []
            );
          if ((count || 0) > 0) continue;
        }

        if (step.condition === "no_affiliate") {
          // Check if org has affiliation enabled
          const { data: orgs } = await sb
            .from("organizations")
            .select("affiliation_enabled")
            .eq("owner_id", profile.id);
          const hasAffiliation = orgs?.some((o: any) => o.affiliation_enabled);
          if (hasAffiliation) continue;
        }

        // Build email body
        const name = profile.display_name || "cher(e) utilisateur(rice)";
        const body = step.body_fr.replace(/\{\{name\}\}/g, name);

        // Send via send-email edge function
        try {
          await sb.functions.invoke("send-email", {
            body: {
              to: profile.email,
              subject: step.subject_fr,
              html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6">${body.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</div>`,
              template: step.key,
            },
          });

          // Log the email
          await sb.from("email_logs").insert({
            recipient: profile.email,
            template: step.key,
            subject: step.subject_fr,
            status: "sent",
          });

          totalSent++;
        } catch (emailErr) {
          console.error(`[drip-engine] Failed to send ${step.key} to ${profile.email}:`, emailErr);
          await sb.from("email_logs").insert({
            recipient: profile.email,
            template: step.key,
            subject: step.subject_fr,
            status: "failed",
            error_message: String(emailErr),
          });
        }
      }
    }

    console.log(`[drip-engine] Sent ${totalSent} drip emails`);

    return new Response(JSON.stringify({ ok: true, sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[drip-engine] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
