import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { HandCoins, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { getPublicOrigin } from '@/lib/publicUrl';
import { useUserCapabilities } from '@/hooks/useUserCapabilities';
import { FirstLinkCard } from '@/components/gagner/FirstLinkCard';
import { markSurfaceVisit } from '@/lib/siteviral/lastSurface';
import { toast } from 'sonner';
import { useNavigate } from '@/lib/router-compat';

interface FirstLink {
  url: string;
  title: string;
  commissionPercent: number | null;
}

/**
 * One tap to become an ambassador — no form, no KYC (KYC only happens at payout).
 * Activation enrolls the user on the best affiliate-enabled product and hands
 * back a ready-to-share link immediately.
 */
export function ActivateAmbassadorCard() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isFr = locale === 'fr';
  const caps = useUserCapabilities();
  const [busy, setBusy] = useState(false);
  const [firstLink, setFirstLink] = useState<FirstLink | null>(null);

  if (caps.canEarn && !firstLink) return null;
  if (firstLink) {
    return (
      <FirstLinkCard
        url={firstLink.url}
        productTitle={firstLink.title}
        commissionPercent={firstLink.commissionPercent}
      />
    );
  }

  const activate = async () => {
    if (!user) {
      navigate('/auth?intent=ambassador&redirect=/gagner');
      return;
    }
    setBusy(true);
    try {
      const { data: products } = await db
        .from('digital_products')
        .select(
          'id, title, slug, commission_rate, organization_id, organizations!inner(id, slug, affiliation_enabled, affiliation_commission_percent)',
        )
        .eq('is_published', true)
        .eq('organizations.affiliation_enabled', true)
        .order('sales_count', { ascending: false })
        .limit(1);

      const product: any = (products || [])[0];
      if (!product) {
        toast.error(
          isFr
            ? 'Aucun produit à promouvoir pour le moment.'
            : 'No product available to promote right now.',
        );
        return;
      }

      const orgId = product.organization_id;
      const { error } = await supabase.rpc('self_enroll_affiliate', { _org_id: orgId });
      if (error) throw error;

      const { data: link } = await db
        .from('affiliate_links')
        .select('code')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .maybeSingle();

      const orgSlug = product.organizations?.slug;
      const path = product.slug
        ? `/org/${orgSlug}/p/${product.slug}`
        : `/org/${orgSlug}/product/${product.id}`;
      const url = `${getPublicOrigin()}${path}${link?.code ? `?ref=${link.code}` : ''}`;

      markSurfaceVisit('earn');
      setFirstLink({
        url,
        title: product.title,
        commissionPercent:
          product.commission_rate ?? product.organizations?.affiliation_commission_percent ?? null,
      });
      qc.invalidateQueries({ queryKey: ['capabilities-earn'] });
      qc.invalidateQueries({ queryKey: ['my-aff-link'] });
      toast.success(isFr ? '🎉 Compte ambassadeur activé !' : '🎉 Ambassador account activated!');
    } catch (e: any) {
      toast.error(e?.message || (isFr ? 'Activation impossible' : 'Activation failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 glass-premium p-5 sm:p-6">
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15">
          <HandCoins className="h-6 w-6 text-emerald-500" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold leading-tight">
            {isFr ? 'Activer mon compte ambassadeur' : 'Activate my ambassador account'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isFr
              ? 'Un seul tap. Aucun formulaire, aucun document. Tu reçois ton premier lien tout de suite.'
              : 'One tap. No form, no documents. You get your first link right away.'}
          </p>
        </div>
        <Button
          onClick={activate}
          disabled={busy}
          size="lg"
          className="shrink-0 gap-2 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {isFr ? 'Activer' : 'Activate'}
        </Button>
      </div>
    </div>
  );
}
