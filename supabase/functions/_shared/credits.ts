import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type CreditTier = 'standard' | 'premium';

export function normalizeTier(input: unknown): CreditTier {
  return input === 'premium' ? 'premium' : 'standard';
}

export async function getActionCost(
  admin: ReturnType<typeof createClient>,
  actionKey: string,
  tier: CreditTier,
): Promise<{ cost: number; label: string }> {
  const { data, error } = await admin
    .from('credit_action_pricing')
    .select('cost_standard, cost_premium, action_label')
    .eq('action_key', actionKey)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error(`Action pricing not found for ${actionKey}`);
  }

  const cost = tier === 'premium' ? Number((data as any).cost_premium) : Number((data as any).cost_standard);
  return { cost, label: (data as any).action_label || actionKey };
}

export async function alreadyCharged(
  admin: ReturnType<typeof createClient>,
  userId: string,
  actionKey: string,
  idempotencyKey: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from('credit_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('action_key', actionKey)
    .contains('metadata', { idempotency_key: idempotencyKey })
    .limit(1);

  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

export async function consumeCreditsOrThrow(opts: {
  admin: ReturnType<typeof createClient>;
  userId: string;
  actionKey: string;
  tier: CreditTier;
  amountOverride?: number;
  labelOverride?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ debited: number; balance: number } | { skipped: true }> {
  const { admin, userId, actionKey, tier } = opts;
  const meta = { ...(opts.metadata || {}), tier };

  if (opts.idempotencyKey) {
    const hit = await alreadyCharged(admin, userId, actionKey, opts.idempotencyKey);
    if (hit) return { skipped: true };
    (meta as any).idempotency_key = opts.idempotencyKey;
  }

  const { cost, label } = await getActionCost(admin, actionKey, tier);
  const amount = typeof opts.amountOverride === 'number' ? opts.amountOverride : cost;

  const { data, error } = await admin.rpc('consume_credits', {
    _user_id: userId,
    _amount: amount,
    _action_key: actionKey,
    _action_label: opts.labelOverride || label,
    _metadata: meta as any,
  });

  if (error) throw new Error(error.message);

  const result = data as any;
  if (!result?.ok) {
    const reason = result?.reason || 'credit_error';
    if (reason === 'insufficient_credits') {
      const bal = Number(result?.balance || 0);
      const req = Number(result?.required || amount);
      const err = new Error(`Crédits insuffisants (${bal.toFixed(1)} disponibles, ${req.toFixed(1)} requis)`);
      (err as any).status = 402;
      throw err;
    }
    const err = new Error(reason);
    (err as any).status = 400;
    throw err;
  }

  return { debited: Number(result.debited || amount), balance: Number(result.balance || 0) };
}

export async function refundCreditsAsBonus(opts: {
  admin: ReturnType<typeof createClient>;
  userId: string;
  amount: number;
  source: string;
  expiresInDays?: number;
  metadata?: Record<string, unknown>;
}) {
  // Best-effort refund: grant bonus credits (time-limited)
  await opts.admin.rpc('grant_bonus_credits', {
    _user_id: opts.userId,
    _amount: opts.amount,
    _source: `refund:${opts.source}`,
    _expires_in_days: opts.expiresInDays ?? 7,
  });
}

/**
 * Debit credits, run an async action, and auto-refund if the action fails.
 * This prevents users from losing credits on system/AI errors.
 */
export async function consumeCreditsWithRefund<T>(opts: {
  admin: ReturnType<typeof createClient>;
  userId: string;
  actionKey: string;
  tier: CreditTier;
  action: () => Promise<T>;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}): Promise<T> {
  const { admin, userId, actionKey, tier, action } = opts;

  // Debit first
  const debitResult = await consumeCreditsOrThrow({
    admin, userId, actionKey, tier,
    idempotencyKey: opts.idempotencyKey,
    metadata: opts.metadata,
  });

  // If idempotency skipped, still run the action
  const debited = 'skipped' in debitResult ? 0 : debitResult.debited;

  try {
    return await action();
  } catch (err) {
    // Auto-refund on failure (best-effort, don't mask original error)
    if (debited > 0) {
      try {
        console.warn(`[credit-refund] Refunding ${debited} credits to ${userId} for failed ${actionKey}`);
        await refundCreditsAsBonus({
          admin, userId,
          amount: debited,
          source: actionKey,
          expiresInDays: 30,
          metadata: { reason: 'auto_refund_on_failure', error: String(err).slice(0, 200) },
        });
      } catch (refundErr) {
        console.error(`[credit-refund] Failed to refund:`, refundErr);
      }
    }
    throw err;
  }
}
