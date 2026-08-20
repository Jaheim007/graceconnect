# Le playbook LTD de Mike appliqué à SiteViral

Verdict court : oui, ce playbook est jouable avec SiteViral, et ~60 % des briques existent déjà. Le playbook a été écrit pour un micro-SaaS anglophone vendu sur AppSumo ; SiteViral est un SaaS de création + une marketplace africaine à paiement Mobile Money. Deux points du playbook sont à adapter, pas à copier (voir "Ce qui ne colle pas").

## Ce qui existe déjà dans le produit

| Étape playbook | État actuel |
|---|---|
| 1. Idée éprouvée | Fait — Gumroad/Teachable/Kajabi, adaptés Wave/MoMo |
| 2. MVP | Fait et dépassé (écriture IA, formations, boutique, ambassadeurs, dons) |
| 3. Offre à vie | Existe : plan `pro_lifetime` à 80 USD, page `/founders`, compteur de places `founders_remaining`, `FounderBanner` |
| 4. Refuser le gratuit | Partiel : 20 crédits/jour gratuits + essai (voir plus bas) |
| 5. LTD privée | Manquant : pas de page LTD à accès restreint ni de codes limités hors coupons waitlist |
| 6. Contenu / SEO | Fait et solide : 133 articles, sitemap propre, llms.txt, JSON-LD, une page `/comparer` |
| 7. Marketplace (AppSumo) | Manquant : pas de système de rédemption de codes tiers |
| 8. Dernière vente privée | Manquant (dépend de 5) |
| 9. Avis Trustpilot / G2 | Manquant en externe (les avis produits internes existent) |
| 10. Passage au MRR | Partiel : abonnements Stripe/MoMo + cron en place, mais aucun tunnel "lifetime → récurrent" |

## Ce qui ne colle pas au cas SiteViral

1. **"Refuser le gratuit" ne s'applique pas au coeur du produit.** SiteViral gagne 10 % sur les ventes des créateurs : le gratuit est l'acquisition, et le créateur "paie" en vendant. Ce qu'il faut refuser, c'est le *gratuit sans friction sur les fonctions pro* (domaine, export, IA illimitée), pas l'inscription.
2. **AppSumo vend à des acheteurs US/EU en USD.** Utilisable pour la trésorerie, mais l'audience ne correspond pas au coeur (créateurs francophones d'Afrique de l'Ouest). L'équivalent local du "marketplace launch" = grosses communautés WhatsApp/Telegram/Facebook et des partenaires influenceurs — ce qui rejoint le système ambassadeurs déjà construit.

## Ce que je propose de construire

### Bloc A — Machine LTD privée (étapes 3, 5, 8)
- Une page `/lifetime/:campaign` non indexée, accessible par code, avec palier de prix, places restantes et minuteur. Alimentée par une table `ltd_campaigns` (prix, quota, dates, visibilité privée/publique).
- Codes d'accès à usage unique ou limité, générables en superadmin, traçables (qui a redeem, via quelle communauté).
- Réutilisation du checkout `pro_lifetime` existant : le montant vient de la campagne, pas d'une constante.
- Palier 2 pour la "dernière vente privée" : même moteur, autre campagne, prix plus élevé, fermeture définitive.

### Bloc B — Rédemption de codes marketplace (étape 7)
- Table `redemption_codes` + page `/redeem` : l'acheteur AppSumo/partenaire saisit son code et obtient le plan à vie sans passer par Stripe.
- Support du stacking (1 code = 1 palier), et attribution de la campagne source.

### Bloc C — SEO comparatif (étape 6, l'angle qui manque)
- Un modèle de page `/comparer/siteviral-vs-:concurrent` généré depuis un fichier de données (Gumroad, Teachable, Systeme.io, Podia, Kajabi, Selar, Paystack Storefront…), avec tableau de comparaison, section réponse directe et JSON-LD. Ajout au sitemap.
- Pages "alternative à X" ciblant les requêtes de sortie de concurrent.

### Bloc D — Preuve sociale externe (étape 9)
- Après une première vente réussie côté créateur, e-mail automatique de demande d'avis vers Trustpilot (et G2 si compte ouvert), avec cadence anti-spam et un seul rappel.
- Widget d'avis sur la landing alimenté par les avis internes déjà collectés en attendant le volume externe.

### Bloc E — Conversion lifetime → MRR (étape 10)
- Le lifetime couvre le socle ; les extensions consommables restent payantes (crédits IA, domaines additionnels, sièges, e-mails de masse). Bandeau contextuel et upsell dans `/billing`.
- Tableau de bord superadmin : encaissé LTD, MRR, churn, part des lifetime ayant pris un module récurrent.

## Ordre d'exécution conseillé

1. Bloc A (trésorerie immédiate, s'appuie sur ce qui existe)
2. Bloc C (le SEO met 2-3 mois à sortir, donc à démarrer tôt)
3. Bloc D
4. Bloc B (seulement si une marketplace est réellement engagée)
5. Bloc E

## Notes techniques

- Nouvelles tables `ltd_campaigns`, `ltd_access_codes`, `redemption_codes` : GRANTs + RLS superadmin-only dans la même migration, lecture publique limitée à la campagne active via RPC security-definer.
- `create-platform-subscription` et `create-paystack-subscription` doivent lire le montant depuis la campagne au lieu de la constante `pro_lifetime` codée en dur ; les webhooks existants restent inchangés.
- Les pages comparatives sont statiques côté données (fichier TS), donc zéro coût IA et pré-rendu bot déjà géré par `share-meta`.
- Les e-mails d'avis passent par la fonction `send-email` existante et le moteur d'activation, pas de nouvelle infrastructure.

## Question ouverte

Le prix lifetime actuel est de 80 USD, unique. Le playbook suppose des paliers montants (ex. 49 → 79 → 129). À caler avant de construire le Bloc A.
