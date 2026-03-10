import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';
import { UserX, Clock, Send, AlertTriangle, TrendingDown, Mail, Phone, MessageCircle, Copy, Check } from 'lucide-react';
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
  phone: string | null;
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
  const [copied, setCopied] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['admin-re-engagement', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;

      const { data: members } = await db.from('organization_members')
        .select('user_id, joined_at')
        .eq('organization_id', currentOrg.id);
      if (!members?.length) return null;

      const userIds = members.map((m: any) => m.user_id);

      const { data: profiles } = await db.from('profiles')
        .select('id, display_name, email, phone')
        .in('id', userIds);
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

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

      const now = new Date();
      const atRisk: AtRiskUser[] = [];

      for (const member of members) {
        const activity = activityMap[member.user_id];
        const lastDate = activity?.lastDate || member.joined_at;
        const daysSince = differenceInDays(now, new Date(lastDate));
        const profile = profileMap[member.user_id];

        if (daysSince < 7) continue;

        let segment: AtRiskUser['segment'] = 'warm';
        if (daysSince >= 90) segment = 'lost';
        else if (daysSince >= 30) segment = 'cold';
        else if (daysSince >= 14) segment = 'cooling';

        const displayName = profile?.display_name || null;
        const email = profile?.email || null;
        const phone = profile?.phone || null;

        // Skip users with no contact info — can't re-engage them
        if (!email && !phone && !displayName) continue;

        const label = displayName || email || phone || '';

        atRisk.push({
          userId: member.user_id,
          name: label,
          email,
          phone,
          lastActivity: lastDate,
          daysSince,
          totalSpent: activity?.totalSpent || 0,
          segment,
        });
      }

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

  const handleWhatsApp = (user: AtRiskUser) => {
    const phone = user.phone?.replace(/\s/g, '');
    if (!phone) return;
    const msg = encodeURIComponent(
      isFr
        ? `Bonjour ${user.name !== user.phone ? user.name : ''} ! Vous nous manquez chez ${currentOrg?.name}. Venez découvrir nos nouveautés 👉 ${window.location.origin}/org/${currentOrg?.slug}`
        : `Hi ${user.name !== user.phone ? user.name : ''}! We miss you at ${currentOrg?.name}. Check out what's new 👉 ${window.location.origin}/org/${currentOrg?.slug}`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleCopyContact = (user: AtRiskUser) => {
    const contact = user.email || user.phone || '';
    navigator.clipboard.writeText(contact);
    setCopied(user.userId);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: isFr ? 'Contact copié' : 'Contact copied' });
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
          const hasEmail = !!user.email;
          const hasPhone = !!user.phone;
          const initials = user.email
            ? user.email[0].toUpperCase()
            : user.name[0]?.toUpperCase() || '?';

          return (
            <div key={user.userId} className="flex flex-col gap-2 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
              {/* Top row: avatar + info + segment badge */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {/* Primary identifier */}
                  {hasEmail ? (
                    <p className="text-xs font-medium truncate flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                      {user.email}
                    </p>
                  ) : hasPhone ? (
                    <p className="text-xs font-medium truncate flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                      {user.phone}
                    </p>
                  ) : (
                    <p className="text-xs font-medium truncate">{user.name}</p>
                  )}
                  {/* Secondary info */}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {user.daysSince}j {isFr ? 'd\'inactivité' : 'inactive'}
                    {user.totalSpent > 0 && ` · ${user.totalSpent.toLocaleString()} ${currentOrg?.currency || 'XOF'} ${isFr ? 'dépensé' : 'spent'}`}
                    {/* Show secondary contact if available */}
                    {hasEmail && hasPhone && (
                      <span className="ml-1">· <Phone className="h-2.5 w-2.5 inline" /> {user.phone}</span>
                    )}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[9px] border ${cfg.color} shrink-0`}>
                  {cfg.icon}
                </Badge>
              </div>

              {/* Action buttons row */}
              <div className="flex items-center gap-1.5 pl-11">
                {hasEmail && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-[10px] gap-1"
                    disabled={sending === user.userId}
                    onClick={() => handleSendNudge(user)}
                  >
                    <Send className="h-3 w-3" />
                    {sending === user.userId
                      ? (isFr ? 'Envoi...' : 'Sending...')
                      : (isFr ? 'Relancer par email' : 'Email nudge')}
                  </Button>
                )}
                {hasPhone && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-[10px] gap-1 text-green-600 border-green-500/30 hover:bg-green-500/10"
                    onClick={() => handleWhatsApp(user)}
                  >
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[10px] gap-1 text-muted-foreground"
                  onClick={() => handleCopyContact(user)}
                >
                  {copied === user.userId ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === user.userId ? (isFr ? 'Copié' : 'Copied') : (isFr ? 'Copier' : 'Copy')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
