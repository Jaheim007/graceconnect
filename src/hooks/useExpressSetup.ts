import { useState } from 'react';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

/**
 * "Démarrage Express" hook — auto-creates a demo free product + a demo donation campaign
 * so org admins can see how the platform works immediately.
 */
export function useExpressSetup() {
  const [loading, setLoading] = useState(false);
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const { toast } = useToast();

  const run = async () => {
    if (!currentOrg) return;
    setLoading(true);

    try {
      const orgId = currentOrg.id;
      const ownerId = currentOrg.owner_id;

      // 1. Create a free demo product
      const { error: prodErr } = await db.from('digital_products').insert({
        organization_id: orgId,
        created_by: ownerId,
        title: '📘 Ressource Gratuite de Bienvenue',
        description:
          'Ceci est un produit de démonstration créé automatiquement. Modifiez-le ou supprimez-le dans votre espace admin. Il montre comment vos ressources apparaissent aux visiteurs.',
        price: 0,
        is_free: true,
        is_published: true,
        currency: currentOrg.currency || 'XOF',
        product_type: 'digital',
      });
      if (prodErr) console.error('Express setup — product error:', prodErr);

      // 2. Create a demo donation campaign
      const { error: campErr } = await db.from('donation_campaigns').insert({
        organization_id: orgId,
        created_by: ownerId,
        title: '❤️ Soutenez notre mission',
        description:
          'Campagne de démonstration. Personnalisez le titre, la description et l\'objectif selon votre projet. Vos donateurs verront cette page.',
        goal_amount: 500000,
        current_amount: 0,
        currency: currentOrg.currency || 'XOF',
        is_active: true,
        is_published: true,
      });
      if (campErr) console.error('Express setup — campaign error:', campErr);

      // Invalidate caches
      qc.invalidateQueries({ queryKey: ['org-products'] });
      qc.invalidateQueries({ queryKey: ['org-campaigns'] });
      qc.invalidateQueries({ queryKey: ['admin-top-products'] });

      toast({
        title: '🚀 Démarrage Express terminé !',
        description: 'Un produit gratuit et une campagne de dons ont été créés. Personnalisez-les dans votre espace admin.',
      });
    } catch (err) {
      console.error('Express setup error:', err);
      toast({ title: 'Erreur', description: 'Impossible de créer le contenu de démo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return { run, loading };
}
