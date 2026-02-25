import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { callFn } from '@/lib/api';
import { toast } from 'sonner';

// ── Types ──
export interface Partner {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string;
  country: string;
  scope: 'country' | 'regional' | 'international';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  level: number;
  rate_percent: number;
  custom_rate_override: number | null;
  min_payout_threshold: number;
  payout_method: string | null;
  paystack_recipient_code: string | null;
  invite_code: string | null;
  invite_link_slug: string | null;
  invite_uses_count: number;
  last_invite_used_at: string | null;
  terms_accepted_at: string | null;
  approved_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerReferral {
  id: string;
  partner_id: string;
  organization_id: string;
  status: 'pending' | 'active' | 'rejected';
  attributed_at: string;
  locked_at: string | null;
  notes: string | null;
  // joined
  organization?: { name: string; slug: string; is_active: boolean; logo_url: string | null };
}

export interface PartnerCommission {
  id: string;
  partner_id: string;
  organization_id: string;
  payment_reference: string;
  platform_fee_amount: number;
  commission_percent: number;
  commission_amount: number;
  currency: string;
  status: 'held' | 'payable' | 'paid' | 'reversed';
  payable_at: string | null;
  paid_at: string | null;
  created_at: string;
  // joined
  organization?: { name: string };
}

export interface PartnerPayoutRequest {
  id: string;
  partner_id: string;
  amount: number;
  currency: string;
  status: 'requested' | 'approved' | 'processing' | 'paid' | 'failed' | 'rejected';
  paystack_transfer_code: string | null;
  failure_reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
  paid_at: string | null;
}

// ── Hook: current user's partner profile ──
export function useMyPartner() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-partner', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await db.from('partners')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Partner | null;
    },
  });
}

// ── Hook: partner referrals ──
export function usePartnerReferrals(partnerId?: string) {
  return useQuery({
    queryKey: ['partner-referrals', partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await db.from('partner_referrals')
        .select('*, organization:organizations(name, slug, is_active, logo_url)')
        .eq('partner_id', partnerId!)
        .order('attributed_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PartnerReferral[];
    },
  });
}

// ── Hook: partner commissions ──
export function usePartnerCommissions(partnerId?: string) {
  return useQuery({
    queryKey: ['partner-commissions', partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await db.from('partner_commissions')
        .select('*, organization:organizations(name)')
        .eq('partner_id', partnerId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as PartnerCommission[];
    },
  });
}

// ── Hook: partner payout requests ──
export function usePartnerPayouts(partnerId?: string) {
  return useQuery({
    queryKey: ['partner-payouts', partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await db.from('partner_payout_requests')
        .select('*')
        .eq('partner_id', partnerId!)
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PartnerPayoutRequest[];
    },
  });
}

// ── Hook: partner stats (computed) ──
export function usePartnerStats(partnerId?: string) {
  const { data: referrals } = usePartnerReferrals(partnerId);
  const { data: commissions } = usePartnerCommissions(partnerId);

  const totalOrgs = referrals?.length || 0;
  const activeOrgs = referrals?.filter(r => r.status === 'active').length || 0;
  
  const held = commissions?.filter(c => c.status === 'held').reduce((s, c) => s + c.commission_amount, 0) || 0;
  const payable = commissions?.filter(c => c.status === 'payable').reduce((s, c) => s + c.commission_amount, 0) || 0;
  const paid = commissions?.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission_amount, 0) || 0;
  const reversed = commissions?.filter(c => c.status === 'reversed').reduce((s, c) => s + c.commission_amount, 0) || 0;

  return { totalOrgs, activeOrgs, held, payable, paid, reversed, totalEarned: held + payable + paid };
}

// ── Mutation: request payout ──
export function useRequestPartnerPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partnerId: string) => {
      return callFn('request-partner-payout', { partner_id: partnerId }, true);
    },
    onSuccess: () => {
      toast.success('Demande de paiement envoyée');
      qc.invalidateQueries({ queryKey: ['partner-payouts'] });
      qc.invalidateQueries({ queryKey: ['partner-commissions'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Superadmin: all partners ──
export function useAllPartners() {
  const { isSuperadmin } = useAuth();
  return useQuery({
    queryKey: ['all-partners'],
    enabled: isSuperadmin,
    queryFn: async () => {
      const { data, error } = await db.from('partners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Partner[];
    },
  });
}

// ── Superadmin: manage partner ──
export function useManagePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ partnerId, action, reason }: { partnerId: string; action: string; reason?: string }) => {
      const { data, error } = await db.rpc('manage_partner', {
        _partner_id: partnerId,
        _action: action,
        _reason: reason || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Partenaire mis à jour');
      qc.invalidateQueries({ queryKey: ['all-partners'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Superadmin: set rate override ──
export function useSetPartnerRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ partnerId, rate }: { partnerId: string; rate: number }) => {
      const { data, error } = await db.rpc('set_partner_rate_override', {
        _partner_id: partnerId,
        _rate: rate,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Taux mis à jour');
      qc.invalidateQueries({ queryKey: ['all-partners'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
