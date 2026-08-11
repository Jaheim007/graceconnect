# Deux flows oubliés : l'Acheteur et l'Ambassadeur

Le plan précédent couvrait le créateur (créer → vendre). Il manque deux profils qui arrivent sur SiteViral sans rien créer :

- **L'Acheteur** : il a reçu un lien, il a acheté un livre / une formation / un PDF. Il revient pour lire, télécharger, suivre sa formation.
- **L'Ambassadeur** : il n'a rien à vendre ni à acheter. Il vient gagner de l'argent en partageant les produits des autres.

Aujourd'hui les briques existent (page Mes achats, inscriptions aux formations, affiliation, commissions), mais il n'y a **pas de parcours** : après connexion, l'acheteur atterrit sur un tableau de bord générique avec une barre de recherche et des catégories, et ses achats sont en 3e position dans la page.

---

## 1. Flow Acheteur — « Ma bibliothèque »

Objectif : après connexion, en moins de 3 secondes, l'acheteur voit **son** contenu et un seul bouton pour continuer.

```text
Lien reçu → Achat → Email/Succès → Connexion
                                     ↓
                        Accueil = "Reprends où tu t'es arrêté"
                                     ↓
                   [Lire mon livre]   [Continuer ma formation]
                                     ↓
                              Ma bibliothèque
                     Livres · Formations · PDF · Reçus
```

Ce qu'on construit :

1. **Carte « Reprendre »** en tout premier sur l'accueil connecté : dernier livre acheté (bouton Lire / Télécharger) ou dernière formation avec sa barre de progression et le bouton « Continuer la leçon X ». Un seul bouton principal, pas de choix.
2. **Réorganisation de l'accueil acheteur** : bibliothèque en haut, puis Explorer, puis (si concerné) rendez-vous à venir. La recherche descend, elle n'est plus la première chose vue.
3. **Renommage** « Mes achats » → « Ma bibliothèque » partout (sidebar, menu mobile, barre du bas, hub) — un acheteur ne cherche pas une facture, il cherche son livre.
4. **Bibliothèque unifiée** : la page regroupe déjà achats, formations, crédits, dons. On la restructure en onglets clairs — Livres & fichiers · Formations · Reçus — avec, pour chaque formation, la progression et le bouton Continuer.
5. **Retour après paiement** : sur la page de succès, le bouton principal mène soit à la lecture immédiate, soit à « Créer mon compte pour retrouver mon achat » si l'acheteur n'était pas connecté — et après connexion il est renvoyé directement sur sa bibliothèque.
6. **Zéro cul-de-sac** : si la bibliothèque est vide, une carte explique quoi faire (Explorer, ou devenir ambassadeur).

## 2. Flow Ambassadeur — « Gagner sans rien créer »

Objectif : un visiteur qui veut juste gagner de l'argent obtient son premier lien de partage en 1 minute, sans créer de plateforme.

```text
Arrivée → "Gagner de l'argent en partageant"
            ↓
   [Activer mon compte ambassadeur]  ← 1 tap, pas de formulaire
            ↓
   Catalogue à promouvoir (produits avec commission)
            ↓
   [Copier mon lien] / [Partager WhatsApp]
            ↓
   Suivi : clics · ventes · commissions · retrait
```

Ce qu'on construit :

1. **Entrée dédiée** : la carte « Gagner » du hub devient explicite (« Gagne une commission en partageant les livres et formations des autres ») et est visible aussi pour les visiteurs non connectés.
2. **Activation en 1 tap** sur la page Gagner : un bouton « Activer mon compte ambassadeur » qui crée le lien d'affiliation en arrière-plan (mécanisme d'auto-inscription déjà en place), sans formulaire ni KYC à cette étape.
3. **Catalogue ambassadeur** : liste des produits partageables avec la commission affichée en grand, recherche, et bouton Partager sur chaque carte qui génère le lien perso automatiquement.
4. **Premier partage guidé** : après activation, une carte « Ton premier lien » avec copie en un tap + partage WhatsApp, puis un état « en attente du premier clic ».
5. **Tableau de gains simple** : clics, ventes, commissions en attente, commissions payables, et bouton Retirer (le KYC n'est demandé qu'au moment du retrait, comme aujourd'hui pour les autres verticales).
6. **Un ambassadeur reste un acheteur** : les deux mondes cohabitent dans la même navigation — Ma bibliothèque · Explorer · Gagner — sans jamais parler de « workspace » ni de « plateforme » à ces profils.

## 3. Règle de navigation unifiée

Après connexion, l'accueil s'adapte au profil sans lui demander de choisir :

| Profil | Ce qu'il voit en premier |
| --- | --- |
| A acheté quelque chose | Reprendre la lecture / la formation |
| Ambassadeur actif | Mes gains + partager un produit |
| A une plateforme | Tableau de bord créateur (inchangé) |
| Nouveau, rien | Explorer + les deux portes : Créer / Gagner |

---

## Détails techniques

- Nouveau hook `src/hooks/useMyLibrary.ts` : agrège `product_purchases` (+ `digital_products`), `program_enrollments` (+ `programs`), `church_sermon_pdf_purchases`, et expose `items`, `counts`, `continueItem`. La progression des formations réutilise `useCourseResume`.
- Nouveaux composants sous `src/components/library/` : `ContinueCard.tsx`, `LibraryTabs.tsx`, `EmptyLibraryCard.tsx`.
- `src/pages/dashboard/PersonalHome.tsx` : réordonnancement (Continue → bibliothèque → Explorer → rendez-vous) et branchement de la carte ambassadeur si aucun achat.
- `src/pages/ResourcesPage.tsx` (`/my-purchases`) : passage en onglets, ajout de la progression et du bouton Continuer sur les formations (lecteur `LessonPlayerOverlay` déjà utilisé).
- Libellés : `src/lib/navigation/actionNavItems.ts`, `Sidebar.tsx`, `MobileMenuDrawer.tsx`, `GlobalBottomNav.tsx` → « Ma bibliothèque » / « My library ».
- Ambassadeur : nouveaux composants sous `src/components/gagner/` (`ActivateAmbassadorCard.tsx`, `AmbassadorCatalog.tsx`, `FirstLinkCard.tsx`) branchés sur `useAffiliateMarketplace` et `useAutoAffiliateCode` (RPC `self_enroll_affiliate`) — aucune nouvelle logique de commission.
- `PaymentSuccessPage.tsx` : hiérarchie des CTA (lire maintenant / retrouver mon achat) et redirection post-connexion vers `/my-purchases`.
- Aucun changement de base de données, de paiement, ni de logique de workspace. Tout est bilingue FR/EN via `useI18n`.
