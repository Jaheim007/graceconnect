SiteViral — Product Requirements Document (PRD)
Version 4.0 — “SOCLE + AI STUDIO RÉVOLUTIONNAIRE” — Mars 2026

Propriété : Hacktualiz Inc. (Delaware, USA)

TABLE DES MATIÈRES

Vision & Positionnement

Personas & Rôles

Principes Produit & Gouvernance (NOUVEAU)

Architecture Technique

IA : Stratégie Multi-Providers & Sécurité (NOUVEAU)

Modules Fonctionnels (Core)

Paiements & Finance

Programme Ambassadeur

Programme Partenaire B2B

KYC & Conformité

Notifications

SEO & Partage Social

Sécurité & Anti-Fraude

Administration Plateforme (Superadmin)

Modèle de Données (Core + Extensions)

Edge Functions (Backend)

Règles Métier Critiques

Métriques & Analytics

Infrastructure & Déploiement

Roadmap & Évolutions

AI Studio & Content Engine (NOUVEAU MODULE MAJEUR)

Bible / Religious Content Pack (NOUVEAU)

Kids Books & Coloring Factory (NOUVEAU)

UX & UI Requirements (NOUVEAU)

Qualité, Tests & Acceptance Criteria (NOUVEAU)

Annexes (Hooks, UI components, conventions, prompts Lovable)

1) VISION & POSITIONNEMENT
1.1 Mission

SiteViral est une plateforme SaaS multi-tenant permettant à des organisations (églises, ministères, ONG, leaders, communautés, créateurs, écoles) de créer une présence digitale complète : page publique, vente de produits numériques, collecte de dons, diffusion de médias, gestion de communauté, programmes de formation, CRM — avec monétisation, affiliation, KYC, et une usine de création de contenu IA intégrée.

1.2 Proposition de valeur (4 piliers)

Business OS pour organisations : site + boutique + dons + CRM + médias + programmes

Marketplace neutre : achat/don fluide, confiance, preuve sociale

Growth engine : affiliation + partenaires B2B + tracking + A/B tests

AI Studio Factory : génération de contenus vendables (ebooks, kids books illustrés, coloring books, scripts, cours, packs) + assets + audio + landing copy, avec gouvernance et qualité

1.3 Modèle économique

Commission plateforme par défaut : 10% (configurable par org)

Commission ambassadeur : 0–50% (par défaut 10% si activé)

Répartition type : 80% org / 10% plateforme / 10% ambassadeur

Sans ambassadeur : 90% org / 10% plateforme

Programme partenaire B2B : commission récurrente sur transactions des orgs recrutées

Collect First, KYC Later : vente immédiate, KYC au retrait

1.4 Entité juridique

Société : Hacktualiz Inc.

Juridiction : Delaware, USA

Rôle : Merchant of Record (collecte centralisée)

Conformité : AML/AUP, conservation KYC/records 5 ans

2) PERSONAS & RÔLES
2.1 Philosophie

Étanchéité psychologique : chaque persona voit une UI adaptée.

Acheteur : marketplace neutre

Créateur : outils business et publication

Ambassadeur : gains et liens

Partenaire B2B : recrutement d’organisations

Superadmin : gouvernance et conformité

2.2 Rôles plateforme

user

superadmin
Stockage : user_platform_roles. Jamais dans profiles ou auth.users.
Fonction : is_superadmin() SECURITY DEFINER.

2.3 Rôles organisation

owner, admin, editor, member, affiliate (hérité)
Stockage : organization_members.
Fonctions : can_manage_org(), can_admin_org(), is_org_member(), get_org_role().

2.4 Smart Dashboard Router

/dashboard route automatiquement :

créateur (orgs gérables) → /admin

ambassadeur → AmbassadorDashboard

acheteur → UserDashboard

3) PRINCIPES PRODUIT & GOUVERNANCE (NOUVEAU)
3.1 Objectifs non négociables

Multi-tenant strict : aucune fuite cross-org

Paiements fiables : idempotence, audit, traçabilité

Publication gouvernée : brouillon → review → publié

Contenus vendables : livraison sécurisée + logs

IA industrialisée : templates, jobs, versioning, qualité, policy, provenance

3.2 Gouvernance des contenus (core)

Tous les contenus “publiables” (produits, médias, annonces, leçons, pages) doivent supporter :

status: draft | in_review | published | scheduled | archived

published_at, scheduled_at

versioning via content_versions

“Preview mode” avant publication

Audit logs sur actions clés

3.3 Gouvernance IA (core)

Chaque génération IA doit :

être traçable (qui, quand, template, paramètres)

stocker un “job” (statut, coût estimé, tokens, provider)

produire des assets (texte, images, audio, pdf)

être validable humainement avant publication (quality gate)

3.4 Politiques “droits & provenance”

Le système doit permettre à l’org de déclarer :

“contenu fourni par l’utilisateur”

“contenu généré IA”

“source externe / licence”

Avertissements intégrés : l’utilisateur est responsable des textes qu’il colle (ex : traductions bibliques sous droits).

Possibilité d’activer “Strict mode” : empêcher publication si provenance/attribution non renseignée.

4) ARCHITECTURE TECHNIQUE
4.1 Stack Frontend

React 18, TypeScript, Vite, Tailwind, shadcn/ui, Framer Motion, TanStack Query, React Router v6, React Hook Form + Zod, Tiptap, Recharts.

4.2 Stack Backend

Supabase Postgres, Supabase Auth, Storage, Realtime, Edge Functions (Deno), RLS strict, SECURITY DEFINER functions.

4.3 Services externes

Paystack, Stripe, Resend, OneSignal, Cloudflare Workers, Google Gemini (texte).

AI Providers images/audio (multi-provider, configurable).

4.4 Architecture SEO (3 couches)

Bots sociaux → Cloudflare Worker → Edge Function share-meta (OG tags).
Humains → SPA + SEOHead.

5) IA : STRATÉGIE MULTI-PROVIDERS & SÉCURITÉ (NOUVEAU)
5.1 Principe

L’IA est un moteur multi-provider :

Texte : Gemini (par défaut)

Images : provider configurable (Google/Autre)

Audio TTS : provider configurable (Google TTS/Autre)

Fallback : si provider A échoue, bascule B (si activé)

5.2 Concepts IA standardisés

ai_templates : templates paramétriques par type (ebook, kids book, coloring, landing copy…)

ai_generation_jobs : file d’attente / orchestration

ai_assets : outputs (text, image, audio, pdf) stockés en Storage + DB

ai_policy_profiles : profils de sécurité par usage (kids, religious, general)

ai_quality_scores : scoring (cohérence, longueur, structure, safety flags)

5.3 Safety & Policy enforcement

Chaque template est lié à un policy_profile

Filtrage de prompts pour éviter :

contenu haineux, violence inutile, pornographie

contenu inapproprié pour mineurs

demandes illégales

Blocage / réduction de risque via règles :

“Kids mode”: pas de thèmes adultes, pas d’images réalistes d’enfants en situation sensible, pas d’armes, etc.

“Religious mode”: respect des sensibilités, pas d’incitation haineuse

5.4 Observabilité IA

logs job : latency, tokens, erreurs

“cost units” internes (estimation)

suivi par org (budget IA optionnel)

6) MODULES FONCTIONNELS (CORE)
6.1 Page publique org /org/:slug

Sections drag & drop, masquables, couleurs, popup, tracking pixels.

6.2 Produits numériques

PDF/ZIP/liens externes/bundles, sales page, promo price, FAQ, testimonials, guarantee, order bump, upsell, FTS.
Livraison : signed URL, watermark PDF, download logs.
Produits gratuits : claim-free-product.

6.3 Campagnes de dons

goal, current_amount atomique, end_date optionnelle, notifications.

6.4 Offrandes

permanentes, preset amounts, récurrence future.

6.5 Médias

video/audio/reel/live_replay, is_premium, views atomique, likes/saves, watch_history, tags/series/speaker, FTS, import YouTube.

6.6 Programmes de formation

programs → modules → lessons, enrollments, progress, contenu riche.

6.7 Événements / 6.8 Annonces / 6.9 Galerie / 6.10 CRM / 6.11 Email campaigns / 6.12 Tiptap

Comme v3.0, avec ajout status/publishing governance (section 3).

7) PAIEMENTS & FINANCE

Paystack (Mobile Money), Stripe (cartes).
usePaymentGateway.
Webhooks signés + idempotence payment_events.
process-transaction.ts central.

8) PROGRAMME AMBASSADEUR

Inscription, attribution, commissions, payout, anti-fraude, dashboard.

9) PROGRAMME PARTENAIRE B2B

Niveaux Bronze→Diamond, attribution org, commissions récurrentes, KYC partenaire, payouts.

10) KYC & CONFORMITÉ

KYC org levels none/pending/level1/level2/rejected, contraintes capture, review superadmin, payouts.

11) NOTIFICATIONS

In-app + push + email, préférences, triggers publish, automated emails.

12) SEO & PARTAGE SOCIAL

Worker + share-meta + SEOHead, generate-preview, og-proxy, sitemap, short links, SEO on-page.

13) SÉCURITÉ & ANTI-FRAUDE

Auth, RLS, signatures, rate limits, fraud flags, download security, content reports, audit logs, owner protection.

14) ADMINISTRATION PLATEFORME

Dashboard totals, org management, KYC queue, payouts, partners, experiments, AI assistant.

15) MODÈLE DE DONNÉES (CORE + EXTENSIONS)
15.1 Tables Core (v3.0)

Conserver toutes les tables listées dans ton PRD v3.0.

15.2 Nouvelles tables — Gouvernance contenu (si non existantes)
content_publication_status

Option A : ajouter colonnes directement à chaque table (digital_products, announcements, media_content, programs, program_lessons, events, etc.)
Option B (recommandée pour Lovable simple) : colonnes directement dans chaque table :

status (enum text)

published_at, scheduled_at

submitted_for_review_at

reviewed_at, reviewed_by

15.3 Nouvelles tables — AI Studio (obligatoires)
ai_templates

id

org_id nullable (templates platform + templates org)

name

template_type (ebook, kids_story, coloring_book, lesson_pack, landing_page_copy, sermon_pack, bible_pack, etc.)

prompt_system (string)

prompt_user_pattern (string avec variables)

default_params (jsonb)

policy_profile_id

is_active

created_by, created_at

ai_policy_profiles

id

name (kids_safe, religious_safe, general_safe)

rules_json (jsonb) : mots interdits, thèmes interdits, contraintes style

max_age_rating (G, PG, etc. interne)

requires_human_review boolean

created_at

ai_generation_jobs

id

org_id

created_by

template_id

job_type (text/image/audio/pdf/multi)

input_params jsonb

status (queued, running, failed, completed, canceled)

progress int

provider (gemini/other)

error_message

started_at, completed_at

estimated_cost_units

result_summary jsonb (ids assets)

ai_assets

id

org_id

job_id

asset_type (text, image, audio, pdf, zip)

storage_bucket

storage_path

mime_type

metadata jsonb (dimensions, duration, pages…)

created_at

ai_quality_scores

id

org_id

job_id

score_overall numeric

scores_json jsonb (coherence, structure, safety, originality)

flags_json jsonb

review_required boolean

review_status (pending, approved, rejected)

reviewed_by, reviewed_at

ai_content_projects (projets Studio)

Un “projet” regroupe tout : texte + images + pdf + audio + produit final.

id

org_id

created_by

project_type (ebook, kids_book, coloring_book, bible_pack, course_pack)

title

description

status (draft, generating, ready_for_review, ready_to_publish, published)

linked_product_id nullable

linked_program_id nullable

linked_media_id nullable

data_json (structure chapters/pages/scenes)

created_at, updated_at

15.4 Nouvelles tables — Bible / Religious Pack (optionnel mais recommandé)
scripture_references

id

book (Genesis, John…)

chapter

verse_start

verse_end

translation_code (LSG, KJV, etc.)

text nullable (selon licence)

source (user_provided, licensed_pack, reference_only)

created_at

content_scripture_links

id

org_id

content_type (product, announcement, lesson, media, page)

content_id

scripture_reference_id

note (why linked)

created_at

sermon_structures (packs prédication)

id, org_id

title, theme

outline_json (points, illustrations, appels)

prayers_json

verses_json (références)

created_by, created_at

15.5 Nouvelles tables — Kids Books & Coloring
kids_book_projects

id, org_id, project_id

age_range (3-5, 6-8, 9-12)

style (cartoon, watercolor, flat, etc.)

character_bible_json (personnages)

pages_json (pages, texte, prompt image, asset ids)

safety_status (pending/approved/rejected)

created_at

coloring_book_projects

id, org_id, project_id

theme

pages_count

line_art_style (simple, medium, detailed)

pages_json

created_at

16) EDGE FUNCTIONS (BACKEND)
16.1 Conserver toutes les Edge Functions v3.0

Paiements, payouts, notifications, seo, analytics.

16.2 Nouvelles Edge Functions — AI Studio
ai-create-job

input : template_id + params

crée ai_generation_jobs status queued

ai-run-job

exécute le job (texte/image/audio) selon provider

applique policy profile

stocke outputs dans ai_assets

calcule quality score

passe job completed/failed

ai-generate-pdf

prend un ai_content_project structuré

compose un PDF (ebook/kids book/coloring)

stocke asset pdf dans Storage

return asset_id

ai-generate-images

génère images par page/scene

stocke dans org-uploads ou product-previews selon usage

ai-generate-audio

TTS narration (kids book, audiobook, lesson audio)

stocke audio dans Storage

ai-project-to-product

transforme un projet Studio en digital_product

configure price, cover, previews, file asset PDF

crée sales page content

lie linked_product_id

ai-project-to-program

transforme un projet “course pack” en programs + modules + lessons

remplit leçons avec Tiptap JSON/HTML

ai-policy-check

endpoint interne pour valider prompts/params vs ai_policy_profiles

ai-template-manager

CRUD templates (superadmin + org owner)

16.3 Fonctions de support
generate-preview-pages

extrait pages images (pour previews) depuis PDF si nécessaire

content-publish

routine unifiée de publication (status transitions, notifications, audit log)

17) RÈGLES MÉTIER CRITIQUES (CORE + IA)
17.1 Finance

Règles v3.0 inchangées.

17.2 Publication & review

Tout contenu issu de l’IA qui a requires_human_review = true :

ne peut pas passer published sans ai_quality_scores.review_status = approved

Les projets kids books & coloring :

doivent passer par “Kids safety gate” avant publication

17.3 Provenance & droits

Pour tout contenu contenant scripture_references.text :

source doit être renseigné

possibilité de mode “reference-only” (texte null)

Pour tout contenu IA vendu :

digital_products.ai_generated = true (colonne à ajouter)

digital_products.ai_project_id nullable

17.4 Anti-abus IA

Rate limiting sur ai-create-job

quotas par org (optionnel) via org_ai_quotas

blocage si org flagged fraude

18) MÉTRIQUES & ANALYTICS
18.1 Nouvelles métriques IA

Table org_daily_metrics s’étend avec :

ai_jobs_count

ai_assets_generated_count

ai_projects_published_count

ai_fail_rate

ai_avg_quality_score

18.2 Studio funnel

project created → job run → review approved → published → first sale

19) INFRASTRUCTURE & DÉPLOIEMENT
19.1 Hébergement

Lovable + Supabase + Cloudflare Workers.

19.2 Storage buckets (ajouts)

ai-assets (privé) : outputs internes

kids-books-previews (public ou semi-public selon preview)

audiobooks (privé si payant)

20) ROADMAP & ÉVOLUTIONS

Inclure v3.0 + IA Studio progression :

Phase 1 : ebook factory + landing copy + covers

Phase 2 : kids books + coloring + audio

Phase 3 : marketplace cross-org + bundles smart + personalization

Phase 4 : white-label, API publique, streaming, certificats

21) AI STUDIO & CONTENT ENGINE (MODULE MAJEUR)
21.1 Objectif

Permettre à une organisation de produire et monétiser du contenu hautement structuré :

ebooks (business, religieux, école)

packs prédication / enseignements

cours (programs)

kids books illustrés

cahiers de coloriage

versions audio

landing pages copy & ads copy
Le tout en “factory” : templates + workflows + assets + publication + vente.

21.2 Routes UI (NOUVEAU)
Admin org

/admin/studio (home Studio)

/admin/studio/templates

/admin/studio/projects

/admin/studio/projects/:id

/admin/studio/projects/:id/editor (chapitres/pages)

/admin/studio/projects/:id/assets

/admin/studio/projects/:id/review

/admin/studio/projects/:id/publish

/admin/studio/jobs

/admin/studio/library (bibliothèque assets)

Superadmin

/superadmin/studio/templates

/superadmin/studio/policies

/superadmin/studio/jobs

/superadmin/studio/abuse-monitor

21.3 Types de projets Studio

ebook

bible_pack

sermon_pack

course_pack

kids_book

coloring_book

marketing_pack (landing + ads + email sequences)

21.4 Workflow standard

Création projet (titre, objectif, cible, ton, langue, longueur)

Choix template (ou template recommandé)

Génération : création jobs (chapitres, pages, images, audio)

Édition humaine (Tiptap + builder pages)

Quality gate (score + flags)

Review / validation (owner/admin)

Publication :

en digital_product (PDF + previews + cover)

ou en program

ou en media_content

Mise en vente (price, promo, upsell)

Tracking (sales funnel)

21.5 Studio Editor (exigences UI)

UI type “Notion/Docs” :

plan chapitres à gauche

éditeur central

panneau droite : paramètres (ton, cible, style, prompts)

Boutons :

“Générer chapitre”

“Regénérer section”

“Générer couverture”

“Générer images pages”

“Créer PDF”

“Créer produit”

Versioning :

snapshots

restore version

21.6 Market-ready output

Pour un ebook :

PDF final

cover image

5–12 pages preview

description vente + bullets + FAQ + testimonials placeholders

short link / QR code optionnel

option audiobook

22) BIBLE / RELIGIOUS CONTENT PACK (NOUVEAU)
22.1 Objectif

Permettre de gérer des contenus religieux très riches :

versets bibliques référencés

plans de lecture

prédications structurées

prières, proclamations, liturgies

séries par thème, par saison, par campagne

22.2 Verse picker

Dans Tiptap, composant “Ajouter un verset” :

soit “référence seulement”

soit “texte collé par l’utilisateur”

soit “texte depuis pack licencié” (si disponible)

22.3 Sermon Factory

Dans Studio :

template sermon : intro, texte, points, illustrations, déclarations, prières, appel, conclusion

export :

PDF sermon

announcement (résumé)

media_content (script audio/vidéo)

23) KIDS BOOKS & COLORING FACTORY (NOUVEAU)
23.1 Kids Book pipeline

définir tranche d’âge, message, moralité, style illustration, personnages

génération storyboard (pages)

images par page (cohérence style/characters)

assemblage PDF

option narration audio

preview pages publiques (watermarked)

23.2 Coloring book

thème + nombre pages

génération line art (style simple → détaillé)

assemblage PDF imprimable (A4/Letter)

variante “bundle” : pack 3 thèmes

23.3 Kids safety gate (obligatoire)

policy kids_safe

blocage si contenu sensible

review required avant publication

24) UX & UI REQUIREMENTS (NOUVEAU)
24.1 Principes

“Pro” mais simple

aucun jargon technique

onboarding guidé Studio : “crée ton premier ebook en 10 minutes”

états vides très travaillés

progress indicators IA (job progress)

24.2 UI composants Studio clés

StudioHome

TemplatePicker

ProjectWizard

ProjectEditor

AssetsLibrary

JobQueuePanel

QualityGatePanel

PublishWizard

25) QUALITÉ, TESTS & ACCEPTANCE CRITERIA (NOUVEAU)
25.1 Core acceptance

Paiement Paystack/Stripe : 0 double-charge, idempotence OK

multi-tenant : aucune fuite data

signed URLs : expiration OK, logs OK

SEO share : WhatsApp/Facebook/Twitter preview OK

25.2 Studio acceptance

créer projet → générer → éditer → pdf → produit → achat test → download OK

kids book : safety gate enforced

review required bloque publication tant que pas approuvé

audit logs sur publish, payouts, kyc, studio publish

25.3 Performance

jobs IA async via queue table + edge run

UI non bloquante

timeouts gérés

26) ANNEXES
A) Hooks (ajouts)

useStudioProjects

useAiJobs

useAiTemplates

useAssetsLibrary

useQualityGate

usePublishWizard

B) Conventions

Garder v3.0 + nouvelles tables snake_case.

C) “Lovable Build Instructions” (critique)

Lovable doit :

Conserver intégralement le core v3.0

Ajouter routes Studio listées

Ajouter tables IA listées (15.3) + policies + jobs + assets

Ajouter Edge Functions (16.2) avec une architecture claire :

ai-create-job (insert job)

ai-run-job (execute + store assets + score)

ai-generate-pdf

ai-project-to-product

Ajouter UI Editor Studio + wizards

Intégrer governance publish + review required

Ajouter stockage buckets IA

Ajouter tracking analytics IA

Respecter RLS sur toutes nouvelles tables

Ne jamais exposer secrets côté client