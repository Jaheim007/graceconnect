# Un seul utilisateur, trois casquettes : le flow unifié

Tu as raison, et c'est le vrai problème : aujourd'hui le code force l'utilisateur dans **un seul rôle exclusif**, alors qu'une même personne est souvent acheteur + ambassadeur + créateur en même temps.

## Diagnostic (vérifié dans le code)

| Endroit | Ce qu'il fait aujourd'hui | Pourquoi c'est faux |
| --- | --- | --- |
| `useUserProfile.ts` | Retourne UN profil : si org → `creator`, sinon si lien d'affiliation → `ambassador`, sinon `buyer` | Un créateur qui a acheté un livre est classé « creator » : sa bibliothèque disparaît |
| `useUserKind.ts` | `provider` / `buyer` / `new`, exclusifs, et les achats ne sont même pas vérifiés si l'utilisateur a une org | Même angle mort |
| `DashboardRouter.tsx` | Si une org existe → redirection immédiate vers `/admin` | Le créateur ne peut plus atteindre ses achats ni ses gains depuis l'accueil |
| `WelcomeIntentPage.tsx` | Fait choisir UNE intention, enregistrée dans `profiles.onboarding_intent` | Enferme l'utilisateur dans un rôle dès le départ |
| `PersonalHome.tsx` | Rendue seulement quand l'utilisateur n'a aucune org | Les acheteurs-créateurs ne la voient jamais |

Conclusion : le problème n'est pas « il manque un flow acheteur » ni « il manque un flow ambassadeur ». Le problème est **l'exclusivité des rôles**. La bonne architecture est un accueil unique, adaptatif, où chaque casquette apparaît dès qu'un signal existe, et disparaît quand elle n'a pas de sens.

---

## Le modèle : 3 capacités, pas 3 utilisateurs

Chaque utilisateur possède 3 capacités indépendantes, cumulables :

```text
              APPRENDRE            GAGNER              CRÉER
              (acheteur)        (ambassadeur)        (créateur)
signal :   1 achat / 1 formation  1 lien d'affiliation   1 espace
surface :  Ma bibliothèque        Gagner                 Mon espace
```

Un seul accueil : `/dashboard`. Il montre des blocs, un par capacité active, dans un ordre déterminé par la **dernière action réelle** de l'utilisateur — pas par un rôle figé.

```text
Connexion → /dashboard (accueil unique)
   │
   ├─ Bloc "Reprendre"      → si achat ou formation en cours (le plus récent)
   ├─ Bloc "Mon espace"     → si espace existant (ventes du jour, action suivante)
   ├─ Bloc "Mes gains"      → si ambassadeur (commissions, partager un produit)
   └─ Bloc "Débloquer"      → les capacités encore inactives, 1 tap chacune
```

## Règles d'or du flow

1. **Aucune redirection automatique qui masque les autres casquettes.** `/dashboard` reste l'accueil pour tout le monde, y compris ceux qui ont un espace ; `/admin` devient une destination, plus une redirection forcée.
2. **L'ordre suit l'activité, pas le rôle.** Si tu as vendu hier, l'espace est en haut ; si tu lis un livre, la lecture est en haut. Une seule règle : le bloc le plus récemment utilisé passe premier.
3. **Une capacité ne s'affiche jamais vide.** Pas d'achat = pas de bloc bibliothèque, mais une carte « Débloquer » discrète.
4. **Ajouter une casquette = 1 tap, jamais un formulaire.** Devenir ambassadeur = un bouton. Créer un espace = le flow existant. Acheter = Explorer.
5. **Navigation unique et stable** pour tous : Accueil · Ma bibliothèque · Explorer · Gagner · Mon espace (ce dernier n'apparaît que s'il existe). Aucun libellé technique (« workspace », « features »).
6. **Plus de choix d'intention bloquant.** `/welcome-intent` devient facultatif et n'enferme plus l'utilisateur : l'intention choisie ne fait que trier les blocs de l'accueil.

## Ce qu'on construit

### A. Le socle : capacités cumulables
Remplacer la classification exclusive par un hook `useUserCapabilities` qui renvoie `{ canLearn, canEarn, canCreate }` + les données de tête de chaque bloc (dernier contenu à reprendre, gains en attente, espace actif) et un `primaryCapability` calculé sur la dernière activité. `useUserProfile` / `useUserKind` sont conservés en façade pour ne rien casser, mais réimplémentés au-dessus du nouveau hook.

### B. L'accueil unifié
`/dashboard` rend toujours l'accueil adaptatif (plus de saut vers `/admin`). Trois blocs autonomes :
- **Reprendre** : dernier livre (Lire / Télécharger) ou dernière formation avec progression et « Continuer la leçon X ».
- **Mon espace** : chiffre du jour, prochaine action utile, accès à l'admin.
- **Mes gains** : commissions en attente, bouton « Partager un produit » qui génère le lien perso.
Plus une rangée « Débloquer » pour les capacités inactives.

### C. Le flow Acheteur (complété)
- « Mes achats » devient **Ma bibliothèque**, en onglets : Livres & fichiers · Formations · Reçus, avec progression et bouton Continuer.
- Accessible pour tous, y compris les créateurs.
- Après paiement : lecture immédiate si connecté ; sinon « Crée ton compte pour retrouver ton achat » puis retour direct sur la bibliothèque.

### D. Le flow Ambassadeur (complété)
- Activation en 1 tap (« Activer mon compte ambassadeur »), sans formulaire, KYC seulement au retrait.
- Catalogue de produits partageables avec la commission affichée, bouton Partager qui crée le lien automatiquement.
- Carte « Ton premier lien » avec copie et partage WhatsApp, puis suivi clics / ventes / commissions.

### E. Le flow Créateur (préservé)
Inchangé dans son fonctionnement, mais il cesse d'être exclusif : le créateur garde sa bibliothèque et ses gains visibles depuis l'accueil.

---

## Détails techniques

- Nouveau `src/hooks/useUserCapabilities.ts` : agrège en une passe `product_purchases`, `program_enrollments`, `church_sermon_pdf_purchases`, `affiliate_links`, `partner_commissions` et les orgs manageables de `OrgContext`. Réutilise `useCourseResume` pour la progression.
- `useUserProfile.ts` et `useUserKind.ts` : réécrits comme adaptateurs au-dessus de `useUserCapabilities` (mêmes signatures, aucun appel à corriger ailleurs).
- `src/pages/DashboardRouter.tsx` : suppression du `Navigate to="/admin"` forcé ; sélection de l'org courante conservée, mais l'accueil adaptatif est rendu dans tous les cas.
- `src/pages/dashboard/PersonalHome.tsx` : devient l'accueil unifié, composé de nouveaux blocs `src/components/home/ContinueBlock.tsx`, `SpaceBlock.tsx`, `EarningsBlock.tsx`, `UnlockRow.tsx`, ordonnés par `primaryCapability`.
- `src/pages/ResourcesPage.tsx` (`/my-purchases`) : passage en onglets + progression + Continuer (via `LessonPlayerOverlay` déjà en place).
- Ambassadeur : `src/components/gagner/ActivateAmbassadorCard.tsx`, `AmbassadorCatalog.tsx`, `FirstLinkCard.tsx` branchés sur `useAffiliateMarketplace` et `useAutoAffiliateCode` (RPC `self_enroll_affiliate`) — aucune nouvelle logique de commission.
- Libellés « Ma bibliothèque » / « My library » dans `src/lib/navigation/actionNavItems.ts`, `Sidebar.tsx`, `MobileMenuDrawer.tsx`, `GlobalBottomNav.tsx`, et ajout de l'entrée Gagner pour tous les connectés.
- `PaymentSuccessPage.tsx` : hiérarchie des CTA et redirection post-connexion vers la bibliothèque.
- `WelcomeIntentPage.tsx` : l'intention devient un simple tri, plus un aiguillage bloquant.
- Aucun changement de base de données, de paiement, de commissions ni de logique d'espace. Tout bilingue FR/EN via `useI18n`, mobile d'abord.
