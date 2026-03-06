# 📈 SITEVIRAL — Marketing & Growth Playbook
## Version 2.0 — Mars 2026 — "Écris. Vends. Gagne."

**Propriété : Hacktualiz Inc. (Delaware, USA)**

> Ce document est le playbook de croissance complet de SiteViral, reflétant l'état actuel du produit tel qu'implémenté dans le code (Mars 2026). Il combine la stratégie marketing, les boucles virales, les funnels d'acquisition et les tactiques terrain.

---

# TABLE DES MATIÈRES

1. [Positionnement & Proposition de valeur](#1-positionnement--proposition-de-valeur)
2. [Les 3 Personas d'acquisition](#2-les-3-personas-dacquisition)
3. [Les 6 Boucles Virales](#3-les-6-boucles-virales)
4. [Funnels d'acquisition par persona](#4-funnels-dacquisition-par-persona)
5. [Pages d'atterrissage & SEO](#5-pages-datterrissage--seo)
6. [Le "First Win" — Écrire un livre en 5 minutes](#6-le-first-win--écrire-un-livre-en-5-minutes)
7. [Programme Ambassadeur — Growth Engine](#7-programme-ambassadeur--growth-engine)
8. [Programme Partenaire B2B — Expansion](#8-programme-partenaire-b2b--expansion)
9. [Tarification & Modèle économique](#9-tarification--modèle-économique)
10. [Contenu & SEO Strategy](#10-contenu--seo-strategy)
11. [Scripts terrain & Objections](#11-scripts-terrain--objections)
12. [Métriques & KPIs Growth](#12-métriques--kpis-growth)
13. [Stack technologique Growth](#13-stack-technologique-growth)
14. [Roadmap Growth](#14-roadmap-growth)

---

# 1. POSITIONNEMENT & PROPOSITION DE VALEUR

## 1.1 Mission
SiteViral est la plateforme tout-en-un qui permet à n'importe quelle organisation (églises, ONG, créateurs, formateurs, leaders communautaires) de **créer, vendre et distribuer du contenu numérique** — avec paiement Mobile Money intégré, une IA qui écrit pour vous, et une armée d'ambassadeurs qui vendent à votre place.

## 1.2 Tagline
> **"Écris. Vends. Gagne."**

## 1.3 Les 4 piliers de valeur

| Pilier | Description | Différenciateur clé |
|--------|-------------|---------------------|
| **Business OS** | Site + boutique + dons + CRM + médias + programmes | Tout-en-un, zéro abonnement |
| **AI Studio Factory** | IA qui génère des ebooks, cours, livres pour enfants, packs prédication | Contenu vendable en 5 minutes |
| **Marketplace virale** | Preuve sociale, découverte, confiance | Mobile Money natif |
| **Growth Engine** | Affiliation + partenaires B2B + tracking | Ambassadeurs à commission variable (5-50%) |

## 1.4 Avantages concurrentiels

| Ce que les autres ont | Ce que SiteViral a EN PLUS |
|---|---|
| Paiement par carte bancaire uniquement | ✅ **Mobile Money** (Orange, MTN, Moov) + Carte |
| Abonnement mensuel obligatoire | ✅ **Zéro abonnement** — 10% uniquement sur les ventes |
| Pas de création de contenu | ✅ **IA Studio** — écris un livre en 5 minutes |
| Interface en anglais | ✅ **Français natif** + anglais + arabe |
| Pas de programme ambassadeur | ✅ **Ambassadeurs intégrés** (5-50% de commission) |
| Vente OU dons | ✅ **Vente + Dons + Communauté + Formations** |
| Pas de protection anti-fraude | ✅ **8 couches de sécurité** + KYC intégré |
| Plateformes pensées pour l'Occident | ✅ **Conçu pour l'Afrique francophone** |

---

# 2. LES 3 PERSONAS D'ACQUISITION

## 🎯 Persona 1 : Le Créateur / Vendeur
**Qui :** Leader communautaire, pasteur, formateur, auteur, entrepreneur.
**Motivation :** Monétiser son expertise et ses contenus.
**Landing page :** `/vendre`
**CTA principal :** "Crée ta boutique gratuite"
**Promesse :** "Vends tes ebooks, formations et contenus — avec Mobile Money. Zéro abonnement."

## 🎯 Persona 2 : L'Ambassadeur / Gagneur
**Qui :** Étudiant, community manager, influenceur, toute personne active sur WhatsApp/réseaux.
**Motivation :** Gagner de l'argent sans créer de contenu.
**Landing page :** `/gagner` et `/gagner-info`
**CTA principal :** "Commence à gagner maintenant"
**Promesse :** "Partage des liens, gagne des commissions. Zéro contenu à créer. Mobile Money."

## 🎯 Persona 3 : L'Auteur Express
**Qui :** Toute personne qui a une idée de livre ou un document existant.
**Motivation :** Devenir auteur publié rapidement.
**Landing page :** `/ecrire`
**CTA principal :** "Écris ton livre en 5 minutes"
**Promesse :** "L'IA écrit ton livre. Tu le publies. Les ambassadeurs le vendent."

---

# 3. LES 6 BOUCLES VIRALES

SiteViral repose sur **6 boucles de croissance simultanées** qui s'alimentent mutuellement :

## 🔄 Boucle 1 : Preview → Achat → Review → Social Proof
```
Visiteur découvre un produit (marketplace/partage)
  → Voit le preview (pages floutées via pdfjs-dist)
  → Achète (Mobile Money / Carte)
  → Laisse un avis
  → L'avis renforce la preuve sociale
  → Nouveaux visiteurs convertissent mieux
```
**Composants implémentés :** `ProductDetailPage`, `generate-preview`, preview flou 20%, système d'avis

## 🔄 Boucle 2 : Achat → Partage post-achat → Nouveau visiteur
```
Acheteur termine son achat
  → Page de succès avec bouton "Partager sur WhatsApp"
  → Partage organique avec message pré-rempli
  → Nouveaux visiteurs arrivent
  → Cycle recommence
```
**Composants implémentés :** `PaymentSuccessPage`, short links (`/go/:code`), share buttons

## 🔄 Boucle 3 : Achat → Ambassadeur → Kit marketing → Partages
```
Utilisateur devient ambassadeur
  → Reçoit un lien unique par produit
  → Partage sur WhatsApp/Facebook/Instagram
  → Quelqu'un achète via son lien
  → L'ambassadeur gagne sa commission (5-50%)
  → Motivé, il partage plus
```
**Composants implémentés :** `AffiliationPage`, `AmbassadorDashboard`, `LeaderboardPage`, attribution cookies (30 jours)

## 🔄 Boucle 4 : Ambassadeur → Earnings Card → Partage revenus → Nouveaux créateurs
```
Ambassadeur gagne de l'argent
  → Voit ses gains sur son dashboard
  → Partage sa "Earnings Card" (capture d'écran gains)
  → Ses contacts voient les gains
  → Certains deviennent ambassadeurs
  → D'autres deviennent créateurs ("si lui gagne en vendant les produits des autres, moi je vais créer les miens")
```
**Composants implémentés :** `AmbassadorDashboard`, métriques temps réel, classement (leaderboard)

## 🔄 Boucle 5 : Créateur → Studio IA → Produit → Snippets auto → Partages
```
Créateur utilise l'AI Studio
  → Génère un livre/cours en 5 minutes
  → Le système génère automatiquement des snippets marketing
  → Le créateur partage ces snippets
  → Nouveaux acheteurs découvrent le produit
  → Le créateur crée plus de contenu
```
**Composants implémentés :** `WriteWizard` (/ecrire), `ai-generate-snippets`, `StudioHome`, templates IA, génération de contenu chapitre par chapitre via Lovable AI Gateway

## 🔄 Boucle 6 : LMS → Certificat → Partage LinkedIn/WhatsApp → Nouveaux inscrits
```
Apprenant suit un programme de formation
  → Termine les modules et leçons
  → Obtient un certificat de réussite
  → Partage sur LinkedIn/WhatsApp
  → Ses contacts s'inscrivent au programme
  → L'organisation gagne plus d'inscrits
```
**Composants implémentés :** `AdminPrograms`, `ProgramDetailPage`, `MyProgramsPage`, enrollment system, progress tracking

---

# 4. FUNNELS D'ACQUISITION PAR PERSONA

## 4.1 Funnel Créateur/Vendeur

```
                    /vendre (landing page interactive)
                           │
                    Choix type de produit (ebook, audio, vidéo, cours...)
                           │
                    Simulateur de revenus interactif (slider prix)
                           │
                    CTA → /auth?mode=signup&intent=creator
                           │
                    Onboarding → Création organisation
                           │
                    Premier produit publié
                           │
                    Dashboard créateur (/admin)
```

## 4.2 Funnel Ambassadeur/Gagneur

```
                    /gagner-info (landing page)
                           │
                    3 étapes simples : Choisis → Partage → Encaisse
                           │
                    Témoignages + preuve sociale (drapeaux pays)
                           │
                    CTA → /gagner → /auth?mode=signup&intent=ambassador
                           │
                    AmbassadorDashboard
                           │
                    Premier lien généré + premier partage WhatsApp
                           │
                    Première commission
```

## 4.3 Funnel Auteur Express (LE PLUS IMPORTANT — "First Win")

```
                    /ecrire (WriteWizard — 7 étapes)
                           │
              ┌─────────────────────────────────┐
              │ Étape 0 : Source                 │
              │  → "J'ai une idée" / "J'ai un   │
              │    document" / Vidéo / Audio      │
              ├─────────────────────────────────┤
              │ Étape 1 : Paramètres             │
              │  → Titre, style, nb pages        │
              ├─────────────────────────────────┤
              │ Étape 2 : Génération IA          │
              │  → Outline puis contenu          │
              │    chapitre par chapitre          │
              │    (Lovable AI Gateway)           │
              ├─────────────────────────────────┤
              │ Étape 3 : Aperçu & Édition       │
              │  → Modifier titre, chapitres,    │
              │    contenu de chaque chapitre     │
              │  → Prévisualisation livre         │
              ├─────────────────────────────────┤
              │ Étape 4 : Couverture             │
              │  → Template auto / Canva / Upload │
              ├─────────────────────────────────┤
              │ Étape 5 : Prix & Commission       │
              │  → Gratuit ou payant              │
              │  → % commission ambassadeur       │
              ├─────────────────────────────────┤
              │ Étape 6 : Publication             │
              │  → Animation de progression       │
              │  → Création org auto si besoin    │
              │  → Génération PDF (pdf-lib)       │
              │  → Création produit + couverture  │
              ├─────────────────────────────────┤
              │ Étape 7 : 🎉 Célébration          │
              │  → "Ton livre est en vente !"     │
              │  → Lien vers dashboard            │
              │  → Bouton "Écrire un autre livre" │
              └─────────────────────────────────┘
```

**RPC atomique :** `create_book_quick` crée en un seul appel : l'organisation (si absente), le projet IA, et le produit numérique.

---

# 5. PAGES D'ATTERRISSAGE & SEO

## 5.1 Landing Pages implémentées

| Route | Persona | Composants clés | CTA |
|-------|---------|-----------------|-----|
| `/` | Tous | HeroManifesto, HowItWorks, InteractiveDemo, LiveStats, AmbassadorLoop, MobileMoney, TrustShield, Pricing, SocialProof, Migration, FinalCTA | "Écris ton livre" |
| `/ecrire` | Auteur | WriteWizard (7 étapes) | "Générer mon livre" |
| `/vendre` | Créateur | Choix type produit, simulateur revenus, perks plateforme | "Créer ma boutique" |
| `/gagner` | Ambassadeur | Redirection vers dashboard ambassadeur | — |
| `/gagner-info` | Ambassadeur | 3 étapes, bénéfices, témoignages | "Commence à gagner" |
| `/ambassador` | Ambassadeur | Présentation programme détaillée | "Devenir ambassadeur" |
| `/devenir-partenaire` | Partenaire B2B | Programme partenaire, niveaux | "Candidater" |
| `/features` | Tous | Toutes fonctionnalités | Multi CTA |
| `/discover` | Acheteur | Marketplace, recherche, filtres | Achat |
| `/migrer` | Créateur existant | Migration depuis autres plateformes | "Migrer maintenant" |
| `/protection` | Tous | Sécurité, anti-fraude | — |

## 5.2 SEO Guides (Content Marketing)

| Route | Sujet | Cible SEO |
|-------|-------|-----------|
| `/guide/vendre-ebook-afrique` | Vendre un ebook en Afrique | "vendre ebook afrique" |
| `/guide/plateforme-dons-afrique` | Plateforme de dons Afrique | "plateforme dons afrique" |
| `/guide/gagner-sans-contenu` | Gagner sans créer de contenu | "gagner argent sans contenu" |
| `/guide/vendre-cours-en-ligne` | Vendre des cours en ligne | "vendre cours en ligne afrique" |
| `/guide/mobile-money-ecommerce` | Mobile Money & e-commerce | "mobile money ecommerce" |
| `/guide/alternative-gofundme` | Alternative à GoFundMe | "alternative gofundme afrique" |

## 5.3 Architecture SEO technique

- **3 couches :** Cloudflare Worker → Edge Function `share-meta` (OG tags) → SPA + `SEOHead`
- **JSON-LD :** SoftwareApplication + WebSite + SearchAction
- **Edge Functions SEO :** `share-meta`, `og-proxy`, `sitemap`, `generate-preview`
- **Short links :** `/go/:code` pour le tracking et le partage
- **Keywords cibles :** écrire un livre IA, vendre ebook Afrique, gagner argent en partageant, programme ambassadeur, Mobile Money, produits numériques

---

# 6. LE "FIRST WIN" — ÉCRIRE UN LIVRE EN 5 MINUTES

## 6.1 Philosophie
Le "First Win" est le moment magique où un utilisateur **crée quelque chose de vendable en moins de 5 minutes**. C'est le hook principal de SiteViral.

## 6.2 Sources supportées
- **Idée :** L'utilisateur décrit un sujet, l'IA rédige tout
- **Document :** Upload PDF/DOCX/TXT → l'IA structure et enrichit

**Edge Function :** `transcribe-source` utilise Gemini pour traiter les sources non-texte

## 6.3 Génération IA (implémenté)
- **Outline :** Génération automatique de 5-7 chapitres selon le style (ebook, guide, prières)
- **Contenu :** Rédaction de 400-600 mots par chapitre via `generate-book-content` (Lovable AI Gateway → Gemini 2.5 Flash)
- **Progression :** Affichage en temps réel de la progression (outline → contenu chapitre par chapitre)
- **Fallback :** Si l'IA échoue, les chapitres sont créés vides pour édition manuelle

## 6.4 Édition avant publication
- Modifier le titre du livre
- Ajouter/supprimer des chapitres
- Modifier le contenu de chaque chapitre (Textarea plein écran)
- Prévisualisation visuelle du livre (couverture + sommaire)

## 6.5 Publication automatisée
1. `create_book_quick` (RPC atomique) → organisation + projet + produit
2. Upload couverture vers `ai_project_assets`
3. Génération PDF via `ai-generate-pdf` (pdf-lib)
4. Attachement `file_url` + `cover_image_url` au produit
5. Produit créé en statut **brouillon** (l'org peut ensuite le publier)

## 6.6 Motivation intégrée
- Messages motivationnels pendant la génération
- Écran de transition animé pendant la publication
- Page de célébration avec simulation de revenus
- CTA "Écrire un autre livre" pour le rétention

---

# 7. PROGRAMME AMBASSADEUR — GROWTH ENGINE

## 7.1 Mécaniques
- **Inscription :** Libre, tout utilisateur peut devenir ambassadeur
- **Lien unique :** Un lien par produit, tracké via cookies (30 jours)
- **Commission variable :** 5% à 50% (fixée par l'organisation, défaut 10%)
- **Anti-fraude :** Pas d'auto-achat, détection device hash, rétention 15 jours
- **Paiement :** Mobile Money ou virement, seuil minimum 5 000 XOF

## 7.2 Dashboard ambassadeur
- Statistiques temps réel : clics, conversions, commissions
- Classement (leaderboard) entre ambassadeurs
- Historique des ventes et commissions
- Demande de retrait

## 7.3 Attribution
```
Cookie 30 jours → affiliate_attributions
  → Si achat dans les 30 jours → affiliate_sales créée
  → Commission calculée automatiquement
  → Rétention 15 jours avant retrait possible
```

## 7.4 Ce qui distingue de la concurrence
- **PAS du MLM :** Un seul niveau, comme Amazon Associates
- **Pas de commission sur les dons :** Règle éthique absolue
- **Mobile Money natif :** Retraits sur Orange/MTN/Moov Money
- **Commission élevée possible :** Jusqu'à 50% (vs 5-10% chez la concurrence)

---

# 8. PROGRAMME PARTENAIRE B2B — EXPANSION

## 8.1 Différence avec l'ambassadeur

| | Ambassadeur | Partenaire |
|---|---|---|
| Il recrute | Des **acheteurs** | Des **organisations** |
| Il promeut | Des **produits** | La **plateforme** |
| Il gagne sur | Les ventes de produits | La marge de SiteViral |
| Revenu | Par transaction | **Récurrent** (tant que l'org vend) |

## 8.2 Niveaux partenaires

| Niveau | Nom | Orgs actives requises | Commission (sur part SiteViral) |
|--------|-----|----------------------|--------------------------------|
| 1 | Bronze | 10+ | 5% |
| 2 | Silver | 50+ | 8% |
| 3 | Gold | 150+ | 10% |
| 4 | Platinum | 300+ | 12% |
| 5 | Diamond | 1 000+ | 15% |

## 8.3 Funnel partenaire
```
/devenir-partenaire → Candidature
  → Validation équipe SiteViral
  → Code d'invitation unique
  → Démarchage organisations
  → Org s'inscrit via le lien
  → Commission récurrente sur part SiteViral
```

---

# 9. TARIFICATION & MODÈLE ÉCONOMIQUE

## 9.1 Modèle "Zéro abonnement"
- **Inscription :** Gratuit
- **Commission plateforme :** 10% sur chaque vente/don
- **Pas de frais cachés :** Les frais processeur (Paystack/Stripe ~1.5-2.5%) sont absorbés

## 9.2 Répartition type

### Sans ambassadeur
```
Vente 10 000 FCFA
├── Organisation : 9 000 FCFA (90%)
└── SiteViral    : 1 000 FCFA (10%)
```

### Avec ambassadeur (10%)
```
Vente 10 000 FCFA
├── Organisation : 8 000 FCFA (80%)
├── Ambassadeur  : 1 000 FCFA (10%)
└── SiteViral    : 1 000 FCFA (10%)
```

### Avec ambassadeur + partenaire (Gold)
```
Vente 10 000 FCFA
├── Organisation : 8 000 FCFA (80%)
├── Ambassadeur  : 1 000 FCFA (10%)
├── SiteViral    :   900 FCFA (10% - part partenaire)
└── Partenaire   :   100 FCFA (10% de la part SiteViral)
```

## 9.3 Simulateur interactif
Implémenté sur `/vendre` et dans la landing page principale (`LandingPricingSimple`) : slider prix interactif montrant la répartition en temps réel.

---

# 10. CONTENU & SEO STRATEGY

## 10.1 Mots-clés cibles principaux

| Mot-clé | Volume estimé | Page cible |
|---------|---------------|------------|
| écrire un livre IA | Moyen | `/ecrire` |
| vendre ebook afrique | Élevé | `/vendre`, guide |
| gagner argent sans contenu | Moyen | `/gagner-info`, guide |
| programme ambassadeur | Moyen | `/ambassador-program` |
| mobile money ecommerce | Élevé | guide |
| alternative gofundme afrique | Moyen | guide |
| plateforme dons afrique | Moyen | guide |
| vendre cours en ligne | Élevé | guide |

## 10.2 Stratégie de contenu

1. **Guides SEO longs** (6 guides implémentés sous `/guide/...`)
2. **Blog** (route `/blog` active)
3. **Changelog** (route `/changelog` — transparence produit)
4. **Études de cas** (route `/etudes-de-cas`)
5. **Témoignages** (route `/temoignages`, intégrés dans les landing pages)
6. **White paper** (PDF téléchargeable depuis la landing)
7. **Vidéo promo** (YouTube intégré via `LandingVideoPromo`)

## 10.3 Social Proof implémenté
- Témoignages avec drapeaux pays (🇸🇳 🇨🇲 🇨🇮)
- Live stats animées (`LandingLiveStats`)
- Compteur de ventes par produit
- Avis et notes moyennes sur les produits
- Classement ambassadeurs (leaderboard)

---

# 11. SCRIPTS TERRAIN & OBJECTIONS

## 11.1 Message WhatsApp — Leader/Organisation
> Bonjour [Prénom] 🙏
> Je voulais vous présenter un outil qui pourrait transformer la façon dont votre communauté accède à vos contenus.
> Imaginez : toutes vos prédications, vos livres, vos formations — accessibles en ligne, avec paiement par Orange Money.
> Et le plus fort : des ambassadeurs partagent vos ressources et vous ramènent des acheteurs. Vous ne faites rien de plus.
> C'est SiteViral. Gratuit. Prêt en 2 minutes. Zéro abonnement.
> 👉 https://siteviral.com/vendre

## 11.2 Message WhatsApp — Ambassadeur potentiel
> Salut [Prénom] 👋
> Tu utilises beaucoup WhatsApp ?
> Il y a un moyen de gagner de l'argent juste en partageant des liens de produits que tu aimes.
> 100% gratuit. Pas de contenu à créer. Juste du partage.
> Chaque fois que quelqu'un achète → tu touches une commission sur Mobile Money.
> 👉 https://siteviral.com/gagner-info

## 11.3 Message WhatsApp — Auteur Express
> Salut [Prénom] ✨
> Tu as déjà eu l'idée d'écrire un livre ?
> Avec SiteViral, l'IA écrit ton livre en 5 minutes. Tu le publies. Des ambassadeurs le vendent pour toi. Tu gagnes sur chaque vente.
> Gratuit. Essaie maintenant :
> 👉 https://siteviral.com/ecrire

## 11.4 Réponses aux objections clés

| Objection | Réponse |
|-----------|---------|
| "10% c'est trop cher" | "App Store prend 30%. Gumroad 10% + frais. Shopify = abonnement + frais. Nous : 10% tout compris, uniquement sur les ventes. Zéro quand vous ne vendez rien." |
| "C'est du MLM" | "Un seul niveau, comme Amazon Associates. Pas de recrutement. Pas de pyramide. Des produits réels, des ventes réelles." |
| "C'est mal de vendre la parole de Dieu" | "Vous vendez vos RESSOURCES créées avec effort. La Bible physique a un prix en librairie. Et vous pouvez mettre du contenu GRATUIT aussi." |
| "Mes fidèles n'ont pas les moyens" | "Vendez à 500 FCFA — moins qu'un café. Mobile Money rend l'achat accessible sans compte bancaire." |
| "Je ne suis pas un technicien" | "Si vous savez poster sur WhatsApp, vous savez utiliser SiteViral. Et l'IA écrit votre livre pour vous." |

---

# 12. MÉTRIQUES & KPIs GROWTH

## 12.1 Métriques d'acquisition

| Métrique | Description | Outil |
|----------|-------------|-------|
| Visiteurs uniques par landing | Trafic par page | `client_events` |
| Taux de conversion inscription | Visiteur → Signup | Analytics |
| Taux "First Win" | Signup → Premier livre créé | Funnel wizard |
| Taux de publication | Livre créé → Publié | Studio metrics |
| Time to First Sale | Inscription → Première vente | `org_daily_metrics` |

## 12.2 Métriques ambassadeur

| Métrique | Description |
|----------|-------------|
| Ambassadeurs actifs | Au moins 1 partage/mois |
| Clics par ambassadeur | Engagement des liens |
| Taux de conversion affilié | Clic → Achat |
| Commission moyenne | Revenu moyen par ambassadeur |
| Top 10% revenus | Concentration des revenus |

## 12.3 Métriques IA Studio

| Métrique | Description |
|----------|-------------|
| Projets créés | Nouveaux projets Studio |
| Jobs IA exécutés | `ai_generation_jobs` |
| Taux d'échec IA | Jobs failed / total |
| Score qualité moyen | `ai_quality_scores` |
| Projets publiés | Draft → Published |
| First sale AI product | Premier achat produit IA |

## 12.4 Métriques financières

| Métrique | Description |
|----------|-------------|
| GMV (Gross Merchandise Value) | Volume total des ventes |
| Revenue plateforme | 10% × GMV |
| AOV (Average Order Value) | Panier moyen |
| Lifetime Value par org | Revenus cumulés par org |
| Commission ambassadeur totale | Volume redistribué |

---

# 13. STACK TECHNOLOGIQUE GROWTH

## 13.1 Frontend
- **React 18** + TypeScript + Vite
- **Tailwind CSS** + shadcn/ui + Framer Motion
- **i18n** : Français (natif), Anglais, Arabe
- **PWA** : Installable, notifications push (OneSignal)

## 13.2 Backend
- **Supabase** : Postgres, Auth, Storage, Realtime, Edge Functions (Deno)
- **RLS strict** : Multi-tenant, aucune fuite cross-org

## 13.3 Paiements
- **Paystack** : Mobile Money (Afrique) — Orange, MTN, Moov
- **Stripe** : Cartes bancaires (International)
- **Moneroo** : Passerelle complémentaire

## 13.4 IA
- **Lovable AI Gateway** : Gemini 2.5 Flash (génération de contenu wizard)
- **Gemini API directe** : AI Studio (jobs, qualité, outline, chapitres)
- **Edge Functions IA :** `generate-book-content`, `ai-run-job`, `ai-create-job`, `ai-generate-pdf`, `ai-generate-cover`, `ai-generate-images`, `ai-generate-audio`, `ai-generate-snippets`, `ai-translate-product`

## 13.5 SEO & Distribution
- **Cloudflare Workers** : OG tags pour bots sociaux
- **Edge Functions** : `share-meta`, `og-proxy`, `sitemap`
- **Short links** : `/go/:code` pour tracking
- **Emails transactionnels** : Resend

## 13.6 Analytics & Tracking
- **`client_events`** : Tracking événements côté client
- **`org_daily_metrics`** : Métriques agrégées par org/jour
- **`audit_logs`** : Traçabilité complète
- **Sentry** : Monitoring erreurs

---

# 14. ROADMAP GROWTH

## Phase 1 ✅ (Implémenté)
- [x] Landing pages par persona (`/vendre`, `/gagner-info`, `/ecrire`)
- [x] WriteWizard avec IA (génération outline + contenu chapitres)
- [x] Programme ambassadeur complet avec dashboard
- [x] Paiements Mobile Money + Carte
- [x] Marketplace avec découverte
- [x] Guides SEO (6 articles)
- [x] AI Studio complet (projets, jobs, assets, templates, qualité)
- [x] Programme partenaire B2B
- [x] PWA installable
- [x] Multi-langue (fr/en/ar)
- [x] Système de preview floue des PDF
- [x] Watermark sur les téléchargements
- [x] KYC intégré via Paystack/Stripe

## Phase 2 🔜 (Prochaine)
- [ ] Livres pour enfants illustrés (Kids Book Factory)
- [ ] Cahiers de coloriage (Coloring Book Factory)
- [ ] Audio/Narration TTS
- [ ] Certificats de formation partageables (LinkedIn/WhatsApp)
- [ ] "Invite & Earn" : parrainage acheteur (produit gratuit en récompense)
- [ ] Notifications push motivationnelles automatiques
- [ ] A/B testing intégré (table `experiments`)

## Phase 3 🔮 (Future)
- [ ] Marketplace cross-org avec bundles intelligents
- [ ] Personnalisation IA (recommandations par profil)
- [ ] White-label pour grandes organisations
- [ ] API publique
- [ ] Streaming vidéo/audio
- [ ] Intégration blockchain pour certificats

---

# ANNEXE : RÉSUMÉ EXÉCUTIF

> **SiteViral est une plateforme africaine-first qui résout 3 problèmes simultanément :**
>
> 1. **Les créateurs** ne savent pas comment monétiser → **AI Studio écrit et publie pour eux**
> 2. **Les jeunes** veulent gagner de l'argent → **Programme ambassadeur sans contenu à créer**
> 3. **Les organisations** n'ont pas d'outils adaptés → **Business OS tout-en-un avec Mobile Money**
>
> Le résultat : **6 boucles virales** qui s'auto-alimentent, un modèle économique aligné (on gagne quand le client gagne), et une IA qui réduit la barrière à l'entrée à **5 minutes**.

---

*Document généré à partir du PRD v4.0, du Guide Équipes v1.0, et du code source implémenté — Mars 2026*
*Propriété : Hacktualiz Inc. (Delaware, USA)*
