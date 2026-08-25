# SiteViral Affiliate Cloud — ouvrir l'affiliation + KYC + payouts à nos autres plateformes

## Réponse courte

Oui, c'est faisable — mais **pas tel quel aujourd'hui**. Le moteur d'affiliation existe et il est bon (attribution cookie 7j + last-click, commissions par produit ou par org, `affiliate_sales`, digest ambassadeur, demandes de payout, KYC avant payout, Stripe + Mobile Money). Le blocage n'est pas la qualité du moteur, c'est **où il est branché** : aujourd'hui la commission est calculée à l'intérieur du tunnel de paiement SiteViral (`_shared/process-transaction.ts`), donc elle n'existe que si l'argent passe par SiteViral et si la vente est liée à une `organization_id` + un produit SiteViral.

Pour Noctely ou un SaaS externe, l'argent ne passe pas par nous. Il faut donc découpler le moteur en un service à part : **SiteViral Affiliate Cloud** — un service multi-tenant piloté par API, où la plateforme cliente déclare ses conversions et nous gérons les ambassadeurs, le calcul, le KYC et les paiements.

## Ce qui existe déjà et se réutilise tel quel

- Attribution : `useAffiliateCapture` (cookie 7j + localStorage, last-click), `track_affiliate_click`, liens courts avec attribution.
- Comptabilité : `affiliate_links`, `affiliate_sales`, compteurs atomiques (`increment_affiliate_link_stats`), délai de 15 jours avant disponibilité.
- Payouts : `request-affiliate-payout`, `process-payout`, `create-transfer-recipient`, seuil minimum, payouts manuels superadmin.
- KYC/KYB : `kyc_submissions`, analyse auto (`kyc-analyze-document`, `kyc-auto-validate`), dialogue de refus enrichi, verrou payout avant vérification.
- Paiements : Stripe (cartes, abonnements) + GeniusPay (Wave, Orange, MTN, Moov, XOF…) — c'est notre vrai avantage face aux plateformes d'affiliation classiques.
- Socle multi-tenant partiel : `api_keys` (avec scopes + hash), `public-api` (v1 products/orders/analytics), `org_webhooks` + `outgoing-webhook` signés HMAC.

## Les 5 vraies contraintes à lever

1. **Commission couplée au paiement.** Le calcul vit dans `process-transaction`. Il faut l'extraire dans un moteur neutre qui accepte une conversion venue de l'extérieur (montant, devise, référence, code ambassadeur) sans exiger de produit SiteViral.
2. **Tenant = organisation SiteViral.** Tout est scopé `organization_id`. Il faut une notion de « programme » appartenant à une plateforme cliente (Noctely, SaaS X), distincte d'une boutique SiteViral.
3. **Financement des payouts.** Si l'argent ne passe pas par nous, nous ne pouvons pas payer les ambassadeurs avec de l'argent que nous n'avons pas. Deux modes : *wallet prépayé* (la plateforme approvisionne un solde, nous payons) ou *reporting seul* (nous calculons et exposons, la plateforme paie elle-même).
4. **Attribution cross-domaine.** Le cookie est first-party sur siteviral.com. Pour un domaine tiers il faut un petit SDK JS (`affiliate.js`) qui pose le cookie sur *leur* domaine et ping notre endpoint de clic.
5. **Responsabilité légale / MoR.** Dès que nous versons des commissions pour le compte d'un tiers, nous devenons agent de paiement : anti-fraude, conservation KYC, seuils AML, contrat B2B, refacturation. C'est le point le plus lourd, plus lourd que le code.

## Architecture proposée (Affiliate Cloud)

```text
Plateforme cliente (Noctely, SaaS X, site externe)
   |  1. affiliate.js  -> POST /v1/affiliate/click      (attribution, cookie 1st-party)
   |  2. serveur        -> POST /v1/affiliate/conversion (montant, ref, code)  [Idempotency-Key]
   v
SiteViral Affiliate Cloud (Edge Functions + Postgres)
   - programmes, ambassadeurs, liens, règles de commission
   - moteur de calcul neutre (extrait de process-transaction)
   - KYC/KYB réutilisé
   - payouts : wallet prépayé  OU  reporting seul
   |
   +-> webhooks signés HMAC vers la plateforme (conversion.approved, payout.paid)
   +-> portail ambassadeur en marque blanche (sous-domaine ou iframe)
```

## Découpage en phases

**Phase 0 — décision produit (avant tout code)**
Choisir : (a) usage interne seulement (Noctely + nos SaaS), ou (b) produit vendu à des tiers. Et choisir le mode payout par défaut : wallet prépayé ou reporting seul.

**Phase 1 — extraire le moteur**
Sortir le calcul de commission de `process-transaction` vers un module partagé neutre. SiteViral et les programmes externes appellent le même code. Aucun changement fonctionnel visible côté SiteViral.

**Phase 2 — modèle multi-programme**
Nouvelles tables : `affiliate_programs` (propriétaire, plateforme, devise, règles, mode payout), `affiliate_conversions` (source externe, idempotence, statut), rattachement des `affiliate_links` à un programme. RLS + GRANT stricts, isolation par programme.

**Phase 3 — API publique v1 affiliation**
Étendre `public-api` avec les scopes `affiliate:read` / `affiliate:write` : créer un ambassadeur, générer un lien, déclarer un clic, déclarer une conversion (idempotente), lister les commissions et les payouts. Webhooks sortants réutilisés.

**Phase 4 — SDK d'attribution cross-domaine**
`affiliate.js` léger, hébergé chez nous, à coller sur le site client : pose le cookie, gère `?ref=`, ping le clic, expose `SVAffiliate.track()`.

**Phase 5 — payouts et KYC en marque blanche**
Wallet de programme (approvisionnement, solde, débit à chaque payout), réutilisation du flux KYC + payouts existant, portail ambassadeur en marque blanche.

**Phase 6 — anti-fraude et conformité**
Détection auto-référencement, clics dupliqués, remboursements (clawback), plafonds par programme, contrat B2B + politique de payout.

## Détails techniques

- Le moteur extrait reste appelé par `process-transaction` pour ne rien casser côté SiteViral (aucune régression sur les ventes actuelles).
- Idempotence obligatoire sur `/v1/affiliate/conversion` via `Idempotency-Key` + contrainte unique `(program_id, external_reference)`.
- Réutilisation de `authenticateApiKey` avec de nouveaux scopes, et de `outgoing-webhook` (HMAC SHA-256) pour notifier la plateforme cliente.
- Les colonnes `paystack_reference` restent inchangées (héritage GeniusPay) ; les conversions externes utilisent `external_reference`.
- Chaque nouvelle table publique reçoit ses `GRANT` explicites + RLS scopée au programme.

## Mon avis

Techniquement, c'est un chantier de plateforme, pas un patch : le moteur est prêt à 70 %, l'API et le multi-tenant à 30 %, le juridique/payout à 0 %. Le chemin le plus rentable est de commencer **interne** (Noctely comme premier client, mode *reporting seul*, pas de wallet), valider l'API et le SDK sur un cas réel, puis n'ouvrir aux tiers qu'après avoir traité l'anti-fraude et le cadre légal.
