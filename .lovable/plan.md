
## Problème
Deux écrans d'accueil se chevauchent :
- `/` (ActionHub) : Écrire, Vendre, Gagner, Découvrir — pour tous
- `/welcome` (WelcomeIntentPage) : Mes achats, Créer, Ajouter produits, Gagner — uniquement connectés

L'utilisateur connecté est redirigé vers `/welcome` par `useNewUserRedirect`, créant une redondance confuse.

## Solution
**Un seul hub unifié sur `/`** qui s'adapte selon l'état de connexion :

### 1. Enrichir ActionHub (adaptif)
- **Visiteur** : Écrire, Vendre, Gagner, Découvrir (comme maintenant)
- **Connecté** : Ajouter "📚 Mes achats" (si l'utilisateur a des achats), adapter les routes (ex: Vendre → `/admin/products` si org existante), afficher le nom de l'utilisateur dans le titre
- Bouton header : "Mon espace" → `/dashboard` (connecté) ou "Connexion" (visiteur)

### 2. Supprimer WelcomeIntentPage
- Supprimer `/welcome` route
- Supprimer `src/pages/WelcomeIntentPage.tsx`

### 3. Supprimer useNewUserRedirect
- Supprimer le hook et son appel dans AppLayout
- Plus de redirection forcée vers `/welcome` au login

### 4. Ajuster le post-login
- Après login, l'utilisateur revient naturellement sur `/` (ActionHub adapté) ou sur la page qu'il visitait

## Résultat
Un seul point d'entrée fluide, zéro redondance, l'utilisateur connecté voit les mêmes actions + ses achats.
