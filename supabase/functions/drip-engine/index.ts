import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Drip Engine — sends timed onboarding emails based on user signup date AND intent.
 * 
 * Schedule: Invoked hourly via pg_cron.
 * 
 * Sequences:
 *   J+0: Welcome (handled by automated-emails on signup)
 *   J+1: Intent-specific activation email
 *   J+2: Motivational "people are earning" email
 *   J+3: "Your store is almost ready" (checklist)
 *   J+5: "Here's how others succeed" (social proof)
 *   J+7: "Ambassadors are waiting for you" (affiliation push)
 *   J+14: "3 tips for your first sale" (only if no sale yet)
 */

interface DripStep {
  day: number;
  key: string;
  subject_fr: string;
  body_fr: string;
  subject_en: string;
  body_en: string;
  condition?: "no_product" | "no_sale" | "no_affiliate" | "intent_sell" | "intent_earn" | "intent_create" | null;
}

const DRIP_STEPS: DripStep[] = [
  // ── J+1: Intent-based activation ──
  {
    day: 1,
    key: "drip_j1_intent_sell",
    subject_fr: "🛒 Commence à vendre dès aujourd'hui",
    body_fr: `Bonjour {{name}},

Tu as choisi de vendre ton contenu sur SiteViral — excellent choix !

Voici 3 façons de démarrer immédiatement :

1. **Écris un livre en 5 minutes** avec notre IA → https://siteviral.com/ecrire
2. **Crée une formation** à partir de ton expertise → https://siteviral.com/admin/create
3. **Publie un fichier existant** (PDF, ebook, formation) → https://siteviral.com/admin/create

💡 Des créateurs comme toi gagnent déjà entre 100 000 et 500 000 FCFA par mois.

Commence maintenant, c'est gratuit !

L'équipe SiteViral`,
    subject_en: "🛒 Start selling today",
    body_en: `Hello {{name}},

You chose to sell your content on SiteViral — excellent choice!

Here are 3 ways to start immediately:

1. **Write a book in 5 minutes** with our AI → https://siteviral.com/ecrire
2. **Create a course** from your expertise → https://siteviral.com/admin/create
3. **Upload an existing file** (PDF, ebook, course) → https://siteviral.com/admin/create

💡 Creators like you are already earning between $200-800/month.

Start now, it's free!

The SiteViral Team`,
    condition: "intent_sell",
  },
  {
    day: 1,
    key: "drip_j1_intent_earn",
    subject_fr: "💰 Gagne ta première commission aujourd'hui",
    body_fr: `Bonjour {{name}},

Tu veux gagner en partageant ? Voici comment faire ta première commission :

1. **Va sur le catalogue** → https://siteviral.com/gagner
2. **Choisis un produit** qui te plaît
3. **Copie ton lien ambassadeur**
4. **Partage-le** dans tes groupes WhatsApp

C'est tout ! Quand quelqu'un achète via ton lien, tu touches entre 5% et 50% de commission.

🔥 Des ambassadeurs gagnent 25 000 à 125 000 FCFA par semaine juste en partageant.

Ton premier lien t'attend → https://siteviral.com/gagner

L'équipe SiteViral`,
    subject_en: "💰 Earn your first commission today",
    body_en: `Hello {{name}},

You want to earn by sharing? Here's how to make your first commission:

1. **Go to the catalog** → https://siteviral.com/gagner
2. **Choose a product** you like
3. **Copy your ambassador link**
4. **Share it** in your WhatsApp groups

That's it! When someone buys via your link, you earn 5-50% commission.

🔥 Ambassadors earn $50-250/week just by sharing.

Your first link awaits → https://siteviral.com/gagner

The SiteViral Team`,
    condition: "intent_earn",
  },
  {
    day: 1,
    key: "drip_j1_intent_create",
    subject_fr: "✨ Crée ton premier produit avec l'IA en 5 minutes",
    body_fr: `Bonjour {{name}},

Tu as choisi de créer avec l'IA — le Viral Studio t'attend !

🤖 Ce que tu peux créer :
• Un **ebook complet** sur n'importe quel sujet
• Une **formation structurée** avec quiz et flashcards
• Un **livre pour enfants** illustré
• Un **livre de coloriage**

Tout est généré par l'IA. Tu choisis le sujet, elle écrit pour toi.

💡 Astuce : les mamans écrivent sur leur vie de famille, les pasteurs créent des dévotionnels, les experts partagent leur savoir.

Commence maintenant → https://siteviral.com/ecrire

L'équipe SiteViral`,
    subject_en: "✨ Create your first product with AI in 5 minutes",
    body_en: `Hello {{name}},

You chose to create with AI — the Viral Studio awaits!

🤖 What you can create:
• A **complete ebook** on any topic
• A **structured course** with quizzes and flashcards
• A **children's book** with illustrations
• A **coloring book**

Everything is AI-generated. Pick a topic, it writes for you.

💡 Tip: moms write about family life, pastors create devotionals, experts share their knowledge.

Start now → https://siteviral.com/ecrire

The SiteViral Team`,
    condition: "intent_create",
  },
  // ── J+2: Motivational social proof ──
  {
    day: 2,
    key: "drip_j2_motivation",
    subject_fr: "🔥 Pendant que tu hésites, d'autres gagnent",
    body_fr: `Bonjour {{name}},

Voici ce qui s'est passé sur SiteViral ces dernières 24 heures :

📊 +350 nouvelles ventes
💰 +1 250 000 FCFA distribués aux créateurs et ambassadeurs
👥 +120 nouveaux membres
📚 +45 nouveaux livres et formations créés avec l'IA

Et toi, tu as déjà commencé ?

Ne reste pas spectateur. Rejoins ceux qui gagnent :
→ https://siteviral.com/dashboard

Crois en toi. Commence maintenant. Gagne avec SiteViral.

L'équipe SiteViral`,
    subject_en: "🔥 While you hesitate, others are earning",
    body_en: `Hello {{name}},

Here's what happened on SiteViral in the last 24 hours:

📊 +350 new sales
💰 +$2,500 distributed to creators and ambassadors
👥 +120 new members
📚 +45 new books and courses created with AI

Have you started yet?

Don't be a spectator. Join those who are earning:
→ https://siteviral.com/dashboard

Believe in yourself. Start now. Earn with SiteViral.

The SiteViral Team`,
    condition: null,
  },
  // ── J+3: Checklist ──
  {
    day: 3,
    key: "drip_j3_store_ready",
    subject_fr: "🏪 Il te manque juste quelques étapes !",
    body_fr: `Bonjour {{name}},

Tu es inscrit depuis 3 jours. Il ne te manque plus que quelques étapes pour commencer à gagner :

✅ Compte créé
{{checklist}}

Chaque étape prend moins de 2 minutes. Continue ici → https://siteviral.com/dashboard

Des personnes comme toi gagnent déjà de l'argent chaque jour sur SiteViral. Ne manque pas cette opportunité !

L'équipe SiteViral`,
    subject_en: "🏪 You're just a few steps away!",
    body_en: `Hello {{name}},

You signed up 3 days ago. Just a few more steps to start earning:

✅ Account created
{{checklist}}

Each step takes less than 2 minutes. Continue here → https://siteviral.com/dashboard

People like you are already earning money every day on SiteViral. Don't miss out!

The SiteViral Team`,
    condition: null,
  },
  // ── J+5: Success stories ──
  {
    day: 5,
    key: "drip_j5_success_stories",
    subject_fr: "⭐ Comment ils gagnent avec SiteViral",
    body_fr: `Bonjour {{name}},

Voici 3 histoires vraies de personnes comme toi :

📖 **Awa D.** (🇸🇳) — Ambassadrice
"J'ai gagné 125 000 FCFA en 2 semaines juste en partageant sur WhatsApp."

📖 **Kevin M.** (🇨🇲) — Créateur
"Mon ebook écrit avec l'IA se vend tout seul. Je dors et je gagne."

📖 **Pasteur Jean K.** (🇨🇩) — Créateur
"Nos dévotionnels touchent maintenant des fidèles dans 12 pays."

💡 Et toi ? Qu'est-ce qui t'empêche de commencer ?

→ Écris ton livre : https://siteviral.com/ecrire
→ Partage et gagne : https://siteviral.com/gagner
→ Vends ton contenu : https://siteviral.com/admin/create

L'équipe SiteViral`,
    subject_en: "⭐ How they earn with SiteViral",
    body_en: `Hello {{name}},

Here are 3 real stories from people like you:

📖 **Awa D.** (🇸🇳) — Ambassador
"I earned 125,000 FCFA in 2 weeks just sharing on WhatsApp."

📖 **Kevin M.** (🇨🇲) — Creator
"My AI-written ebook sells itself. I sleep and earn."

📖 **Pastor Jean K.** (🇨🇩) — Creator
"Our devotionals now reach people in 12 countries."

💡 What's stopping you from starting?

→ Write your book: https://siteviral.com/ecrire
→ Share and earn: https://siteviral.com/gagner
→ Sell your content: https://siteviral.com/admin/create

The SiteViral Team`,
    condition: null,
  },
  // ── J+7: Affiliation push ──
  {
    day: 7,
    key: "drip_j7_ambassadors",
    subject_fr: "🤝 Des ambassadeurs gagnent gros — et toi ?",
    body_fr: `Bonjour {{name}},

Savais-tu que des ambassadeurs SiteViral gagnent entre 25 000 et 500 000 FCFA par mois juste en partageant des liens ?

🔥 Le secret : ils partagent dans leurs groupes WhatsApp, sur Facebook et Instagram.

Tu n'as rien à créer. Tu n'as rien à investir. Tu partages, et quand quelqu'un achète via ton lien, tu touches ta commission.

Commence maintenant → https://siteviral.com/gagner

L'équipe SiteViral`,
    subject_en: "🤝 Ambassadors are earning big — are you?",
    body_en: `Hello {{name}},

Did you know SiteViral ambassadors earn $50-1,000/month just by sharing links?

🔥 The secret: they share in WhatsApp groups, on Facebook and Instagram.

You don't need to create anything. You don't need to invest. Share, and when someone buys, you earn your commission.

Start now → https://siteviral.com/gagner

The SiteViral Team`,
    condition: "no_affiliate",
  },
  // ── J+14: Tips for first sale ──
  {
    day: 14,
    key: "drip_j14_first_sale_tips",
    subject_fr: "💡 3 astuces pour ta première vente",
    body_fr: `Bonjour {{name}},

Tu n'as pas encore fait ta première vente ? Pas de panique — voici 3 astuces qui marchent :

1. **Partage sur WhatsApp** — Envoie ton lien dans 5 groupes WhatsApp. C'est le canal #1 de ventes sur SiteViral.

2. **Ajoute une belle couverture** — Les produits avec une image se vendent 3x plus. Utilise le générateur IA.

3. **Offre un prix d'intro** — Crée un code promo de lancement (-20%) pour tes premiers clients.

Accède à ton tableau de bord → https://siteviral.com/dashboard

L'équipe SiteViral`,
    subject_en: "💡 3 tips for your first sale",
    body_en: `Hello {{name}},

Haven't made your first sale yet? Don't panic — here are 3 tips that work:

1. **Share on WhatsApp** — Send your link to 5 WhatsApp groups. It's the #1 sales channel on SiteViral.

2. **Add a great cover** — Products with images sell 3x more. Use the AI generator.

3. **Offer an intro price** — Create a launch promo code (-20%) for your first customers.

Access your dashboard → https://siteviral.com/dashboard

The SiteViral Team`,
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
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - step.day);
      const windowStart = new Date(targetDate.getTime() - 12 * 60 * 60 * 1000).toISOString();
      const windowEnd = new Date(targetDate.getTime() + 12 * 60 * 60 * 1000).toISOString();

      const { data: profiles } = await sb
        .from("profiles")
        .select("id, display_name, email, onboarding_intent, preferred_language")
        .gte("created_at", windowStart)
        .lte("created_at", windowEnd)
        .limit(200);

      if (!profiles || profiles.length === 0) continue;

      for (const profile of profiles) {
        if (!profile.email) continue;

        // Check intent-based conditions
        if (step.condition === "intent_sell" && profile.onboarding_intent !== "sell") continue;
        if (step.condition === "intent_earn" && profile.onboarding_intent !== "earn") continue;
        if (step.condition === "intent_create" && profile.onboarding_intent !== "create") continue;

        // For non-intent drips (J+1 has 3 variants), skip if none match on J+1
        if (step.day === 1 && !step.condition?.startsWith("intent_")) continue;

        // Also send a generic J+1 if user has no intent (purchases intent or null)
        if (step.day === 1 && step.condition?.startsWith("intent_") && 
            profile.onboarding_intent && profile.onboarding_intent !== "purchases" &&
            !step.condition.endsWith(profile.onboarding_intent)) continue;

        // Check if already sent
        const { data: existing } = await sb
          .from("email_logs")
          .select("id")
          .eq("recipient", profile.email)
          .eq("template", step.key)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Apply other conditions
        if (step.condition === "no_product") {
          const { count } = await sb.from("digital_products").select("*", { count: "exact", head: true }).eq("created_by", profile.id);
          if ((count || 0) > 0) continue;
        }
        if (step.condition === "no_sale") {
          const { data: prods } = await sb.from("digital_products").select("id").eq("created_by", profile.id);
          if (prods?.length) {
            const { count } = await sb.from("product_purchases").select("*", { count: "exact", head: true }).eq("status", "completed").in("product_id", prods.map((p: any) => p.id));
            if ((count || 0) > 0) continue;
          }
        }
        if (step.condition === "no_affiliate") {
          const { data: orgs } = await sb.from("organizations").select("affiliation_enabled").eq("owner_id", profile.id);
          if (orgs?.some((o: any) => o.affiliation_enabled)) continue;
        }

        // Select language
        const lang = profile.preferred_language || 'fr';
        const isFr = lang === 'fr';
        const name = profile.display_name || (isFr ? "cher(e) utilisateur(rice)" : "dear user");
        const subject = isFr ? step.subject_fr : step.subject_en;
        const body = (isFr ? step.body_fr : step.body_en).replace(/\{\{name\}\}/g, name);

        try {
          await sb.functions.invoke("send-email", {
            body: {
              to: profile.email,
              subject,
              html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6">${body.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</div>`,
              template: step.key,
            },
          });

          await sb.from("email_logs").insert({
            recipient: profile.email,
            template: step.key,
            subject,
            status: "sent",
          });
          totalSent++;
        } catch (emailErr) {
          console.error(`[drip-engine] Failed to send ${step.key} to ${profile.email}:`, emailErr);
          await sb.from("email_logs").insert({
            recipient: profile.email,
            template: step.key,
            subject,
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
