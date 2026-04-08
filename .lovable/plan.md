
# 🏗️ Plan de Simplification Totale — SiteViral

## Phase 1 : Action Hub (Point d'entrée unique)
**Objectif** : Remplacer la landing page marketing par une interface fonctionnelle immédiate

- **Nouveau composant `ActionHub`** : Page d'accueil avec 3-4 gros boutons d'action ("Écrire un livre", "Vendre un produit", "Gagner de l'argent", "Découvrir")
- **Route `/` pointe vers ActionHub** au lieu de la landing marketing
- **Landing marketing déplacée vers `/about`** pour préserver le SEO
- **Mode invité** : L'ActionHub fonctionne sans connexion — l'auth est demandée uniquement quand nécessaire

## Phase 2 : Flux de création unifié
**Objectif** : Un seul pattern d'interaction pour tout créer

- **Simplifier le WriteWizard** : Réduire les étapes visibles (topic → générer → terminé)
- **Unifier les flux de création** (livre, cours, produit) sous un même pattern visuel
- **Supprimer les menus/onglets superflus** dans les wizards
- **Résultat immédiat** : L'utilisateur voit son livre/produit en moins de 60 secondes

## Phase 3 : Navigation plate
**Objectif** : Éliminer la profondeur de navigation (30+ menus → surface plate)

- **Refonte du BottomNav** : 4 icônes max (Créer, Mes trucs, Découvrir, Profil)
- **Supprimer le menu "Plus"** : Tout ce qui est dedans devient contextuel
- **Sidebar desktop simplifiée** : Même logique plate
- **Paramètres inline** : Plus de page "Settings" dédiée — les options apparaissent là où elles sont pertinentes

## Phase 4 : Dashboard conversationnel
**Objectif** : Remplacer les tableaux de données par du langage naturel

- **Dashboard textuel** : "Tu as vendu 3 livres cette semaine (+50%). Tu as gagné 15 000 FCFA."
- **Actions contextuelles** : Sous chaque résumé, un bouton d'action pertinent
- **Suppression des tableaux complexes** pour les utilisateurs normaux (gardés uniquement en mode admin avancé)

## Phase 5 : Polissage & cohérence
**Objectif** : Uniformité visuelle totale

- **Un seul style de carte/composant** partout
- **Animations cohérentes** (même timing, même style framer-motion)
- **Typographie uniforme** : Titres, sous-titres, corps — même hiérarchie partout
- **Mode sombre/clair** vérifié sur chaque écran

---

### 📊 Impact estimé
| Métrique | Avant | Après |
|----------|-------|-------|
| Menus visibles | 30+ | 4-5 |
| Clics pour créer un livre | 8-10 | 2-3 |
| Temps avant première action | 30s+ | 5s |
| Pages à "apprendre" | 15+ | 3-4 |

### ⚠️ Ce qu'on garde structuré
- KYC / vérification d'identité (obligation légale)
- Facturation / historique de paiements
- Éditeur de contenu avancé (mais accessible uniquement si l'utilisateur le cherche)

### 🔄 Ordre d'exécution recommandé
Phase 1 → Phase 3 → Phase 2 → Phase 4 → Phase 5

On commence par le point d'entrée (ce que l'utilisateur voit en premier), puis la navigation (comment il se déplace), puis les flux (comment il crée), puis le dashboard (comment il suit), puis le polish final.
