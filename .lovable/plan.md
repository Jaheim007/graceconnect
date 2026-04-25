# 🎯 PLAN COMPLET — Rendre SiteViral "Payable"

## 🧭 Vision stratégique

**Pivot narratif** : Passer de _"outil gratuit pour créateurs africains"_ → _"plateforme de scaling pour créateurs sérieux qui veulent garder 100% de leurs revenus"_.

**Modèle d'inversion** : Au lieu de payer pour utiliser, on paie pour **arrêter de partager 10%**. C'est psychologiquement beaucoup plus puissant.

---

## 📐 ARCHITECTURE DES 3 OFFRES

### Tier 1 — FREE (Discovery)
- ✅ Tout l'AI Studio (avec watermark sur PDFs/exports)
- ✅ Vente illimitée de produits
- ❌ **Commission 10% sur chaque vente**
- ❌ Pas de domaine personnalisé (`slug.siteviral.com` seulement)
- ❌ 50 crédits IA/mois
- ❌ Branding "Powered by SiteViral" sur boutique publique

### Tier 2 — PRO (19 000 XOF/mois ou 29€/mois) — _Le sweet spot_
- ✅ **0% de commission** (le pitch principal)
- ✅ Domaine personnalisé inclus
- ✅ 500 crédits IA/mois
- ✅ PDFs sans watermark
- ✅ Analytics avancés (cohortes, LTV)
- ✅ Email marketing automation (Inspiration Digest custom)
- ✅ Suppression du branding "Powered by"
- ✅ Support prioritaire (24h)

### Tier 3 — ORG / WHITE-LABEL (65 000 XOF/mois ou 99€/mois)
- ✅ Tout du Pro
- ✅ Multi-utilisateurs (5+ admins)
- ✅ White-label complet (logo, couleurs, emails)
- ✅ 2000 crédits IA/mois
- ✅ API access
- ✅ Onboarding dédié + manager
- ✅ Cible : Églises, ONGs, centres de formation, agences

---

## 🛠️ PHASES D'IMPLÉMENTATION

### **PHASE 1 — Fondations Billing (Semaine 1)**

#### 1.1 Base de données
- Table `subscription_plans` (déjà partiellement existante via `useSubscriptions`)
  - Colonnes : `tier` (free/pro/org), `price_xof`, `price_eur`, `commission_rate`, `ai_credits_monthly`, `features` (jsonb)
- Table `org_subscriptions`
  - `org_id`, `plan_tier`, `status` (active/past_due/canceled), `current_period_end`, `payment_provider` (stripe/paystack)
- Table `subscription_invoices` (historique paiements)
- Trigger : reset crédits IA mensuels au début de chaque cycle

#### 1.2 Logique de commission dynamique
- Modifier `calculate_platform_commission()` (function SQL existante) :
  ```sql
  IF org has active 'pro' or 'org' subscription → return 0
  ELSE → return amount * 0.10
  ```
- Mettre à jour `process-purchase` et `process-donation` edge functions

#### 1.3 Edge Functions billing
- `create-subscription-checkout` (Stripe pour EUR/USD, Paystack pour XOF/NGN)
- `cancel-subscription`
- `subscription-webhook` (Stripe) + `paystack-subscription-webhook`
- `check-subscription-status` (cron quotidien)

---

### **PHASE 2 — Feature Gating (Semaine 2)**

#### 2.1 Hook central `usePlan()`
```typescript
const { tier, isPro, isOrg, hasFeature, aiCreditsRemaining } = usePlan();
```

#### 2.2 Gates à implémenter
| Feature | Free | Pro | Org |
|---------|------|-----|-----|
| Custom domain | ❌ Modal upgrade | ✅ | ✅ |
| White-label | ❌ | ❌ Modal upgrade | ✅ |
| Watermark PDF | ✅ Visible | ❌ | ❌ |
| AI credits/mo | 50 | 500 | 2000 |
| Email automation | ❌ | ✅ | ✅ |
| Multi-admins | 1 | 1 | 5+ |
| Analytics avancés | ❌ | ✅ | ✅ |

#### 2.3 Composants UI
- `<UpgradeGate feature="custom_domain">` — wrapper qui affiche modal si pas le bon tier
- `<PlanBadge tier="pro" />` — badge visuel
- `<CommissionBanner />` — sur dashboard Free : "Vous avez payé X XOF de commissions ce mois. Économisez avec Pro."

---

### **PHASE 3 — Page Pricing & Conversion (Semaine 3)**

#### 3.1 Page `/pricing` repensée
- Hero : **"Gardez 100% de vos revenus"** (pas "Commencez gratuitement")
- Calculateur ROI interactif :
  - "Vous vendez X XOF/mois → vous économisez Y avec Pro"
  - Breakeven affiché : "Pro est rentable dès 190 000 XOF de ventes/mois"
- Comparaison 3 colonnes (Free / Pro / Org)
- FAQ orientée objections (pourquoi payer si gratuit existe ?)
- Témoignages segmentés par tier

#### 3.2 Triggers d'upgrade contextuels
- Après chaque vente Free : toast "Vous venez de payer X XOF de commission"
- Dashboard : graphique "Commissions cumulées" avec CTA upgrade
- Email mensuel : "Récap commissions" → upsell Pro
- Limite crédits IA atteinte → modal "Passez à Pro pour 10x plus"

#### 3.3 Repositionnement messaging
- Landing page : nouveau hero **"L'unique plateforme africaine où vous gardez tout"**
- Persona pages : ajouter section ROI Pro
- Onboarding : présenter Pro dès l'étape 3 (pas en bas du menu)

---

### **PHASE 4 — Rétention & Expansion (Semaine 4)**

#### 4.1 Trial Pro 14 jours
- Activation auto pour tout nouvel inscrit
- Email J-3 avant expiration : "Vous avez économisé X XOF cette semaine"
- Downgrade auto vers Free si pas converti

#### 4.2 Annual billing (-20%)
- Pro Annual : 182 400 XOF/an (vs 228 000 mensuel)
- Org Annual : 624 000 XOF/an

#### 4.3 Programme de fidélité
- 6 mois Pro consécutifs → bonus 1000 crédits IA
- Parrainage : 1 mois offert pour le parrain ET le filleul

#### 4.4 Win-back automation
- Cancel → email J+1, J+7, J+30 avec offre dégressive (-30%, -50%)

---

### **PHASE 5 — Focus & Différenciation (Semaine 5)**

#### 5.1 Choisir 2 niches prioritaires (au lieu de "tout pour tous")
**Recommandation** : 
- 🎯 **Coaches/Formateurs** (forte intent, ARPU élevé)
- 🎯 **Églises/ONGs** (récurrence, multi-users, ticket moyen Org)

#### 5.2 Landing pages dédiées avec preuve sociale
- `/pour-coaches` → cas concret + ROI calculator coach
- `/pour-eglises` → témoignages pasteurs + dashboard offrandes

#### 5.3 Killer feature par niche
- Coaches : **"Tunnels de vente IA"** (génère VSL + page + email seq en 1 clic)
- Églises : **"Live Giving"** (QR code projeté, dons en temps réel pendant culte)

---

## 📊 KPIs À TRACKER

| Métrique | Cible 3 mois | Cible 6 mois |
|----------|--------------|--------------|
| Conversion Free → Pro | 3% | 7% |
| Trial → Paid | 25% | 40% |
| MRR | 500 000 XOF | 3 000 000 XOF |
| Churn mensuel | <10% | <5% |
| LTV/CAC | 2x | 4x |

---

## 🚀 ORDRE D'EXÉCUTION RECOMMANDÉ

1. **Sprint 1 (Phase 1)** : Backend billing — base inviolable
2. **Sprint 2 (Phase 3.1)** : Page pricing + messaging — sans ça, rien ne se vend
3. **Sprint 3 (Phase 2)** : Feature gating — créer la friction
4. **Sprint 4 (Phase 3.2)** : Triggers contextuels — convertir
5. **Sprint 5 (Phase 4)** : Trial + rétention — réduire churn
6. **Sprint 6 (Phase 5)** : Niches + killer features — accélérer

---

## ⚠️ RISQUES & MITIGATION

| Risque | Mitigation |
|--------|------------|
| Backlash communauté gratuit | Garder Free généreux, grandfather les early users 6 mois Pro offerts |
| Churn élevé | Trial obligatoire + onboarding qui démontre ROI rapide |
| Concurrence baisse prix | Différenciation par features Afrique-spécifiques (MoMo, devises locales) |
| Paystack subscription instable | Fallback Stripe pour cartes + relances manuelles MoMo |

---

## 💡 QUICK WINS (à faire MAINTENANT, avant tout le reste)

1. **Ajouter "Powered by SiteViral"** sur toutes les boutiques Free → friction immédiate
2. **Watermark sur PDFs** générés en Free → friction visible
3. **Bannière dashboard** : "Vous avez payé X XOF de commissions" → prise de conscience
4. **Page `/pricing`** avec les 3 tiers même si Pro pas encore activable → tester l'intent

Ces 4 actions peuvent être faites en 2 jours et génèrent les premiers signaux de demande.
