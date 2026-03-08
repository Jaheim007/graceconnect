import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Search, Users, Download, ShoppingBag, Heart, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

export default function SuperadminUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['sa-users-v2'],
    queryFn: async () => {
      const [profiles, members, roles, purchases, donations, affiliateLinks] = await Promise.all([
        db.from('profiles').select('*').order('created_at', { ascending: false }),
        db.from('organization_members').select('user_id, organization_id, role, organizations(name)'),
        db.from('user_platform_roles').select('user_id, role'),
        db.from('product_purchases').select('user_id, amount, status').eq('status', 'completed'),
        db.from('donations').select('user_id, amount, status').eq('status', 'completed'),
        db.from('affiliate_links').select('user_id, total_earned, clicks, conversions, is_active'),
      ]);

      const memberMap: Record<string, any[]> = {};
      (members.data || []).forEach((m: any) => {
        if (!memberMap[m.user_id]) memberMap[m.user_id] = [];
        memberMap[m.user_id].push(m);
      });

      const roleMap: Record<string, string> = {};
      (roles.data || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

      // Aggregate purchases per user
      const purchaseMap: Record<string, { count: number; total: number }> = {};
      (purchases.data || []).forEach((p: any) => {
        if (!purchaseMap[p.user_id]) purchaseMap[p.user_id] = { count: 0, total: 0 };
        purchaseMap[p.user_id].count++;
        purchaseMap[p.user_id].total += p.amount || 0;
      });

      // Aggregate donations per user
      const donationMap: Record<string, { count: number; total: number }> = {};
      (donations.data || []).forEach((d: any) => {
        if (!d.user_id) return;
        if (!donationMap[d.user_id]) donationMap[d.user_id] = { count: 0, total: 0 };
        donationMap[d.user_id].count++;
        donationMap[d.user_id].total += d.amount || 0;
      });

      // Aggregate affiliate per user
      const affiliateMap: Record<string, { links: number; earned: number; clicks: number }> = {};
      (affiliateLinks.data || []).forEach((a: any) => {
        if (!affiliateMap[a.user_id]) affiliateMap[a.user_id] = { links: 0, earned: 0, clicks: 0 };
        affiliateMap[a.user_id].links++;
        affiliateMap[a.user_id].earned += a.total_earned || 0;
        affiliateMap[a.user_id].clicks += a.clicks || 0;
      });

      return (profiles.data || []).map((p: any) => ({
        ...p,
        memberships: memberMap[p.id] || [],
        platformRole: roleMap[p.id] || null,
        purchases: purchaseMap[p.id] || { count: 0, total: 0 },
        donations: donationMap[p.id] || { count: 0, total: 0 },
        affiliate: affiliateMap[p.id] || { links: 0, earned: 0, clicks: 0 },
      }));
    },
  });

  const filtered = users.filter((u: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.display_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      u.id.includes(q);
  });

  const exportCSV = () => {
    const headers = ['ID', 'Nom', 'Email', 'Pays', 'Téléphone', 'Orgs', 'Rôle plateforme', 'Achats', 'Total achats', 'Dons', 'Total dons', 'Liens affil.', 'Gains affil.', 'Inscrit le'];
    const rows = filtered.map((u: any) => [
      u.id, u.display_name || '', u.email || '', u.country || '', u.phone || '',
      u.memberships.map((m: any) => m.organizations?.name).filter(Boolean).join('; '),
      u.platformRole || '',
      u.purchases.count, u.purchases.total,
      u.donations.count, u.donations.total,
      u.affiliate.links, u.affiliate.earned,
      u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy') : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.map((c: any) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export téléchargé ✅' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Utilisateurs ({filtered.length})
        </h1>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, email, téléphone ou ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? <SkeletonRow count={8} /> : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-2">
            {filtered.map((u: any) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">
                  {(u.display_name || '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{u.display_name || 'Sans nom'}</p>
                    {u.platformRole && (
                      <Badge className="text-[9px] bg-primary/15 text-primary border-0 capitalize">{u.platformRole}</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {u.email || '—'} · {u.phone || 'Pas de tél.'} · {u.country || '—'} · {u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy', { locale: fr }) : ''}
                  </p>
                  
                  {/* Memberships */}
                  {u.memberships.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {u.memberships.slice(0, 3).map((m: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">
                          {m.organizations?.name || '?'} ({m.role})
                        </Badge>
                      ))}
                      {u.memberships.length > 3 && <Badge variant="outline" className="text-[9px] px-1.5 py-0">+{u.memberships.length - 3}</Badge>}
                    </div>
                  )}

                  {/* Activity stats */}
                  <div className="flex items-center gap-3 mt-1.5">
                    {u.purchases.count > 0 && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <ShoppingBag className="h-3 w-3" /> {u.purchases.count} achats ({formatCurrency(u.purchases.total)})
                      </span>
                    )}
                    {u.donations.count > 0 && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <Heart className="h-3 w-3" /> {u.donations.count} dons ({formatCurrency(u.donations.total)})
                      </span>
                    )}
                    {u.affiliate.links > 0 && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <Link2 className="h-3 w-3" /> {u.affiliate.links} liens ({formatCurrency(u.affiliate.earned)})
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{u.id.slice(0, 8)}...</span>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
