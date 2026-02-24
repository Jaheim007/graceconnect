import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

const POINT_VALUES: Record<string, number> = {
  join_org: 10,
  daily_login: 5,
  donate: 50,
  purchase: 30,
  complete_lesson: 20,
  watch_media: 5,
  share_affiliate: 15,
};

const LEVELS = [
  { level: 1, min: 0 },
  { level: 2, min: 50 },
  { level: 3, min: 150 },
  { level: 4, min: 300 },
  { level: 5, min: 500 },
  { level: 6, min: 1000 },
  { level: 7, min: 2000 },
  { level: 8, min: 5000 },
  { level: 9, min: 10000 },
  { level: 10, min: 25000 },
];

export function getLevel(points: number) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.min) lvl = l;
  }
  const next = LEVELS.find(l => l.level === lvl.level + 1);
  return { ...lvl, nextMin: next?.min || lvl.min, progress: next ? ((points - lvl.min) / (next.min - lvl.min)) * 100 : 100 };
}

export function useMyPoints(orgId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-points', orgId, user?.id],
    queryFn: async () => {
      if (!orgId || !user) return null;
      const { data } = await db.from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId && !!user,
  });
}

export function useOrgLeaderboard(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-leaderboard', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('user_points')
        .select('user_id, points, level')
        .eq('organization_id', orgId)
        .order('points', { ascending: false })
        .limit(20);
      if (!data?.length) return [];
      const uids = data.map((d: any) => d.user_id);
      const { data: profiles } = await db.from('profiles').select('id, display_name, avatar_url').in('id', uids);
      const pm: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { pm[p.id] = p; });
      return data.map((d: any) => ({ ...d, profile: pm[d.user_id] }));
    },
    enabled: !!orgId,
  });
}

export function useMyBadges(orgId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-badges', orgId, user?.id],
    queryFn: async () => {
      if (!orgId || !user) return [];
      const { data } = await db.from('user_badges')
        .select('*, badges(name, description, icon, condition_type, condition_value)')
        .eq('user_id', user.id)
        .eq('organization_id', orgId);
      return data || [];
    },
    enabled: !!orgId && !!user,
  });
}

export function useOrgBadges(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-badges', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('badges')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('condition_value', { ascending: true });
      return data || [];
    },
    enabled: !!orgId,
  });
}

export function useAwardPoints() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, reason }: { orgId: string; reason: string }) => {
      if (!user) throw new Error('Not authenticated');
      const points = POINT_VALUES[reason] || 5;

      // Log transaction
      await db.from('point_transactions').insert({
        user_id: user.id,
        organization_id: orgId,
        points,
        reason,
      });

      // Upsert user_points
      const { data: existing } = await db.from('user_points')
        .select('id, points')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .maybeSingle();

      const newTotal = (existing?.points || 0) + points;
      const newLevel = getLevel(newTotal).level;

      if (existing) {
        await db.from('user_points').update({ points: newTotal, level: newLevel, updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await db.from('user_points').insert({ user_id: user.id, organization_id: orgId, points: newTotal, level: newLevel });
      }

      return { points, newTotal, newLevel };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['my-points', vars.orgId] });
      qc.invalidateQueries({ queryKey: ['org-leaderboard', vars.orgId] });
    },
  });
}
