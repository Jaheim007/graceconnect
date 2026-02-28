import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';
import { UserX, Clock, Send, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

interface AtRiskUser {
  userId: string;
  name: string;
  email: string | null;
  lastActivity: string;
  daysSince: number;
  totalSpent: number;
  segment: 'warm' | 'cooling' | 'cold' | 'lost';
}

export function SmartReEngagement() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const [sending, setSending] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['admin-re-engagement', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;

      // Get all members
      const { data: members } = await db.from('organization_members')
        .select('user_id, joined_at')
        .eq('organization_id', currentOrg.id);
      if (!members?.length) return null;

      const userIds = members.map((m: any) => m.user_id);

      // Get profiles
      const { data: profiles } = await db.from('profiles')
        .select('id, display_name, email, phone')
        .in('id', userIds);
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

      // Get last purchase/donation for each user
      const { data: purchases } = await db.from('product_purchases')
        .select('user_id, created_at, amount')
        .eq('organization_id', currentOrg.id)
        .eq('status', 'completed')
        .in('user_id', userIds);

      const { data: donations } = await db.from('donations')
        .select('user_id, created_at, amount')
        .eq('organization_id', currentOrg.id)
        .eq('status', 'completed')
        .in('user_id', userIds);

      // Build user activity map
      const activityMap: Record<string, { lastDate: string; totalSpent: number }> = {};
      for (const tx of [...(purchases || []), ...(donations || [])]) {
        if (!tx.user_id) continue;
        if (!activityMap[tx.user_id]) {
          activityMap[tx.user_id] = { lastDate: tx.created_at, totalSpent: 0 };
        }
        if (tx.created_at > activityMap[tx.user_id].lastDate) {
          activityMap[tx.user_id].lastDate = tx.created_at;
        }
        activityMap[tx.user_id].totalSpent += tx.amount || 0;
      }

      // Classify at-risk users
      const now = new Date();
      const atRisk: AtRiskUser[] = [];

      for (const member of members) {
        const activity = activityMap[member.user_id];
        const lastDate = activity?.lastDate || member.joined_at;
        const daysSince = differenceInDays(now, new Date(lastDate));
        const profile = profileMap[member.user_id];

        // Only show users inactive for 7+ days
        if (daysSince < 7) continue;

        let segment: AtRiskUser['segment'] = 'warm';
        if (daysSince >= 90) segment = 'lost';
        else if (daysSince >= 30) segment = 'cold';
        else if (daysSince >= 14) segment = 'cooling';

        atRisk.push({
          userId: member.user_id,
          name: profile?.display_name || (isFr ? 'Utilisateur' : 'User'),
          email: profile?.email || null,
          lastActivity: lastDate,
          daysSince,
          totalSpent: activity?.totalSpent || 0,
          segment,
        });
      }

      // Sort by value (highest spenders first within each segment)
      atRisk.sort((a, b) => {
        const segOrder = { warm: 0, cooling: 1, cold: 2, lost: 3 };
        if (segOrder[a.segment] !== segOrder[b.segment]) return segOrder[a.segment] - segOrder[b.segment];
        return b.totalSpent - a.totalSpent;
      });

      const segmentCounts = {
        warm: atRisk.filter(u => u.segment === 'warm').length,
        cooling: atRisk.filter(u => u.segment === 'cooling').length,
        cold: atRisk.filter(u => u.segment === 'cold').length,
        lost: atRisk.filter(u => u.segment === 'lost').length,
      };

      return { atRisk: atRisk.slice(0, 15), segmentCounts, total: atRisk.length };
    },
    enabled: !!currentOrg?.id,
  });

  const handleSendNudge = async (user: AtRiskUser) => {
    if (!currentOrg?.id || !user.email) return;
    setSending(user.userId);
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          template: 'win_back',
          data: {
            name: user.name,
            org_name: currentOrg.name,
            org_slug: currentOrg.slug,
            days_away: user.daysSince,
          },
        },
      });
      toast({ title: isFr ? '📧 Email de relance envoyé' : '📧 Win-back email sent' });
    } catch {
      toast({ title: isFr ? 'Erreur d\'envoi' : 'Send failed', variant: 'destructive' });
    } finally {
      setSending(null);
    }
  };

  if (!data || data.total === 0) return null;

  const segmentConfig = {
    warm: { label: isFr ? 'Tiède (7-14j)' : 'Warm (7-14d)', icon: <Clock className="h-3 w-3" />, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    cooling: { label: isFr ? 'Refroidit (14-30j)' : 'Cooling (14-30d)', icon: <TrendingDown className="h-3 w-3" />, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
    cold: { label: isFr ? 'Froid (30-90j)' : 'Cold (30-90d)', icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    lost: { label: isFr ? 'Perdu (90j+)' : 'Lost (90d+)', icon: <UserX className="h-3 w-3" />, color: 'bg-muted text-muted-foreground border-border' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserX className="h-4 w-4 text-orange-500" />
          <h2 className="font-semibold text-sm">{isFr ? 'Réengagement intelligent' : 'Smart Re-engagement'}</h2>
        </div>
        <Badge variant="outline" className="text-[10px]">{data.total} {isFr ? 'à risque' : 'at risk'}</Badge>
      </div>

      {/* Segment summary */}
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(data.segmentCounts) as [AtRiskUser['segment'], number][]).map(([seg, count]) => {
          if (count === 0) return null;
          const cfg = segmentConfig[seg];
          return (
            <div key={seg} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-medium ${cfg.color}`}>
              {cfg.icon}
              <span>{count} {cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Users list */}
      <div className="space-y-2">
        {data.atRisk.map((user) => {
          const cfg = segmentConfig[user.segment];
          return (
            <div key={user.userId} className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/30 transition-colors">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold">{user.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {user.daysSince}j {isFr ? 'd\'inactivité' : 'inactive'}
                  {user.totalSpent > 0 && ` · ${user.totalSpent.toLocaleString()} ${currentOrg?.currency || 'XOF'} ${isFr ? 'dépensé' : 'spent'}`}
                </p>
              </div>
              <Badge variant="outline" className={`text-[9px] border ${cfg.color} shrink-0`}>
                {cfg.icon}
              </Badge>
              {user.email && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[10px] gap-1 shrink-0"
                  disabled={sending === user.userId}
                  onClick={() => handleSendNudge(user)}
                >
                  <Send className="h-3 w-3" />
                  {isFr ? 'Relancer' : 'Nudge'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
