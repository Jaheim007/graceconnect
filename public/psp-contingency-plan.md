# PSP Contingency Plan — Siteviral

## Current PSP: Paystack

Siteviral uses Paystack as its sole licensed Payment Service Provider (PSP).

## Risk: Paystack Account Suspension

### Immediate Actions
1. **Contact Paystack compliance team** within 24h
2. **Freeze all payouts** (org + affiliate) via superadmin dashboard
3. **Notify all active organizations** via automated email template `org_suspended`
4. **Export all transaction data** from Supabase (donations, purchases, affiliate_sales)
5. **Document the suspension reason** in audit_logs

### Communication Plan
- Email all org owners within 4h of suspension
- Post status update on landing page
- Provide estimated timeline for resolution

## Future Multi-PSP Architecture (Not Implemented)

### Abstraction Layer Design
```typescript
interface PaymentProvider {
  name: string;
  initializePayment(config: PaymentConfig): Promise<PaymentSession>;
  verifyPayment(reference: string): Promise<VerificationResult>;
  createSubaccount(config: SubaccountConfig): Promise<SubaccountResult>;
  createTransferRecipient(config: RecipientConfig): Promise<RecipientResult>;
  initiateTransfer(config: TransferConfig): Promise<TransferResult>;
  getBalance(): Promise<BalanceResult>;
  getBanks(currency: string, type: string): Promise<BankList>;
}
```

### Candidate Alternative PSPs
| PSP | Regions | MoMo CI | Notes |
|-----|---------|---------|-------|
| Flutterwave | Africa-wide | Yes | Strong in Francophone Africa |
| Stripe | Global | No | Limited Africa coverage |
| CinetPay | Francophone Africa | Yes | Regional specialist |
| Wave | West Africa | Partial | Mobile-only |

### Migration Checklist (When Needed)
1. Implement `PaymentProvider` interface for new PSP
2. Add PSP selection logic per organization/country
3. Migrate subaccount equivalents
4. Update webhook handlers
5. Test with live transactions in sandbox
6. Gradual rollout (new orgs first)

## Legal Considerations
- Siteviral is NOT a financial institution
- Any PSP change requires legal review
- Data portability obligations per DPA
- Notify users 30 days before PSP change

## Decision Authority
PSP changes require approval from:
- CEO
- Legal counsel
- Technical lead

---
*Last updated: 2026-02-25*
*Status: DOCUMENTATION ONLY — No implementation required*
