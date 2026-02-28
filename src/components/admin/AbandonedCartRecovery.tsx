import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Send, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function AbandonedCartRecovery() {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();

  const { data: carts = [], isLoading } = useQuery({
    queryKey: ['abandoned-carts', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('abandoned_carts')
        .select('id, email, buyer_name, product_id, converted, converted_at, opened_at, reminder_sent_count, last_reminder_at, digital_products(title, price, currency, cover_image_url)')
        .eq('organization_id', currentOrg.id)
        .order('opened_at', { ascending: false })
        .limit(50);
      return (data || []).map((c: any) => ({ ...c, product: c.digital_products }));
    },
    enabled: !!currentOrg?.id,
  });

  const sendReminder = useMutation({
    mutationFn: async (cartId: string) => {
      const cart = carts.find(c => c.id === cartId);
      if (!cart?.email) throw new Error('Pas d\'email');
      await db.from('abandoned_carts').update({
        reminder_sent_count: (cart.reminder_sent_count || 0) + 1,
        last_reminder_at: new Date().toISOString(),
      }).eq('id', cartId);
    },
    onSuccess: () => {
      toast.success('Rappel envoyé !');
      qc.invalidateQueries({ queryKey: ['abandoned-carts'] });
    },
    onError: () => toast.error('Erreur lors de l\'envoi'),
  });

  const activeCarts = carts.filter(c => !c.converted);
  const convertedCarts = carts.filter(c => c.converted);
  const recoveryRate = carts.length > 0 ? ((convertedCarts.length / carts.length) * 100).toFixed(1) : '0';

  if (isLoading) return null;
  if (carts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Paniers abandonnés</h2>
            <p className="text-[10px] text-muted-foreground">{activeCarts.length} actifs · {recoveryRate}% récupérés</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {carts.length} total
        </Badge>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
          <p className="text-lg font-bold text-amber-400">{activeCarts.length}</p>
          <p className="text-[10px] text-muted-foreground">En attente</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
          <p className="text-lg font-bold text-emerald-400">{convertedCarts.length}</p>
          <p className="text-[10px] text-muted-foreground">Récupérés</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
          <p className="text-lg font-bold text-primary">{recoveryRate}%</p>
          <p className="text-[10px] text-muted-foreground">Taux récup.</p>
        </div>
      </div>

      {/* Active carts list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activeCarts.slice(0, 10).map(cart => (
          <div key={cart.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
            {cart.product?.cover_image_url ? (
              <img src={cart.product.cover_image_url} className="h-10 w-10 rounded-lg object-cover shrink-0" alt="" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{cart.product?.title || 'Produit'}</p>
              <p className="text-[10px] text-muted-foreground">
                {cart.buyer_name || cart.email || 'Visiteur'} · {formatDistanceToNow(new Date(cart.opened_at), { addSuffix: true, locale: fr })}
              </p>
              {cart.reminder_sent_count > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">{cart.reminder_sent_count} rappel{cart.reminder_sent_count > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {cart.product?.price && (
                <span className="text-xs font-semibold text-primary">
                  {cart.product.price.toLocaleString()} {cart.product.currency || 'XOF'}
                </span>
              )}
              {cart.email && cart.reminder_sent_count < 3 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => sendReminder.mutate(cart.id)}
                  disabled={sendReminder.isPending}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeCarts.length === 0 && (
        <div className="text-center py-6">
          <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Aucun panier abandonné actif 🎉</p>
        </div>
      )}
    </motion.div>
  );
}
