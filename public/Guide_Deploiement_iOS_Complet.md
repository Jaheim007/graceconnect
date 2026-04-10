# 📱 Guide Complet — Déployer SiteViral (GraceConnect) sur iPhone avec Capacitor

### Guide étape par étape · Avril 2026

> Ce guide documente **tout le processus** pour installer l'app sur un iPhone physique depuis un Mac, y compris les problèmes courants et leurs solutions.

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#1--prérequis)
2. [Exporter le projet depuis Lovable](#2--exporter-le-projet-depuis-lovable)
3. [Cloner et installer le projet](#3--cloner-et-installer-le-projet)
4. [Ajouter la plateforme iOS](#4--ajouter-la-plateforme-ios)
5. [Ouvrir dans Xcode](#5--ouvrir-dans-xcode)
6. [Configurer la signature (Signing)](#6--configurer-la-signature-signing)
7. [Activer le Developer Mode sur l'iPhone](#7--activer-le-developer-mode-sur-liphone)
8. [Résoudre les erreurs courantes](#8--résoudre-les-erreurs-courantes)
9. [Compiler et installer sur l'iPhone](#9--compiler-et-installer-sur-liphone)
10. [Après l'installation](#10--après-linstallation)

---

## 1. 🛠 Prérequis

Avant de commencer, assurez-vous d'avoir :

| Élément | Détails |
|---------|---------|
| **Mac** | MacBook ou iMac (obligatoire pour iOS) |
| **Xcode** | Dernière version installée depuis le Mac App Store |
| **Apple ID** | Un compte Apple (gratuit suffit) |
| **iPhone** | Avec un câble USB/Lightning connecté au Mac |
| **Node.js** | Version 18+ installée sur le Mac |
| **Git** | Installé sur le Mac |

### Installer Xcode Command Line Tools

```bash
xcode-select --install
```

### Installer les simulateurs iOS (si nécessaire)

Ouvrir Xcode → **Settings** → **Platforms** → Télécharger le dernier iOS SDK.

---

## 2. 📤 Exporter le projet depuis Lovable

1. Aller sur [lovable.dev](https://lovable.dev) → votre projet
2. Cliquer sur **"Export to GitHub"** (icône GitHub en haut)
3. Choisir un nom de dépôt (ex: `graceconnect`)
4. Le projet sera poussé sur votre compte GitHub

---

## 3. 📥 Cloner et installer le projet

Ouvrir le **Terminal** sur votre Mac :

```bash
# Cloner le projet
git clone https://github.com/VOTRE-USERNAME/graceconnect.git

# Entrer dans le dossier
cd graceconnect

# Installer les dépendances
npm install
```

⏳ Attendez que l'installation soit terminée (peut prendre 2-5 minutes).

---

## 4. 📲 Ajouter la plateforme iOS

```bash
# Construire le projet
npm run build

# Ajouter iOS
npx cap add ios

# Synchroniser
npx cap sync ios
```

### ⚠️ Erreur possible : "Could not find the web assets directory"

**Solution** : Assurez-vous d'avoir fait `npm run build` **avant** `npx cap add ios`. Le dossier `dist/` doit exister.

---

## 5. 🖥 Ouvrir dans Xcode

```bash
npx cap open ios
```

Cela ouvre automatiquement le projet dans Xcode.

**Ou manuellement** : Ouvrir le fichier `ios/App/App.xcworkspace` dans Xcode.

> ⚠️ Ouvrir `.xcworkspace` (PAS `.xcodeproj`)

---

## 6. ✍️ Configurer la signature (Signing)

C'est l'étape la plus importante et celle qui cause le plus de problèmes.

### Étape 6.1 — Sélectionner la cible "App"

1. Dans Xcode, cliquer sur **"App"** dans la barre latérale gauche (l'icône bleue du projet)
2. Sélectionner la cible **"App"** (pas le projet)
3. Aller dans l'onglet **"Signing & Capabilities"**

### Étape 6.2 — Connecter votre Apple ID

1. Aller dans Xcode → **Settings** (ou `Cmd + ,`)
2. Onglet **"Accounts"**
3. Cliquer sur **"+"** en bas à gauche
4. Choisir **"Apple ID"**
5. Entrer votre Apple ID et mot de passe
6. Votre compte apparaît avec **"Personal Team"** en dessous

### Étape 6.3 — Configurer le Team

1. Retourner dans **"Signing & Capabilities"**
2. Cocher ✅ **"Automatically manage signing"**
3. Dans **"Team"**, sélectionner votre **"Personal Team"** (avec votre nom)

### Étape 6.4 — ⚠️ IMPORTANT : Changer le Bundle Identifier

> C'est ici que la plupart des erreurs se produisent !

Le **Bundle Identifier** par défaut (`app.lovable.fdcfbb7e...`) ne fonctionnera **PAS** avec un compte Apple gratuit.

**Vous devez le remplacer par un identifiant unique que VOUS inventez** :

```
com.votrenom.graceconnect
```

**Exemples valides** :
- `com.jaheim.graceconnect`
- `com.monnom.siteviral`
- `com.kouaho.graceconnect`

**Comment le changer** :
1. Dans **Signing & Capabilities**, trouver le champ **"Bundle Identifier"**
2. Effacer la valeur existante
3. Taper votre identifiant unique (ex: `com.jaheim.graceconnect`)
4. Appuyer sur **Entrée**

> 💡 **Vous n'avez PAS besoin de trouver cet identifiant quelque part — vous l'INVENTEZ vous-même.** C'est juste un nom unique au format `com.votrenom.nomapp`.

### Étape 6.5 — Cliquer sur "Try Again"

Si Xcode affiche une erreur après le changement, cliquez sur **"Try Again"**. Il va :
1. Enregistrer le nouveau Bundle ID
2. Créer un certificat de signature
3. Générer un profil de provisionnement

### Étape 6.6 — Mot de passe du Mac demandé

Xcode va vous demander votre **mot de passe Mac** (celui que vous utilisez pour vous connecter à votre ordinateur). C'est normal — il a besoin d'accéder au trousseau de clés (Keychain) pour stocker le certificat.

👉 Tapez votre mot de passe Mac → cliquez **"Toujours autoriser"** (Always Allow).

---

## 7. 📱 Activer le Developer Mode sur l'iPhone

### Sur iPhone avec iOS 16+

1. Aller dans **Réglages** → **Confidentialité et sécurité** → **Mode développeur**
2. Activer le **Mode développeur**
3. L'iPhone va **redémarrer**
4. Après le redémarrage, confirmer l'activation

### ⚠️ "Mode développeur" n'apparaît pas ?

Le menu n'apparaît **que si** l'iPhone a déjà été connecté à Xcode au moins une fois :

1. Brancher l'iPhone au Mac via USB
2. Ouvrir Xcode
3. Aller dans **Window** → **Devices and Simulators**
4. Votre iPhone doit apparaître dans la liste
5. **Maintenant**, retourner dans Réglages → le Mode développeur sera visible

### Faire confiance à l'ordinateur

Quand vous branchez l'iPhone, un popup apparaît :
- Sur l'iPhone : **"Faire confiance à cet ordinateur ?"** → Tapez **"Faire confiance"**
- Entrez votre **code PIN de l'iPhone**

---

## 8. 🔧 Résoudre les erreurs courantes

### ❌ Erreur : "Failed Registering Bundle Identifier"

**Cause** : Le Bundle Identifier est déjà pris ou invalide.

**Solution** :
1. Changer le Bundle Identifier pour quelque chose d'unique
2. Utiliser le format `com.votrenom.nomapp`
3. Cliquer sur **"Try Again"**

---

### ❌ Erreur : "No signing certificate — Xcode ne montre que le Mac"

**Cause** : Le certificat n'est pas encore créé pour iOS.

**Solution** :
1. Aller dans Xcode → **Settings** → **Accounts**
2. Sélectionner votre Apple ID
3. Cliquer sur **"Manage Certificates"**
4. Cliquer sur **"+"** en bas à gauche
5. Choisir **"Apple Development"**
6. Le certificat iOS sera créé

> 💡 C'est normal de ne voir que le Mac au début. Le certificat **"Apple Development"** couvre Mac ET iPhone.

---

### ❌ Erreur : "Could not locate device support files"

**Cause** : La version d'iOS de votre iPhone est trop récente pour votre Xcode.

**Solution** : Mettre à jour Xcode depuis le Mac App Store.

---

### ❌ Erreur : "Untrusted Developer"

Quand vous lancez l'app pour la première fois sur l'iPhone :

1. Aller dans **Réglages** → **Général** → **Gestion des appareils** (ou "VPN et gestion des appareils")
2. Trouver votre Apple ID sous "App développeur"
3. Taper dessus → **"Faire confiance"**

---

### ❌ Erreur : "iPhone is not available"

**Solutions** :
1. Débrancher et rebrancher le câble USB
2. Déverrouiller l'iPhone
3. Taper **"Faire confiance"** si demandé
4. Vérifier que le Mode développeur est activé

---

### ❌ Xcode demande un mot de passe

C'est le **mot de passe de votre Mac** (pas votre Apple ID). Xcode a besoin d'accéder au trousseau de clés pour signer l'app.

→ Tapez votre mot de passe Mac → **"Toujours autoriser"**

---

## 9. 🚀 Compiler et installer sur l'iPhone

### Étape 9.1 — Sélectionner votre iPhone

1. En haut de Xcode, à côté du bouton ▶️ (Play)
2. Cliquer sur la liste des appareils
3. Sélectionner **votre iPhone** (pas un simulateur)

### Étape 9.2 — Lancer le build

1. Cliquer sur le bouton **▶️ Play** (ou `Cmd + R`)
2. Xcode compile l'app (barre de progression en haut)
3. L'app s'installe automatiquement sur l'iPhone

### Étape 9.3 — Premier lancement

- Si l'app ne s'ouvre pas automatiquement, la chercher sur l'écran d'accueil
- Si erreur "Untrusted Developer" → voir section 8 ci-dessus

---

## 10. ⏰ Après l'installation

### ⚠️ Limitations du compte Apple gratuit

| Limitation | Détails |
|-----------|---------|
| **Expiration** | L'app expire après **7 jours** |
| **Réinstallation** | Il faut refaire `Cmd + R` dans Xcode chaque semaine |
| **3 apps max** | Maximum 3 apps installées simultanément |
| **Pas d'App Store** | Impossible de publier sur l'App Store |

### Pour publier sur l'App Store

Il faut un **Apple Developer Program** à **99 $/an** :
- [developer.apple.com/programs](https://developer.apple.com/programs)

### Mettre à jour l'app après des changements sur Lovable

```bash
# 1. Récupérer les dernières modifications
cd graceconnect
git pull

# 2. Installer les nouvelles dépendances (si nécessaire)
npm install

# 3. Construire
npm run build

# 4. Synchroniser avec iOS
npx cap sync ios

# 5. Ouvrir Xcode et lancer (Cmd + R)
npx cap open ios
```

---

## 🔄 Résumé rapide (aide-mémoire)

```
1. git clone → npm install → npm run build
2. npx cap add ios → npx cap sync ios
3. npx cap open ios
4. Xcode : Signing → Team = Personal Team
5. Changer Bundle ID → com.votrenom.nomapp
6. Brancher iPhone → Activer Developer Mode
7. Sélectionner iPhone → ▶️ Play (Cmd + R)
8. iPhone : Réglages → Faire confiance au développeur
```

---

*Guide interne · SiteViral / GraceConnect · Avril 2026*
*Basé sur l'expérience réelle de déploiement*
