# SiteViral — Flow utilisateur optimal (refonte simplicité)

## 1. Ce qu'est réellement le produit

Déduit du code : SiteViral est une **plateforme africaine de création et de monétisation de contenu**. Un utilisateur crée un livre, une formation ou un espace Église/ONG avec l'IA, puis le vend ou reçoit des dons — paiement carte (Stripe) ou Mobile Money (Paystack), commission 10% en gratuit, 0% en Pro.

- **Utilisateurs** : créateurs/coachs/pasteurs/ONG, majoritairement mobile, non techniques.
- **Problème résolu** : produire et vendre un produit numérique sans compétences, sans site, sans agence.
- **Fonction principale** : le pipeline IA → produit publié → lien de vente.
- **Vraie valeur** : *« mon premier revenu numérique en une soirée »*.

## 2. Audit du flow actuel (frictions vérifiées)

- `/` = `ActionHub` avec **6 tuiles pour un visiteur** dont 3 sont des actions de création concurrentes (livre, formation, Église/ONG) + Vendre + Gagner + Découvrir. L'utilisateur doit choisir sans savoir ce qui l'attend.
- Le wizard livre (`WriteWizard`) a **11 étapes** (Source, Détails, Stratégie, Création, Aperçu, Illustrations, Couverture, Prix, Aperçu PDF, Publication, Célébration). Trop long avant la première récompense.
- Création de plateforme (`CreateOrgPage`) = **3 étapes** (profil, nom, devise) avant toute création de contenu ; la devise est déjà auto-détectée, donc l'étape est presque inutile.
- Après création : modale `OrgOnboardingWizard` **puis** `/admin` **puis** navigation → 3 couches avant d'agir.
- Formation (`AdminProgramForm`) n'est pas un flow guidé mais un écran à onglets (925 lignes) ; le seul vrai verrou est « prix ou gratuit ».
- Navigation : sidebar générée par features + **5 à 6 destinations « compte » fixes** + réglages/superadmin. Trop de portes pour un débutant.
- Résultat : deux menus (ActionHub + sidebar) qui se recoupent, deux vocabulaires (Vendre / Revenus / Gagner), aucune notion d'« étape suivante unique ».

## 3. Flow optimal — 6 étapes

1. **Arrivée** — une seule question, trois choix maximum : *Un livre · Une formation · Un espace Église/ONG*. Il comprend : « je choisis ce que je veux créer ». Résultat : intention captée en < 10 s.
2. **Une seule saisie** — « De quoi ça parle ? » (texte, photo d'écriture, ou audio). Il comprend : « je parle, l'IA fait le reste ». Résultat : la génération démarre.
3. **Génération visible** — barre de progression + aperçu qui se remplit. Il comprend : « ça se fabrique pour moi ». Résultat : effet wow, il attend au lieu d'abandonner.
4. **Aperçu du résultat** — son livre/formation réel, avec couverture générée. Un seul bouton : *Publier*. Résultat : preuve de valeur avant tout effort.
5. **Prix en un geste** — 3 prix suggérés + « gratuit ». Le compte et l'espace sont créés **en arrière-plan** (nom = titre du produit, devise auto). Résultat : publié.
6. **Lien de vente + partage** — lien copiable, boutons WhatsApp, et une seule prochaine action. Résultat : il peut encaisser.

Illustrations, stratégie éditoriale, aperçu PDF, nombre de chapitres : déplacés **après** publication, dans « Améliorer ».

## 4. Version « débutant absolu »

- Une question par écran, une seule action primaire visible.
- Zéro jargon : plus de « workspace », « organisation », « features », « modules ». On dit *mon espace*, *mon livre*, *mes ventes*.
- Aucun formulaire long : tout ce qui peut être deviné est deviné (devise, langue, nom d'espace, catégorie).
- Après publication : un seul encart « Ta prochaine étape » (une seule tâche à la fois).

## 5. Simplification radicale (−50%)

**Supprimer de la vue par défaut** : étape Stratégie éditoriale, étape Illustrations, étape Aperçu PDF, étape Devise, choix « objectif », tuile *Gagner* pour les visiteurs, doublon *Vendre*/*Revenus*.
**Fusionner** : *Vendre* + *Revenus* → **Ventes** ; *Découvrir* + *Explore* → **Découvrir** ; livre et formation → un seul point d'entrée **Créer**.
**Automatiser** : création de l'espace, devise, langue, nom, catégorie, couverture, prix suggéré, choix KYC/KYB (déjà déduit de la catégorie).
**Rendre invisible** : Paramètres avancés, API/Webhooks, promos, expériences, popups — regroupés derrière « Avancé ». Vérification d'identité affichée **uniquement** au moment du retrait.

## 6. UX « waouh »

- Aperçu qui se remplit ligne par ligne pendant la génération (perception de magie).
- Confettis + son court à la publication, puis lien de vente déjà copié dans le presse-papier.
- Micro-feedback : validation ✓ animée, boutons qui répondent au tap (scale 0.98), squelettes au lieu de spinners.
- Messages courts et humains : « Ton livre est prêt. Mets-le en vente. » / « Ton premier lien de vente est prêt à être partagé. »
- Transitions directionnelles (avance = glisse à gauche) pour donner un sens au parcours.

## 7. Mobile

- Une action primaire fixe en bas de l'écran (pleine largeur, pouce).
- 3 onglets seulement : **Créer · Découvrir · Mes ventes** (profil dans l'avatar).
- Champs à saisie minimale : chips au lieu de listes déroulantes, dictée vocale mise en avant.
- Sheets glissables plutôt que pages, retour toujours possible sans perdre le brouillon (déjà auto-sauvegardé).

## 8. Conversion

- Génération **avant** inscription : l'utilisateur voit son résultat, puis on demande le compte pour publier (l'infrastructure de reprise post-login existe déjà).
- Prix suggérés + estimation de revenus (« 10 ventes = X FCFA ») à l'étape prix.
- Relance des brouillons non publiés (moteur d'e-mails existant) : « Ton livre attend, il ne manque que le prix. »
- Un seul CTA par écran, aucun lien secondaire concurrent.
- Après première publication : proposer *Créer un deuxième produit* et *Gagner en partageant* (là seulement).

## 9. Flow « 1 minute wow »

`0:00` choisir *Un livre* → `0:10` dire le sujet → `0:15` génération animée → `0:45` aperçu réel → `0:50` prix en un tap → `0:60` lien de vente prêt à partager.

## 10. Règles d'or

1. Une question par écran, une seule action primaire.
2. Le résultat avant l'effort : générer puis demander (compte, prix, réglages).
3. Tout ce qui peut être deviné n'est jamais demandé.
4. Deux menus = un menu ; deux mots pour la même chose = un mot.
5. Jamais plus d'une « prochaine étape » affichée.

## Détails techniques (implémentation)

- **ActionHub** (`src/pages/ActionHub.tsx`) : réduire à 3 tuiles visiteur (Créer, Découvrir, Église/ONG) ; déplacer Vendre/Gagner/Revenus derrière l'état connecté.
- **WriteWizard** (`src/components/write/WriteWizard.tsx`) : passer de 11 à 5 écrans visibles (Source → Génération → Aperçu → Prix → Partage) ; Stratégie / Illustrations / Cover avancée / Aperçu PDF déplacés dans un mode « Améliorer » post-publication, sans supprimer les composants existants.
- **CreateOrgPage** (`src/pages/CreateOrgPage.tsx`) : supprimer l'étape devise (déjà auto-détectée) ; création implicite via `createWorkspace()` déclenchée par la publication, avec nom dérivé du titre et renommage possible plus tard.
- **Navigation** (`src/lib/navigation/*`, `Sidebar.tsx`, `GlobalBottomNav.tsx`) : fusionner *Vendre* + *Revenus* en **Ventes**, *Explore* + *Découvrir* en **Découvrir** ; regrouper les items techniques sous « Avancé ».
- **Formations** (`src/pages/admin/AdminProgramForm.tsx`) : ajouter un chemin guidé Générer → Aperçu → Prix → Publier, en gardant les onglets comme mode avancé.
- **Vérification** (`verificationFlow.ts`) : afficher KYC/KYB uniquement à l'étape retrait, jamais pendant la création.

Livraison suggérée par lots : (A) entrée + navigation fusionnée, (B) wizard livre 5 écrans + création d'espace implicite, (C) chemin guidé formation + polish waouh/mobile.
