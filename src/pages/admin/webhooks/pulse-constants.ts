export const WEBHOOK_EVENT_GROUPS = [
  {
    key: 'payments',
    icon: '💰',
    labelFr: 'Paiements',
    labelEn: 'Payments',
    events: [
      { value: 'purchase.completed', labelFr: 'Achat complété', labelEn: 'Purchase completed', descFr: 'Déclenché quand un paiement réussit', descEn: 'Triggered when a payment succeeds' },
      { value: 'purchase.failed', labelFr: 'Achat échoué', labelEn: 'Purchase failed', descFr: 'Déclenché quand un paiement échoue', descEn: 'Triggered when a payment fails' },
    ],
  },
  {
    key: 'donations',
    icon: '🎁',
    labelFr: 'Dons',
    labelEn: 'Donations',
    events: [
      { value: 'donation.received', labelFr: 'Don reçu', labelEn: 'Donation received', descFr: 'Déclenché quand un don est reçu', descEn: 'Triggered when a donation is received' },
    ],
  },
  {
    key: 'members',
    icon: '👥',
    labelFr: 'Membres',
    labelEn: 'Members',
    events: [
      { value: 'member.joined', labelFr: 'Nouveau membre', labelEn: 'New member', descFr: 'Déclenché quand un membre rejoint', descEn: 'Triggered when a member joins' },
    ],
  },
  {
    key: 'affiliates',
    icon: '🤝',
    labelFr: 'Ambassadeurs',
    labelEn: 'Ambassadors',
    events: [
      { value: 'affiliate.sale', labelFr: 'Vente ambassadeur', labelEn: 'Ambassador sale', descFr: 'Déclenché quand un ambassadeur génère une vente', descEn: 'Triggered when an ambassador generates a sale' },
      { value: 'payout.requested', labelFr: 'Payout demandé', labelEn: 'Payout requested', descFr: 'Déclenché quand un retrait est demandé', descEn: 'Triggered when a payout is requested' },
    ],
  },
  {
    key: 'subscriptions',
    icon: '📦',
    labelFr: 'Abonnements',
    labelEn: 'Subscriptions',
    events: [
      { value: 'subscription.started', labelFr: 'Abonnement créé', labelEn: 'Subscription started', descFr: 'Déclenché quand un abonnement démarre', descEn: 'Triggered when a subscription starts' },
    ],
  },
];

export const ALL_EVENTS = WEBHOOK_EVENT_GROUPS.flatMap(g => g.events);

export const SAMPLE_PAYLOADS: Record<string, Record<string, unknown>> = {
  'purchase.completed': { transaction_id: 'test-txn-001', reference: 'SV-TEST-001', type: 'product', amount: 5000, currency: 'XOF', product_id: 'test-product', buyer_name: 'Test Buyer', buyer_email: 'test@example.com' },
  'purchase.failed': { transaction_id: 'test-txn-002', reference: 'SV-TEST-002', type: 'product', amount: 3000, currency: 'XOF', error: 'insufficient_funds' },
  'donation.received': { transaction_id: 'test-txn-003', reference: 'SV-TEST-003', type: 'donation', amount: 2000, currency: 'XOF', donor_name: 'Test Donor', campaign_id: 'test-campaign' },
  'affiliate.sale': { transaction_id: 'test-txn-004', affiliate_link_id: 'test-link', commission_amount: 500, gross_amount: 5000, currency: 'XOF' },
  'member.joined': { user_id: 'test-user-001', role: 'member', joined_at: new Date().toISOString() },
  'payout.requested': { payout_request_id: 'test-payout-001', payout_type: 'affiliate', amount: 10000, currency: 'XOF' },
  'subscription.started': { subscription_id: 'test-sub-001', plan: 'pro', amount: 9900, currency: 'XOF' },
};
