# 📘 SITEVIRAL — MANUEL D'ÉQUIPE
### Guide opérationnel par département · Mars 2026

---

## 🎯 Objectif de ce document

Ce manuel explique comment chaque équipe de SiteViral doit utiliser la plateforme au quotidien pour atteindre nos objectifs de croissance :

- **1 000 nouveaux utilisateurs/semaine**
- **TTFV (Time To First Value) < 60 secondes**
- **TTFS (Time To First Sale) < 48 heures**
- **K-Factor > 1.5** (chaque utilisateur amène 1.5+ nouveaux)

---

## 1. 📣 ÉQUIPE MARKETING

### Mission
Faire connaître SiteViral et convertir les visiteurs en utilisateurs actifs.

### Outils SiteViral à utiliser
| Outil | Où le trouver | Pourquoi |
|-------|---------------|----------|
| Pages persona (`/pour/*`) | 30 pages ciblées | SEO + publicité ciblée par audience |
| Guides SEO (`/guide/*`) | 9 guides éducatifs | Trafic organique Google |
| Blog (`/blog`) | Contenu marketing | Autorité + SEO long-tail |
| Calculateur de revenus (`/calculateur`) | Landing page | Conversion visiteur → inscription |
| Comparateur (`/comparer`) | Landing page | Convaincre les hésitants |
| Share Meta (Edge Function) | Automatique | Aperçus sociaux enrichis sur WhatsApp/Facebook |

### Actions hebdomadaires

**Lundi — Planification**
- [ ] Vérifier les analytics de la semaine précédente (`/superadmin/metrics`)
- [ ] Identifier les 3 pages persona avec le plus de trafic
- [ ] Planifier 2 publications blog pour la semaine

**Mardi-Mercredi — Création**
- [ ] Rédiger 1 article blog optimisé SEO
- [ ] Créer 3 visuels pour réseaux sociaux (résultats créateurs, témoignages)
- [ ] Préparer les messages WhatsApp de la semaine (utiliser le SocialShareKit)

**Jeudi — Distribution**
- [ ] Publier sur Facebook, Instagram, TikTok, LinkedIn
- [ ] Envoyer dans 10+ groupes WhatsApp ciblés
- [ ] Lancer une campagne email via le CRM (`/admin/crm`) si applicable

**Vendredi — Optimisation**
- [ ] Analyser les taux de conversion des pages d'accueil
- [ ] Mettre à jour les pages persona sous-performantes
- [ ] Préparer le rapport hebdomadaire

### KPIs à suivre
- Visiteurs uniques/semaine
- Taux de conversion visiteur → inscription
- Coût d'acquisition par canal
- Trafic organique (SEO)

---

## 2. 🚀 ÉQUIPE GROWTH

### Mission
Accélérer l'activation des utilisateurs et maximiser la rétention.

### Outils SiteViral à utiliser
| Outil | Où le trouver | Pourquoi |
|-------|---------------|----------|
| Superadmin Dashboard | `/superadmin` | Vue temps réel de toute l'activité |
| Métriques & Analytics | `/superadmin/metrics` | Suivi des KPIs |
| Expériences A/B | `/admin/experiments` | Tester des hypothèses |
| Missions hebdomadaires | Composant `WeeklyMissions` | Gamification de l'activation |
| Preuve sociale | `FloatingProofToast` + `GlobalActivityBar` | Urgence et confiance |
| Notifications motivationnelles | Edge Function `motivational-notifications` | Relances automatiques |

### Actions hebdomadaires

**Lundi — Diagnostic**
- [ ] Vérifier le TTFV moyen (temps entre inscription et première action)
- [ ] Vérifier le TTFS moyen (temps entre inscription et première vente)
- [ ] Identifier les points de friction dans le funnel d'onboarding
- [ ] Consulter les paniers abandonnés (`abandoned_carts`)

**Mardi — Expérimentation**
- [ ] Lancer 1 expérience A/B sur un point de friction identifié
- [ ] Ajuster les messages de preuve sociale si nécessaire
- [ ] Vérifier que les notifications motivationnelles sont envoyées

**Mercredi — Activation**
- [ ] Contacter manuellement les 10 derniers inscrits qui n'ont pas encore créé de produit
- [ ] Envoyer un message personnalisé aux créateurs bloqués à l'étape « prix »
- [ ] Vérifier les taux de complétion du Studio IA (étape par étape)

**Jeudi — Rétention**
- [ ] Analyser les utilisateurs inactifs depuis 7+ jours
- [ ] Déclencher des campagnes de réactivation (email ou push)
- [ ] Mettre à jour les missions hebdomadaires si le taux de complétion est < 30%

**Vendredi — Rapport**
- [ ] Compiler : inscriptions, activations, premières ventes, K-Factor
- [ ] Documenter les apprentissages des expériences A/B
- [ ] Proposer 2 hypothèses à tester la semaine suivante

### KPIs à suivre
- TTFV (< 60s objectif)
- TTFS (< 48h objectif)
- K-Factor (> 1.5 objectif)
- Taux d'activation (inscription → premier produit créé)
- Taux de rétention J7, J30

---

## 3. 🤝 ÉQUIPE PARTENARIATS

### Mission
Recruter des partenaires B2B qui amènent des organisations entières sur SiteViral.

### Outils SiteViral à utiliser
| Outil | Où le trouver | Pourquoi |
|-------|---------------|----------|
| Page partenaire | `/devenir-partenaire` | Recrutement de partenaires |
| Portail partenaire | `/partner` | Suivi des organisations référées |
| Superadmin Partenaires | `/superadmin/partners` | Gestion centralisée |
| Programme de niveaux | Bronze → Argent → Or → Platine → Diamant | Motivation progressive |
| Snapshot Investisseur | `/superadmin/investor` | Données pour les présentations |

### Actions hebdomadaires

**Lundi — Prospection**
- [ ] Identifier 5 nouveaux partenaires potentiels (influenceurs, leaders communautaires, églises)
- [ ] Préparer des messages personnalisés avec le calculateur de revenus
- [ ] Vérifier le pipeline de candidatures partenaires en attente

**Mardi-Mercredi — Engagement**
- [ ] Contacter les prospects identifiés (WhatsApp prioritaire)
- [ ] Organiser 2-3 appels de démonstration
- [ ] Partager la page `/devenir-partenaire` dans les réseaux professionnels

**Jeudi — Accompagnement**
- [ ] Suivre les partenaires actifs : combien d'organisations ont-ils amenées ?
- [ ] Aider les partenaires bloqués à compléter leurs premières invitations
- [ ] Célébrer les progressions de niveau (Bronze → Argent, etc.)

**Vendredi — Reporting**
- [ ] Mettre à jour le tableau de suivi partenaires
- [ ] Calculer le revenu généré par les partenaires (part des 10% de commission)
- [ ] Identifier les partenaires à risque de churn

### KPIs à suivre
- Nombre de partenaires actifs
- Organisations amenées par partenaire/mois
- Revenu généré via le canal partenaire
- Taux de progression dans les niveaux

---

## 4. 🛟 ÉQUIPE SUPPORT

### Mission
Résoudre les problèmes rapidement et transformer les tickets en améliorations produit.

### Outils SiteViral à utiliser
| Outil | Où le trouver | Pourquoi |
|-------|---------------|----------|
| Superadmin Support | `/superadmin/support` | Gestion des tickets |
| Logs email | `/superadmin/email-logs` | Diagnostiquer les problèmes d'email |
| KYC Management | `/superadmin/kyc` | Vérification d'identité |
| Transactions | `/superadmin/transactions` | Résoudre les problèmes de paiement |
| Audit Logs | Table `audit_logs` | Tracer les actions utilisateur |
| FAQ | `/faq` | Réponses en libre-service |

### Actions hebdomadaires

**Tous les jours**
- [ ] Traiter les tickets support dans l'ordre de priorité : paiements > KYC > technique > questions
- [ ] Répondre en < 2h pour les problèmes de paiement
- [ ] Répondre en < 24h pour les questions générales
- [ ] Escalader les problèmes de fraude/AML vers le Superadmin (`/superadmin/risk`)

**Lundi — Analyse**
- [ ] Compiler les tickets de la semaine précédente par catégorie
- [ ] Identifier les 3 problèmes les plus fréquents
- [ ] Proposer des améliorations produit pour réduire ces tickets

**Mercredi — Documentation**
- [ ] Mettre à jour la FAQ avec les nouvelles questions récurrentes
- [ ] Créer/mettre à jour des réponses types pour les cas courants
- [ ] Documenter les processus de résolution pour les cas complexes

**Vendredi — KYC & Versements**
- [ ] Traiter toutes les demandes KYC en attente (Niveau 1 et 2)
- [ ] Vérifier les versements en attente et résoudre les blocages
- [ ] Vérifier les signalements de contenu (`/superadmin/reports`)

### KPIs à suivre
- Temps de réponse moyen
- Taux de résolution au premier contact
- Volume de tickets/semaine (objectif : en baisse)
- Score de satisfaction utilisateur

---

## 5. 👥 ÉQUIPE COMMUNAUTÉ

### Mission
Animer la communauté d'ambassadeurs et de créateurs pour maximiser l'engagement et la distribution virale.

### Outils SiteViral à utiliser
| Outil | Où le trouver | Pourquoi |
|-------|---------------|----------|
| Marketplace ambassadeur | `/gagner` | Découverte de produits à promouvoir |
| Programme ambassadeur | `/affiliation` | Tableau de bord des gains |
| Badges & Gamification | Table `badges` | Récompenser l'engagement |
| Annonces | `/admin/announcements` | Communiquer avec les membres |
| SocialShareKit | Composant intégré | Kits de partage pré-rédigés |
| Earnings Cards | Composant intégré | Partage de résultats |

### Actions hebdomadaires

**Lundi — Veille**
- [ ] Scanner les groupes WhatsApp communautaires pour les questions/retours
- [ ] Identifier les 5 meilleurs ambassadeurs de la semaine (par gains ou partages)
- [ ] Repérer les nouveaux ambassadeurs à accompagner

**Mardi — Animation**
- [ ] Publier un classement hebdomadaire des ambassadeurs (top 10)
- [ ] Partager 3 « success stories » de créateurs ou ambassadeurs
- [ ] Créer un défi hebdomadaire (ex : « Partagez 5 produits cette semaine, gagnez un badge »)

**Mercredi — Onboarding ambassadeurs**
- [ ] Accueillir personnellement les nouveaux ambassadeurs
- [ ] Envoyer un guide de démarrage rapide (comment obtenir son lien, où partager)
- [ ] Organiser un live Q&A hebdomadaire (WhatsApp ou Instagram)

**Jeudi — Contenu communautaire**
- [ ] Collecter des témoignages de créateurs et ambassadeurs
- [ ] Créer des « Earnings Cards » à partager pour les gagnants de la semaine
- [ ] Mettre en avant les nouveaux produits à forte commission (≥ 20%)

**Vendredi — Reconnaissance**
- [ ] Attribuer les badges aux membres méritants
- [ ] Envoyer des messages de félicitations aux créateurs ayant atteint des jalons
- [ ] Préparer le récapitulatif communautaire du week-end

### KPIs à suivre
- Nombre d'ambassadeurs actifs (avec ≥ 1 partage/semaine)
- Taux de conversion des liens ambassadeurs
- Engagement dans les groupes communautaires
- Nombre de témoignages collectés/semaine

---

## 6. ✍️ ÉQUIPE CONTENU

### Mission
Produire du contenu éducatif et inspirant qui attire, active et retient les utilisateurs.

### Outils SiteViral à utiliser
| Outil | Où le trouver | Pourquoi |
|-------|---------------|----------|
| Blog | `/blog` | SEO + éducation |
| Guides SEO | `/guide/*` | Trafic organique ciblé |
| Studio IA (en interne) | `/ecrire` | Tester et documenter le produit |
| Snippets IA | Edge Function `ai-generate-snippets` | Posts sociaux automatiques |
| Pages persona | `/pour/*` | Landing pages ciblées |

### Actions hebdomadaires

**Lundi — Planification éditoriale**
- [ ] Rechercher les mots-clés tendance en Afrique francophone (gagner de l'argent, vendre en ligne, etc.)
- [ ] Planifier 2 articles blog + 1 guide SEO pour la semaine
- [ ] Identifier les questions fréquentes des utilisateurs (via l'équipe Support)

**Mardi-Mercredi — Production**
- [ ] Rédiger 1 article blog (1 000-2 000 mots, optimisé SEO)
- [ ] Créer ou mettre à jour 1 guide SEO
- [ ] Écrire 5 posts pour les réseaux sociaux (WhatsApp, Facebook, TikTok)
- [ ] Produire 1 tutoriel vidéo court (< 2 min) sur une fonctionnalité

**Jeudi — Publication**
- [ ] Publier l'article blog avec les bonnes balises meta
- [ ] Distribuer le contenu sur tous les canaux sociaux
- [ ] Partager les tutoriels dans les groupes communautaires

**Vendredi — Analyse & Optimisation**
- [ ] Vérifier les performances des contenus publiés (vues, clics, conversions)
- [ ] Mettre à jour les pages persona sous-performantes
- [ ] Optimiser les anciens articles blog (liens internes, mots-clés)

### Types de contenu prioritaires
1. **Tutoriels** : « Comment écrire un livre en 5 minutes avec l'IA »
2. **Success stories** : « Il a gagné 500 000 FCFA en 1 mois comme ambassadeur »
3. **Comparatifs** : « SiteViral vs Gumroad vs Selar »
4. **Guides pratiques** : « Comment vendre sur Mobile Money en Afrique »
5. **Études de cas** : « Comment cette église a collecté 2M FCFA en dons »

### KPIs à suivre
- Trafic organique mensuel
- Nombre d'articles publiés/semaine
- Taux de conversion contenu → inscription
- Position moyenne Google sur les mots-clés cibles

---

## 📋 RITUEL HEBDOMADAIRE COMMUN

Chaque **lundi à 9h**, toutes les équipes partagent en 5 minutes :

| Question | Objectif |
|----------|----------|
| Quel a été notre meilleur résultat la semaine dernière ? | Célébrer |
| Quel est notre plus gros blocage actuel ? | Débloquer |
| Quelles sont nos 3 priorités cette semaine ? | Aligner |
| Quel apprentissage partageons-nous ? | Apprendre |

---

## 🔑 RÈGLES D'OR

1. **WhatsApp d'abord** — C'est le canal #1 en Afrique. Toute action doit avoir une composante WhatsApp.
2. **Montrer les résultats** — Les chiffres de gains réels des ambassadeurs et créateurs sont notre meilleure publicité.
3. **Vitesse > Perfection** — Publier vite, itérer vite. Un produit moyen publié bat un produit parfait jamais lancé.
4. **Chaque interaction = opportunité virale** — Chaque achat, chaque certificat, chaque gain doit déclencher un partage.
5. **Data-driven** — Toute décision doit être soutenue par des données du Superadmin Dashboard.
6. **Mobile-first** — 90% de nos utilisateurs sont sur mobile. Tester sur mobile avant tout.

---

## 📊 TABLEAU DE BORD PAR ÉQUIPE

| Équipe | Dashboard principal | Fréquence de vérification |
|--------|-------------------|--------------------------|
| Marketing | `/superadmin/metrics` + Google Analytics | Quotidienne |
| Growth | `/superadmin` + `/superadmin/metrics` | Quotidienne |
| Partenariats | `/superadmin/partners` + `/superadmin/investor` | 3x/semaine |
| Support | `/superadmin/support` + `/superadmin/kyc` | Continue |
| Communauté | `/gagner` + groupes WhatsApp | Quotidienne |
| Contenu | `/blog` + SEO tools externes | 3x/semaine |

---

*Document interne · SiteViral · Mis à jour le 8 mars 2026*
*Ne pas distribuer en dehors de l'équipe.*
