import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Activity, Heart, ShoppingBag, Users, Shield, UserPlus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

interface ActivityItem {
  id: string;
  type: 'donation' | 'purchase' | 'signup' | 'kyc' | 'member' | 'report';
  title: string;
  subtitle: string;
  amount?: number;
  status?: string;
  timestamp: string;
}

export default function SuperadminActivityFeed() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['sa-activity-feed'],
    queryFn: async () => {
      const [donations, purchases, profiles, kyc, members, reports] = await Promise.all([
        db.from('donations').select('id, donor_name, amount, status, created_at, currency').order('created_at', { ascending: false }).limit(30),
        db.from('product_purchases').select('id, amount, status, created_at, currency, buyer_name').order('created_at', { ascending: false }).limit(30),
        db.from('profiles').select('id, display_name, created_at').order('created_at', { ascending: false }).limit(20),
        db.from('kyc_submissions').select('id, status, submitted_at, organization_id').order('submitted_at', { ascending: false }).limit(20),
        db.from('organization_members').select('id, role, joined_at, organizations(name)').order('joined_at', { ascending: false }).limit(20),
        db.from('content_reports').select('id, content_type, reason, status, created_at').order('created_at', { ascending: false }).limit(20),
      ]);

      const items: ActivityItem[] = [];

      (donations.data || []).forEach((d: any) => items.push({
        id: `don-${d.id}`, type: 'donation', title: `Don de ${d.donor_name || 'Anonyme'}`,
        subtitle: `${fmt(d.amount)} ${d.currency || 'XOF'}`, amount: d.amount, status: d.status,
        timestamp: d.created_at,
      }));

      (purchases.data || []).forEach((p: any) => items.push({
        id: `pur-${p.id}`, type: 'purchase', title: `Achat de ${p.buyer_name || 'Acheteur'}`,
        subtitle: `${fmt(p.amount)} ${p.currency || 'XOF'}`, amount: p.amount, status: p.status,
        timestamp: p.created_at,
      }));

      (profiles.data || []).forEach((p: any) => items.push({
        id: `sig-${p.id}`, type: 'signup', title: `Nouvel utilisateur`,
        subtitle: p.display_name || 'Sans nom', timestamp: p.created_at,
      }));

      (kyc.data || []).forEach((k: any) => items.push({
        id: `kyc-${k.id}`, type: 'kyc', title: 'Soumission KYC',
        subtitle: `Statut: ${k.status}`, status: k.status, timestamp: k.submitted_at,
      }));

      (members.data || []).forEach((m: any) => items.push({
        id: `mem-${m.id}`, type: 'member', title: `Nouveau membre`,
        subtitle: `${m.organizations?.name || '?'} (${m.role})`, timestamp: m.joined_at,
      }));

      (reports.data || []).forEach((r: any) => items.push({
        id: `rep-${r.id}`, type: 'report', title: 'Signalement',
        subtitle: `${r.content_type}: ${r.reason?.slice(0, 50)}`, status: r.status,
        timestamp: r.created_at,
      }));

      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    refetchInterval: 30000, // refresh every 30s
  });

  const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    donation: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    purchase: { icon: ShoppingBag, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    signup: { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    kyc: { icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    member: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    report: { icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Flux d'activité</h1>
        <Badge variant="secondary" className="text-[10px] ml-auto">Rafraîchissement auto 30s</Badge>
      </div>

      {isLoading ? <SkeletonRow count={10} /> : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-1">
              {activities.map((item, i) => {
                const config = typeConfig[item.type];
                const Icon = config.icon;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className="flex items-start gap-3 pl-2 py-2 hover:bg-muted/30 rounded-lg transition-colors">
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10', config.bg)}>
                      <Icon className={cn('h-3.5 w-3.5', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    {item.status && (
                      <Badge variant="outline" className={cn('text-[9px] shrink-0',
                        item.status === 'completed' ? 'border-emerald-500/50 text-emerald-600' :
                        item.status === 'pending' ? 'border-amber-500/50 text-amber-600' : ''
                      )}>{item.status}</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                      {item.timestamp ? format(new Date(item.timestamp), 'dd MMM HH:mm', { locale: fr }) : ''}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
