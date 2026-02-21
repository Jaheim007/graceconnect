import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { AdminPageShell } from './AdminPageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Copy, CheckCircle, Tag, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminPromoCodes() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['admin-promo-codes', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await db
        .from('promo_codes')
        .select('*')
        .eq('organization_id', currentOrg.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const createCode = useMutation({
    mutationFn: async () => {
      if (!currentOrg || !user) throw new Error('Non authentifié');
      const trimmedCode = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (!trimmedCode || trimmedCode.length < 3) throw new Error('Code trop court (min 3 caractères)');
      const pct = parseFloat(discountPercent);
      if (isNaN(pct) || pct <= 0 || pct > 100) throw new Error('Pourcentage invalide (1-100)');

      const payload: any = {
        organization_id: currentOrg.id,
        code: trimmedCode,
        discount_percent: pct,
        created_by: user.id,
      };
      if (maxUses) payload.max_uses = parseInt(maxUses);
      if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();

      const { error } = await db.from('promo_codes').insert(payload);
      if (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          throw new Error('Ce code existe déjà pour cette organisation');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: '✅ Code promo créé' });
      setCode('');
      setDiscountPercent('10');
      setMaxUses('');
      setExpiresAt('');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['admin-promo-codes', currentOrg?.id] });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await db.from('promo_codes').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-promo-codes', currentOrg?.id] });
    },
  });

  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Code supprimé' });
      qc.invalidateQueries({ queryKey: ['admin-promo-codes', currentOrg?.id] });
    },
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (c: string, id: string) => {
    navigator.clipboard.writeText(c);
    setCopiedId(id);
    toast({ title: 'Code copié !' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AdminPageShell title="Codes promo" backRoute="/admin">
      <div className="space-y-4">
        {/* Info */}
        <div className="bg-primary/8 border border-primary/20 rounded-2xl p-4 space-y-1">
          <p className="font-semibold text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Codes de réduction</p>
          <p className="text-xs text-muted-foreground">
            Créez des codes promo pour offrir des réductions sur vos produits digitaux. Les acheteurs appliqueront le code lors du paiement.
          </p>
        </div>

        {/* Create button / form */}
        {!showForm ? (
          <Button size="sm" className="gold-gradient text-primary-foreground border-0 shadow-gold gap-1.5" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Nouveau code promo
          </Button>
        ) : (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm">Créer un code promo</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Code</Label>
                <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="EX: BIENVENUE20" className="h-8 text-xs font-mono uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Réduction (%)</Label>
                <Input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} min="1" max="100" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Utilisations max (optionnel)</Label>
                <Input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Illimité" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expire le (optionnel)</Label>
                <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="gold-gradient text-primary-foreground border-0" onClick={() => createCode.mutate()} disabled={createCode.isPending}>
                {createCode.isPending ? 'Création...' : 'Créer'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </motion.div>
        )}

        {/* List */}
        {isLoading ? <SkeletonRow count={3} /> : promoCodes.length === 0 ? (
          <EmptyState variant="generic" title="Aucun code promo" description="Créez votre premier code de réduction." />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">{promoCodes.length} code{promoCodes.length > 1 ? 's' : ''} promo</h2>
            <div className="space-y-2">
              {(promoCodes as any[]).map((pc) => (
                <div key={pc.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background transition-all group">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold font-mono">{pc.code}</p>
                      <button onClick={() => handleCopy(pc.code, pc.id)}>
                        {copiedId === pc.id ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      -{pc.discount_percent}% · {pc.current_uses}{pc.max_uses ? `/${pc.max_uses}` : ''} utilisations
                      {pc.expires_at && ` · Expire ${new Date(pc.expires_at).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={pc.is_active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: pc.id, is_active: v })}
                    />
                    <Badge variant="outline" className={cn('text-[10px] border-0', pc.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                      {pc.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-60 group-hover:opacity-100" onClick={() => deleteCode.mutate(pc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
