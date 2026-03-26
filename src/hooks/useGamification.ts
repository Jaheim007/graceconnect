import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_activity_days: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_label: string;
  earned_at: string;
}

// All possible badges
export const BADGE_DEFINITIONS: Record<string, { label: string; emoji: string; description: string; condition: string }> = {
  first_login: { label: 'Premier pas', emoji: '👣', description: 'Première connexion', condition: 'login' },
  streak_3: { label: 'Régulier', emoji: '🔥', description: '3 jours consécutifs', condition: 'streak >= 3' },
  streak_7: { label: 'Enflammé', emoji: '🔥🔥', description: '7 jours consécutifs', condition: 'streak >= 7' },
  streak_30: { label: 'Inarrêtable', emoji: '⚡', description: '30 jours consécutifs', condition: 'streak >= 30' },
  first_donation: { label: 'Généreux', emoji: '💝', description: 'Premier don effectué', condition: 'donations >= 1' },
  first_purchase: { label: 'Collectionneur', emoji: '📦', description: 'Premier achat', condition: 'purchases >= 1' },
  donor_10: { label: 'Mécène', emoji: '🏆', description: '10 dons effectués', condition: 'donations >= 10' },
  referrer_1: { label: 'Ambassadeur', emoji: '🤝', description: 'Premier parrainage', condition: 'referrals >= 1' },
  referrer_10: { label: 'Influenceur', emoji: '🌟', description: '10 parrainages', condition: 'referrals >= 10' },
  org_creator: { label: 'Bâtisseur', emoji: '🏗️', description: 'Organisation créée', condition: 'orgs >= 1' },
  affiliate_first_sale: { label: 'Vendeur', emoji: '💰', description: 'Première commission ambassadeur', condition: 'affiliate_sales >= 1' },
  five_resources: { label: 'Bibliophile', emoji: '📚', description: '5 ressources achetées', condition: 'purchases >= 5' },
};

export function useStreak() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await db
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data as UserStreak | null;
    },
    enabled: !!user,
  });
}

export function useBadges() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        const { data, error } = await db
          .from('user_badges')
          .select('id, user_id, earned_at, badge_id, badges(name, icon, description)')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false });
        if (error) {
          console.warn('[useBadges] query error (non-fatal):', error.message);
          return [];
        }
        return (data || []).map((b: any) => ({
          id: b.id,
          user_id: b.user_id,
          earned_at: b.earned_at,
          badge_type: b.badges?.name || b.badge_id || 'unknown',
          badge_label: b.badges?.name || 'Badge',
        })) as UserBadge[];
      } catch (e) {
        console.warn('[useBadges] unexpected error (non-fatal):', e);
        return [];
      }
    },
    enabled: !!user,
    retry: false,
  });
}

export function useRecordActivity() {
  const { user } = useAuth();
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);
      
      // Get current streak
      const { data: existing } = await db
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!existing) {
        // First activity ever
        await db.from('user_streaks').insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
          total_activity_days: 1,
        });
        return;
      }
      
      if (existing.last_activity_date === today) return; // Already recorded today
      
      const lastDate = existing.last_activity_date ? new Date(existing.last_activity_date) : null;
      const todayDate = new Date(today);
      const diffDays = lastDate ? Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;
      
      const newStreak = diffDays === 1 ? existing.current_streak + 1 : 1;
      const newLongest = Math.max(existing.longest_streak, newStreak);
      
      await db.from('user_streaks').update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
        total_activity_days: existing.total_activity_days + 1,
      }).eq('user_id', user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-streak', user?.id] });
    },
  });
}

export function useCheckAndAwardBadges() {
  const { user } = useAuth();
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) return [];
      
      try {
        // Fetch all needed data in parallel
        const [streakRes, badgesRes, donationsRes, purchasesRes, referralsRes, orgsRes, affiliateSalesRes] = await Promise.all([
          db.from('user_streaks').select('current_streak, longest_streak').eq('user_id', user.id).maybeSingle(),
          db.from('user_badges').select('badge_id').eq('user_id', user.id),
          db.from('donations').select('id').eq('user_id', user.id).eq('status', 'completed'),
          db.from('product_purchases').select('id').eq('user_id', user.id).eq('status', 'completed'),
          db.from('user_referrals').select('id').eq('referrer_id', user.id),
          db.from('organizations').select('id').eq('owner_id', user.id),
          db.from('affiliate_sales').select('id').eq('affiliate_user_id', user.id),
        ]);
        
        const existingBadges = new Set((badgesRes.data || []).map((b: any) => b.badge_id));
        const streak = streakRes.data?.longest_streak || 0;
        const donations = donationsRes.data?.length || 0;
        const purchases = purchasesRes.data?.length || 0;
        const referrals = referralsRes.data?.length || 0;
        const orgs = orgsRes.data?.length || 0;
        const affiliateSales = affiliateSalesRes.data?.length || 0;
        
        const newBadges: string[] = [];
        
        // Check each badge
        const checks: [string, boolean][] = [
          ['first_login', true],
          ['streak_3', streak >= 3],
          ['streak_7', streak >= 7],
          ['streak_30', streak >= 30],
          ['first_donation', donations >= 1],
          ['first_purchase', purchases >= 1],
          ['donor_10', donations >= 10],
          ['referrer_1', referrals >= 1],
          ['referrer_10', referrals >= 10],
          ['org_creator', orgs >= 1],
          ['affiliate_first_sale', affiliateSales >= 1],
          ['five_resources', purchases >= 5],
        ];
        
        for (const [type, earned] of checks) {
          if (earned && !existingBadges.has(type)) {
            newBadges.push(type);
          }
        }
        
        return newBadges;
      } catch (e) {
        console.warn('[useCheckAndAwardBadges] non-fatal error:', e);
        return [];
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-badges', user?.id] });
    },
  });
}
