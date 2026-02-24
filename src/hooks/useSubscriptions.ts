import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionPlan {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  is_active: boolean;
  is_published: boolean;
  display_order: number;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  organization_id: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
}

// Org admin: manage plans
export function useOrgPlans(orgId: string | undefined, publishedOnly = true) {
  return useQuery({
    queryKey: ['org-plans', orgId, publishedOnly],
    queryFn: async () => {
      if (!orgId) return [];
      let q = db
        .from('subscription_plans')
        .select('*')
        .eq('organization_id', orgId)
        .order('display_order', { ascending: true });
      if (publishedOnly) q = q.eq('is_published', true).eq('is_active', true);
      const { data } = await q;
      return (data || []) as SubscriptionPlan[];
    },
    enabled: !!orgId,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SubscriptionPlan>) => {
      const { data, error } = await db.from('subscription_plans').insert(payload as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: unknown, vars: Partial<SubscriptionPlan>) => {
      qc.invalidateQueries({ queryKey: ['org-plans', vars.organization_id] });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SubscriptionPlan> }) => {
      const { data, error } = await db.from('subscription_plans').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['org-plans', data.organization_id] });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      const { error } = await db.from('subscription_plans').delete().eq('id', id);
      if (error) throw error;
      return orgId;
    },
    onSuccess: (orgId: string) => {
      qc.invalidateQueries({ queryKey: ['org-plans', orgId] });
    },
  });
}

// User: my subscriptions
export function useMySubscriptions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db
        .from('user_subscriptions')
        .select('*, subscription_plans(name, price, currency, interval, features, organizations(name, slug, logo_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!user,
  });
}

// Org admin: subscribers
export function useOrgSubscribers(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-subscribers', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db
        .from('user_subscriptions')
        .select('*, subscription_plans(name, price, currency, interval)')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });
}

export function useSubscribe() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, orgId }: { planId: string; orgId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      
      const { data, error } = await db.from('user_subscriptions').insert({
        user_id: user.id,
        plan_id: planId,
        organization_id: orgId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-subscriptions'] });
      qc.invalidateQueries({ queryKey: ['org-subscribers'] });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subId: string) => {
      const { error } = await db.from('user_subscriptions').update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      } as any).eq('id', subId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-subscriptions'] });
      qc.invalidateQueries({ queryKey: ['org-subscribers'] });
    },
  });
}
