import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface AmbassadorEnrollCardProps {
  productId: string;
  productTitle: string;
  organizationId: string;
  orgSlug: string;
  price: number;
  commissionRate: number;
  isFr: boolean;
  onEnrolled: () => void;
  onDecline: () => void;
}

export function AmbassadorEnrollCard({
  productId, productTitle, organizationId, orgSlug,
  price, commissionRate, isFr, onEnrolled, onDecline,
}: AmbassadorEnrollCardProps) {
  const { user } = useAuth();
  const { fmt } = useDisplayCurrency();
  const [enrolling, setEnrolling] = useState(false);

  const commissionAmount = Math.round(price * commissionRate / 100);

  const handleBecomeAmbassador = async () => {
    if (!user) return;
    setEnrolling(true);
    try {
      const { data: existing } = await supabase
        .from('affiliate_links')
        .select('id, code')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        toast.success(isFr ? 'Tu es déjà ambassadeur pour ce produit !' : 'You are already an ambassador for this product!');
        onEnrolled();
        return;
      }

      const code = `${orgSlug}-${productId.slice(0, 6)}-${user.id.slice(0, 4)}`.toLowerCase();
      const { error } = await supabase.from('affiliate_links').insert({
        user_id: user.id,
        organization_id: organizationId,
        product_id: productId,
        code,
        is_active: true,
      });

      if (error) throw error;
      toast.success(isFr ? '🎉 Tu es maintenant ambassadeur !' : '🎉 You are now an ambassador!');
      onEnrolled();
    } catch (err) {
      console.error('Enrollment error:', err);
      toast.error(isFr ? "Erreur lors de l'inscription ambassadeur" : 'Error during ambassador enrollment');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 p-5 space-y-3"
    >
      <div className="text-center space-y-1">
        <p className="text-sm font-extrabold">
          {isFr
            ? <>Tu as aimé <span className="text-primary">« {productTitle} »</span> ?</>
            : <>Loved <span className="text-primary">"{productTitle}"</span>?</>}
        </p>
        <p className="text-xs text-muted-foreground">
          {isFr
            ? <>Partage et gagne <span className="text-emerald-500 font-bold">{commissionRate}%</span> sur chaque vente.</>
            : <>Share & earn <span className="text-emerald-500 font-bold">{commissionRate}%</span> on every sale.</>}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-lg font-extrabold text-emerald-500">{fmt(commissionAmount, 'XOF')}</p>
          <p className="text-[10px] text-muted-foreground">{isFr ? 'par vente' : 'per sale'}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-lg font-extrabold text-primary">{fmt(commissionAmount * 10, 'XOF')}</p>
          <p className="text-[10px] text-muted-foreground">{isFr ? '10 amis achètent' : '10 friends buy'}</p>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full h-12 gap-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
        onClick={handleBecomeAmbassador}
        disabled={enrolling}
      >
        <TrendingUp className="h-4 w-4" />
        {enrolling
          ? (isFr ? 'Inscription…' : 'Enrolling…')
          : (isFr ? 'Oui, je veux gagner !' : 'Yes, I want to earn!')}
      </Button>

      <button
        onClick={onDecline}
        className="w-full text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        {isFr ? 'Non merci' : 'No thanks'}
      </button>
    </motion.div>
  );
}
