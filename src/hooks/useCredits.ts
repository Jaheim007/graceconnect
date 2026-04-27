import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CreditSummary {
  balance: number;
  daily_remaining: number;
  daily_expires_at: string | null;
  bonus_remaining: number;
  purchased_remaining: number;
  lifetime_earned: number;
  lifetime_spent: number;
  last_daily_grant: string | null;
}

export interface ActionPricing {
  action_key: string;
  action_label: string;
  category: string;
  cost_standard: number;
  cost_premium: number;
  description: string | null;
  is_active: boolean;
}

export interface CreditPack {
  id: string;
  pack_key: string;
  name: string;
  credits: number;
  price_xof: number;
  bonus_percent: number;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
}

// ─── Credit Summary ───
export function useCreditsBalance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credits', 'summary', user?.id],
    queryFn: async (): Promise<CreditSummary> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_credit_summary', {
        _user_id: user.id,
      });

      if (error) throw error;
      return data as unknown as CreditSummary;
    },
    enabled: !!user,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

// ─── Action Pricing ───
export function useActionPricing() {
  return useQuery({
    queryKey: ['credits', 'pricing'],
    queryFn: async (): Promise<ActionPricing[]> => {
      const { data, error } = await supabase
        .from('credit_action_pricing')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return (data || []) as unknown as ActionPricing[];
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Get cost for a specific action ───
export function useActionCost(actionKey: string, tier: 'standard' | 'premium' = 'standard') {
  const { data: pricing } = useActionPricing();
  const action = pricing?.find((p) => p.action_key === actionKey);
  return action ? (tier === 'premium' ? action.cost_premium : action.cost_standard) : null;
}

// ─── Credit Packs ───
export function useCreditPacks() {
  return useQuery({
    queryKey: ['credits', 'packs'],
    queryFn: async (): Promise<CreditPack[]> => {
      const { data, error } = await supabase
        .from('credit_packs')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return (data || []) as unknown as CreditPack[];
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Consume Credits ───
export function useConsumeCredits() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      actionKey,
      actionLabel,
      tier = 'standard',
      metadata = {},
    }: {
      actionKey: string;
      actionLabel?: string;
      tier?: 'standard' | 'premium';
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Look up cost from pricing table
      const { data: pricingRows, error: pErr } = await supabase
        .from('credit_action_pricing')
        .select('cost_standard, cost_premium, action_label')
        .eq('action_key', actionKey)
        .eq('is_active', true)
        .single();

      if (pErr || !pricingRows) throw new Error('Action pricing not found');

      const cost = tier === 'premium'
        ? (pricingRows as any).cost_premium
        : (pricingRows as any).cost_standard;

      const label = actionLabel || (pricingRows as any).action_label;

      const { data, error } = await supabase.rpc('consume_credits', {
        _user_id: user.id,
        _amount: cost,
        _action_key: actionKey,
        _action_label: label,
        _metadata: { ...metadata, tier } as any,
      });

      if (error) throw error;

      const result = data as unknown as { ok: boolean; reason?: string; balance?: number; required?: number; debited?: number };

      if (!result.ok) {
        if (result.reason === 'insufficient_credits') {
          throw new Error(`Crédits insuffisants (${result.balance?.toFixed(1)} disponibles, ${result.required?.toFixed(1)} requis)`);
        }
        throw new Error(result.reason || 'Credit consumption failed');
      }

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits', 'summary'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ─── Grant Daily Credits ───
export function useGrantDailyCredits() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Daily login grant
      const { data, error } = await supabase.rpc('grant_daily_credits', {
        _user_id: user.id,
      });
      if (error) throw error;

      // Monthly tier grant (idempotent — only credits once per calendar month)
      let monthly: { ok: boolean; tier?: string; granted?: number } | null = null;
      try {
        const { data: m } = await supabase.rpc('grant_monthly_platform_credits', {
          _user_id: user.id,
        });
        monthly = m as any;
      } catch (e) {
        console.warn('[grant_monthly_platform_credits] skipped', e);
      }

      return {
        daily: data as unknown as { ok: boolean; reason?: string; granted?: number; balance?: number },
        monthly,
      };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['credits', 'summary'] });
      if (res.daily?.ok && res.daily.granted) {
        toast.success(`+${res.daily.granted} crédits quotidiens reçus !`);
      }
      if (res.monthly?.ok && res.monthly.granted) {
        const tierLabel = res.monthly.tier === 'pro' ? 'Pro' : res.monthly.tier === 'org' ? 'Org' : res.monthly.tier === 'founder' ? 'Founder' : 'Free';
        toast.success(`+${res.monthly.granted} crédits mensuels (${tierLabel}) ✨`, { duration: 6000 });
      }
    },
  });
}

// ─── Transaction History ───
export function useCreditHistory(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credits', 'history', user?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ─── Check if user can afford an action ───
export function useCanAfford(actionKey: string, tier: 'standard' | 'premium' = 'standard'): boolean | null {
  const { data: summary } = useCreditsBalance();
  const cost = useActionCost(actionKey, tier);

  if (summary == null || cost == null) return null;
  return summary.balance >= cost;
}
