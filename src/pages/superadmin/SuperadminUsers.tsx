import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Search, Users, Ban, CheckCircle2, Download, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function SuperadminUsers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['sa-users'],
    queryFn: async () => {
      const { data: profiles } = await db.from('profiles').select('*').order('created_at', { ascending: false });
      const { data: members } = await db.from('organization_members').select('user_id, organization_id, role, organizations(name)');
      const { data: roles } = await db.from('user_platform_roles').select('user_id, role');

      const memberMap: Record<string, any[]> = {};
      (members || []).forEach((m: any) => {
        if (!memberMap[m.user_id]) memberMap[m.user_id] = [];
        memberMap[m.user_id].push(m);
      });

      const roleMap: Record<string, string> = {};
      (roles || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

      return (profiles || []).map((p: any) => ({
        ...p,
        memberships: memberMap[p.id] || [],
        platformRole: roleMap[p.id] || null,
      }));
    },
  });

  const filtered = users.filter((u: any) =>
    !search || (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.id.includes(search)
  );

  const exportCSV = () => {
    const headers = ['ID', 'Nom', 'Pays', 'Téléphone', 'Orgs', 'Rôle plateforme', 'Inscrit le'];
    const rows = filtered.map((u: any) => [
      u.id, u.display_name || '', u.country || '', u.phone || '',
      u.memberships.map((m: any) => m.organizations?.name).filter(Boolean).join('; '),
      u.platformRole || '', u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy') : '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
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
        <Input placeholder="Rechercher par nom ou ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? <SkeletonRow count={8} /> : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-2">
            {filtered.map((u: any) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {(u.display_name || '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.display_name || 'Sans nom'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {u.country || '—'} · {u.phone || 'Pas de tél.'} · {u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy', { locale: fr }) : ''}
                  </p>
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
                </div>
                {u.platformRole && (
                  <Badge className="text-[10px] bg-primary/15 text-primary border-0 capitalize">{u.platformRole}</Badge>
                )}
                <span className="text-[10px] text-muted-foreground shrink-0">{u.id.slice(0, 8)}...</span>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
